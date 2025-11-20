export class WebcamMotionController {
  private video?: HTMLVideoElement;
  private canvas?: HTMLCanvasElement;
  private ctx?: CanvasRenderingContext2D | null;
  private prevFrame?: ImageData;
  private enabled = false;

  async init(): Promise<void> {
    if (!navigator.mediaDevices) return;
    try {
      this.video = document.createElement('video');
      this.video.autoplay = true;
      this.video.muted = true;
      this.video.playsInline = true;
      this.video.style.display = 'none';
      const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 320, height: 240 } });
      this.video.srcObject = stream;
      await this.video.play();
      this.canvas = document.createElement('canvas');
      this.canvas.width = 160;
      this.canvas.height = 120;
      this.ctx = this.canvas.getContext('2d');
      this.enabled = true;
    } catch (error) {
      console.warn('[Webcam] Permission denied or unavailable', error);
    }
  }

  getMotion(): number {
    if (!this.enabled || !this.ctx || !this.video) return 0;
    if (this.video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA) return 0;
    this.ctx.drawImage(this.video, 0, 0, this.canvas!.width, this.canvas!.height);
    const frame = this.ctx.getImageData(0, 0, this.canvas!.width, this.canvas!.height);
    if (!this.prevFrame) {
      this.prevFrame = frame;
      return 0;
    }
    let diff = 0;
    for (let i = 0; i < frame.data.length; i += 4) {
      diff += Math.abs(frame.data[i] - this.prevFrame.data[i]);
    }
    this.prevFrame = frame;
    const normalized = Math.min(1, diff / (frame.data.length * 255 * 0.2));
    return normalized;
  }

  getVideoElement(): HTMLVideoElement | undefined {
    return this.video;
  }

  hasFrame(): boolean {
    return Boolean(this.video && this.video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA);
  }
}
