class SttPcmProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    this.buffer = new Int16Array(4096);
    this.offset = 0;
    this.stopped = false;
    this.port.onmessage = () => {
      this.stopped = true;
      if (this.offset) this.port.postMessage(this.buffer.slice(0, this.offset).buffer);
      this.port.postMessage('flushed');
    };
  }

  process(inputs) {
    if (this.stopped) return true;
    const input = inputs[0]?.[0];
    if (!input) return true;
    for (let index = 0; index < input.length; index++) {
      const sample = Math.max(-1, Math.min(1, input[index]));
      this.buffer[this.offset++] = sample < 0 ? sample * 32768 : sample * 32767;
      if (this.offset === this.buffer.length) {
        this.port.postMessage(this.buffer.buffer, [this.buffer.buffer]);
        this.buffer = new Int16Array(4096);
        this.offset = 0;
      }
    }
    return true;
  }
}

registerProcessor('stt-pcm-processor', SttPcmProcessor);
