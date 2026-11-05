const isInputState = state => state === 'input-mode' || state === 'edit-mode';

export class PromptQueue {
  constructor({ send, onChange = () => {}, onError = () => {}, paused = true }) {
    Object.assign(this, { send, onChange, onError, paused });
    this.items = [];
    this.state = null;
    this.sending = false;
    this.awaitingResponse = false;
    this.responseStarted = false;
  }

  enqueue(prompts) {
    this.items.push(...prompts.map(text => ({ text })));
    this.onChange(this.items);
    return this.process();
  }

  clear() {
    this.items = [];
    this.onChange(this.items);
  }

  setPaused(paused) {
    this.paused = paused;
    return this.process();
  }

  setState(state) {
    this.state = state;
    if (state === 'running') this.responseStarted = true;
    if (isInputState(state) && this.responseStarted) {
      this.awaitingResponse = false;
      this.responseStarted = false;
    }
    return this.process();
  }

  async process() {
    if (this.paused || this.sending || this.awaitingResponse || !isInputState(this.state) || !this.items.length) return;
    const item = this.items[0];
    this.sending = true;
    this.awaitingResponse = true;
    try {
      await this.send(item.text);
      // Clear may have removed this item while sending; preserve newly queued items.
      this.items = this.items.filter(entry => entry !== item);
      this.onChange(this.items);
    } catch (error) {
      this.awaitingResponse = false;
      this.responseStarted = false;
      this.paused = true;
      this.onError(error);
    } finally {
      this.sending = false;
    }
    return this.process();
  }
}
