"""Replace anime prompt subjects and captions using the character catalog.

Run from any directory: python3 /path/to/dress/replace_title.py
Read anime_dress_title.txt and write anime_dress_final.txt by default.
"""

import argparse
import json
from pathlib import Path
import re


ROOT = Path(__file__).resolve().parent
ENTRY = re.compile(
    r'^(?P<header>(?P<id>\d+)#(?P<outfit>[1-4])｜[^\r\n]+\r?\n)'
    r'(?P<prompt>[^\r\n]+)',
    re.MULTILINE,
)
SUBJECT = re.compile(r'^一位氣質[^\r\n]*?的成年日本年輕女性，')
FACE = '臉部五官，'
PRESERVED_FACE = FACE + '保留原角色的'
PLACEHOLDER = '「TITLE《THEME》」'


def read_characters(path):
    """Read the JSON-compatible exported array without executing JavaScript."""
    source = path.read_text(encoding='utf-8-sig')
    declaration = re.match(r'\s*export\s+const\s+ANIME_CHARACTERS\s*=\s*', source)
    if not declaration:
        raise ValueError(f'{path}: 找不到 ANIME_CHARACTERS 宣告')
    rows, end = json.JSONDecoder().raw_decode(source, declaration.end())
    if not isinstance(rows, list) or source[end:].strip() not in ('', ';'):
        raise ValueError(f'{path}: 預期為 JSON 格式的角色陣列')

    characters = {}
    for row in rows:
        character_id = row['id']
        if type(character_id) is not int or character_id < 1 or character_id in characters:
            raise ValueError(f'{path}: 無效或重複的角色編號 {character_id}')
        character = {
            'id': character_id,
            'jaName': row['jaName'],
            'workJa': row['workJa'],
            'captionName': row.get('captionName') or row['jaName'],
        }
        if any(not isinstance(character[key], str) or not character[key].strip()
               for key in ('jaName', 'workJa', 'captionName')):
            raise ValueError(f'{path}: 角色 {character_id} 的姓名或作品名稱無效')
        characters[character_id] = character
    return characters


def replace_titles(text, characters):
    changed = 0
    seen = set()

    def replace_entry(match):
        nonlocal changed
        character_id = int(match['id'])
        entry_id = (character_id, int(match['outfit']))
        if entry_id in seen:
            raise ValueError(f'重複的提示詞編號：{match["id"]}#{match["outfit"]}')
        seen.add(entry_id)
        if character_id not in characters:
            raise ValueError(f'找不到角色編號 {character_id}')
        character = characters[character_id]
        original = match['prompt']
        subject = f'以《{character["workJa"]}》的 {character["jaName"]} 為主角，'
        prompt, count = SUBJECT.subn(lambda _: subject, original, count=1)
        if not count and not prompt.startswith(subject):
            raise ValueError(f'{match["id"]}#{match["outfit"]}: 找不到預期的人物開頭')
        if FACE not in prompt:
            raise ValueError(f'{match["id"]}#{match["outfit"]}: 找不到「{FACE}」')
        if PRESERVED_FACE not in prompt:
            prompt = prompt.replace(FACE, PRESERVED_FACE, 1)
        caption = f'「{character["captionName"]}《{character["workJa"]}》」'
        prompt = prompt.replace(PLACEHOLDER, caption)
        if caption not in prompt:
            raise ValueError(f'{match["id"]}#{match["outfit"]}: 找不到標題佔位文字或預期標題')
        changed += prompt != original
        return match['header'] + prompt

    result = ENTRY.sub(replace_entry, text)
    if not seen or ENTRY.sub('', text).strip():
        raise ValueError('提示詞須使用「01#1｜標題」與下一行完整內文的格式')
    return result, changed, len(seen)


def main():
    parser = argparse.ArgumentParser(description='依角色編號替換動漫提示詞的主角、特徵前綴與標題。')
    parser.add_argument('--characters', type=Path, default=ROOT.parent / 'extension/anime-characters.js')
    parser.add_argument('--input', type=Path, default=ROOT / 'anime_dress_title.txt')
    parser.add_argument('--output', type=Path, default=ROOT / 'anime_dress_final.txt', help='輸出路徑；預設為 anime_dress_final.txt')
    args = parser.parse_args()
    try:
        characters = read_characters(args.characters)
        source = args.input.read_bytes().decode('utf-8-sig')
        result, changed, total = replace_titles(source, characters)
        output = args.output
        if output.resolve() != args.input.resolve() or changed:
            output.write_bytes(result.encode('utf-8'))
    except (OSError, ValueError, KeyError, TypeError) as error:
        parser.exit(1, f'錯誤：{error}\n')
    print(f'已讀取 {len(characters)} 位角色，處理 {total} 則，更新 {changed} 則：{output}')


if __name__ == '__main__':
    main()
