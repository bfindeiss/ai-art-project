export class MicrophoneController {
  private analyser?: AnalyserNode;
  private dataArray?: Uint8Array;
  private enabled = false;

  async init(): Promise<void> {
    if (!navigator.mediaDevices) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      const audioContext = new AudioContext();
      const source = audioContext.createMediaStreamSource(stream);
      this.analyser = audioContext.createAnalyser();
      this.analyser.fftSize = 1024;
      source.connect(this.analyser);
      this.dataArray = new Uint8Array(this.analyser.frequencyBinCount);
      this.enabled = true;
    } catch (error) {
      console.warn('[Mic] Permission denied or unavailable', error);
    }
  }

  getLevel(): number {
    if (!this.enabled || !this.analyser || !this.dataArray) return 0;
    this.analyser.getByteFrequencyData(this.dataArray);
    const avg = this.dataArray.reduce((sum, v) => sum + v, 0) / this.dataArray.length;
    return Math.min(1, avg / 180);
  }
}
