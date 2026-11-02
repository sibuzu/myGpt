"""Select 160 distinct styles from the HTML vocabulary and report core pair coverage.

Run from any directory with Python 3.10+ and Node.js installed. The catalog is
colorless; the four material choices never count as different clothing styles.
This is a deterministic greedy set-cover selection, not a global-minimum proof.
"""

from collections import Counter
from itertools import product
from pathlib import Path
import json
import random
import subprocess


ROOT = Path(__file__).resolve().parent
SEED = 20261102
COUNT = 160
POOL_PER_MODE = 16000
EXTRACT = r"""
const fs = require('fs'), vm = require('vm');
const html = fs.readFileSync(process.argv[1], 'utf8');
const script = html.match(/<script>([\s\S]*?)<\/script>/)[1];
const context = vm.createContext({});
vm.runInContext(script.slice(0, script.lastIndexOf('\n    load();')), context);
console.log(vm.runInContext('JSON.stringify({fields,necklineRules,typeRules,order})', context));
"""
data = json.loads(subprocess.check_output(
    ['node', '-e', EXTRACT, str(ROOT / 'dress.html')], text=True))
fields = {section: {field['key']: field['options'] for field in rows
                    if field['key'] != 'color'}
          for section, rows in data['fields'].items()}
rng = random.Random(SEED)

# Pair families emphasize visible structural decisions, rather than every
# possible cross-product (e.g. a top's hem length against a skirt's fabric).
PAIR_FAMILIES = [
    ('top.type', 'top.cut'), ('top.type', 'top.neckline'),
    ('top.cut', 'top.neckline'), ('top.type', 'bottom.type'),
    ('top.cut', 'bottom.type'), ('bottom.type', 'bottom.rise'),
    ('bottom.type', 'bottom.detail'), ('bottom.type', 'bottom.slit'),
    ('top.type', 'top.fabric'), ('bottom.type', 'bottom.fabric'),
    ('dress.type', 'dress.cut'), ('dress.type', 'dress.neckline'),
    ('dress.cut', 'dress.neckline'), ('dress.type', 'dress.length'),
    ('dress.type', 'dress.waist'), ('dress.type', 'dress.detail'),
    ('dress.type', 'dress.slit'), ('dress.type', 'dress.fabric')]


def allowed(section, key, item):
    values = fields[section][key]
    rule = data['typeRules'].get(section, {}).get(item.get('type'), {})
    if key == 'cut' and 'cuts' in rule:
        values = [x for x in values if x in rule['cuts']]
    if key == 'fabric' and 'fabrics' in rule:
        values = [x for x in values if x in rule['fabrics']]
    if key == 'neckline':
        if 'necklines' in rule:
            values = [x for x in values if x in rule['necklines']]
        necklines = data['necklineRules'].get(item.get('cut'))
        if necklines is not None:
            values = [x for x in values if x in necklines]
        if section == 'dress' and item.get('type') != '改良和服':
            values = [x for x in values if x != '交領']
    if key == 'detail':
        if section == 'dress' and item.get('waist') == '寬鬆':
            values = [x for x in values if x != '腰側鏤空']
        if section == 'bottom' and item.get('type') == '百褶短裙':
            values = [x for x in values if x != '抓褶']
    return values


def variants(section):
    """Enumerate the finite, validated vocabulary for one clothing section."""
    keys = [key for key in ['type', 'cut', 'neckline', 'length', 'rise',
                           'waist', 'detail', 'slit', 'fabric']
            if key in fields[section]]

    def expand(index, item):
        if index == len(keys):
            # A readability constraint, not a claim that denser designs are
            # physically impossible. Keep examples practical for image review.
            modifiers = (['cut', 'neckline', 'length'] if section == 'top'
                         else ['rise', 'detail', 'slit'] if section == 'bottom'
                         else ['cut', 'neckline', 'waist', 'detail', 'slit'])
            limit = 4 if section == 'dress' else 2
            if sum(bool(item.get(key)) for key in modifiers) <= limit:
                yield dict(item)
            return
        key = keys[index]
        for value in allowed(section, key, item):
            item[key] = value
            yield from expand(index + 1, item)
        item.pop(key, None)

    yield from expand(0, {})


def flatten(record):
    return {section + '.' + key: value
            for section, item in record.items() for key, value in item.items()}


def features(record):
    flat = flatten(record)
    result = {('single', key, value) for key, value in flat.items()}
    for a, b in PAIR_FAMILIES:
        if a in flat and b in flat:
            result.add(('pair', a, flat[a], b, flat[b]))
    return result


def style_key(record):
    return tuple(sorted((key, value) for key, value in flatten(record).items()
                        if not key.endswith('.fabric')))


print('Enumerating valid section designs...', flush=True)
pieces = {section: list(variants(section)) for section in fields}
universe = set()
for section, items in pieces.items():
    for item in items:
        universe.update(features({section: item}))
for a, b in PAIR_FAMILIES:
    left, left_key = a.split('.')
    right, right_key = b.split('.')
    if left == right:
        continue
    for x, y in product({item[left_key] for item in pieces[left]},
                        {item[right_key] for item in pieces[right]}):
        universe.add(('pair', a, x, b, y))

ids = {feature: index for index, feature in enumerate(sorted(universe))}
full_mask = (1 << len(ids)) - 1
records, masks, seen = [], [], set()
for sections in [('top', 'bottom'), ('dress',)]:
    added = 0
    while added < POOL_PER_MODE:
        record = {section: rng.choice(pieces[section]) for section in sections}
        key = style_key(record)
        if key in seen:
            continue
        seen.add(key)
        mask = 0
        for feature in features(record):
            mask |= 1 << ids[feature]
        records.append(record)
        masks.append(mask)
        added += 1

candidate_union = 0
for mask in masks:
    candidate_union |= mask
if candidate_union != full_mask:
    raise RuntimeError('Candidate pool missed a theoretical target; increase pool size.')

print('Selecting distinct styles for core pair coverage...', flush=True)
remaining, selected = full_mask, []
while remaining and len(selected) < COUNT:
    index = max(range(len(records)), key=lambda i: (masks[i] & remaining).bit_count())
    remaining &= ~masks[index]
    selected.append(index)
if remaining:
    raise RuntimeError(f'{remaining.bit_count()} targets remain; increase pool or improve selection.')
minimum_found = len(selected)

# Fill any spare slots using secondary pair coverage, without substituting a
# different material for a style that was already selected.
secondary = set()


def secondary_features(record):
    flat = flatten(record)
    keys = sorted(flat)
    return {(a, flat[a], b, flat[b]) for i, a in enumerate(keys)
            for b in keys[i + 1:]}


for index in selected:
    secondary.update(secondary_features(records[index]))
chosen = set(selected)
while len(selected) < COUNT:
    index = max((i for i in range(len(records)) if i not in chosen),
                key=lambda i: len(secondary_features(records[i]) - secondary))
    selected.append(index)
    chosen.add(index)
    secondary.update(secondary_features(records[index]))

# First ten: every top base type and all five dress families. Favor new visual
# attributes and distinct skirt shapes. These become the next runway preview.
preview, preview_features, used_skirts = [], set(), set()
categories = [('top', '上衣'), ('dress', '洋裝'), ('top', '襯衫'),
              ('dress', '襯衫洋裝'), ('top', '背心'), ('dress', '裹身洋裝'),
              ('top', 'T恤'), ('dress', '旗袍'), ('top', None), ('dress', '改良和服')]
for section, kind in categories:
    choices = [i for i in selected if i not in preview and section in records[i]
               and (kind is None or records[i][section]['type'] == kind)]
    if section == 'top':
        distinct = [i for i in choices if records[i]['bottom']['type'] not in used_skirts]
        if distinct:
            choices = distinct
    index = max(choices, key=lambda i: len(features(records[i]) - preview_features))
    preview.append(index)
    preview_features.update(features(records[index]))
    if section == 'top':
        used_skirts.add(records[index]['bottom']['type'])
ordered = preview + [i for i in selected if i not in preview]


def describe(record):
    return '+'.join(''.join(item.get(key, '') for key in data['order'][section])
                    for section, item in record.items())


looks = [{'number': n, 'mode': 'dress' if 'dress' in records[i] else 'separates',
          'title': describe(records[i]), 'selection': records[i]}
         for n, i in enumerate(ordered, 1)]
titles = [look['title'] for look in looks]
assert len(looks) == COUNT and len(set(titles)) == COUNT
assert len({style_key(records[i]) for i in ordered}) == COUNT
assert not any('褲' in title or '色' in title for title in titles)
for record in (records[i] for i in ordered):
    for section, item in record.items():
        for key, value in item.items():
            assert value in allowed(section, key, item)

groups = []
for a, b in PAIR_FAMILIES:
    possible = {x for x in universe if x[0] == 'pair' and x[1] == a and x[3] == b}
    covered = set().union(*(features(records[i]) & possible for i in ordered))
    groups.append({'fields': [a, b], 'covered': len(covered), 'possible': len(possible)})
report = {
    'count': COUNT, 'seed': SEED, 'candidate_count': len(records),
    'method': 'Greedy set cover over 18 core pair families, then secondary-pair fill',
    'scope': 'Finite HTML vocabulary with compatibility and readability rules; not all permutations',
    'global_minimum_proven': False,
    'single_targets': sum(x[0] == 'single' for x in universe),
    'core_pair_targets': sum(x[0] == 'pair' for x in universe),
    'core_targets_covered_percent': 100,
    'greedy_cover_count_before_fill': minimum_found,
    'mode_counts': dict(Counter(look['mode'] for look in looks)),
    'deduplication': 'All material fields excluded from clothing-style identity',
    'materials': ['雪紡', '絲綢', '天鵝絨', '無'], 'colors': False, 'pants': False,
    'preview_numbers': list(range(1, 11)), 'pair_families': groups,
    'readability_limits': {'top_modifiers': 2, 'skirt_modifiers': 2, 'dress_modifiers_excluding_length': 4}}
(ROOT / 'dress1.txt').write_text(''.join(f"{look['number']}. {look['title']}\n" for look in looks))
(ROOT / 'selection.json').write_text(json.dumps({'report': report, 'looks': looks}, ensure_ascii=False, indent=2) + '\n')
print(json.dumps(report, ensure_ascii=False, indent=2))
print('Preview:', *(look['title'] for look in looks[:10]), sep='\n')
