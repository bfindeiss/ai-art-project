export class AmbientAudioController {
  private audio?: HTMLAudioElement;
  private enabled = false;

  constructor(private url?: string) {}

  load(): void {
    if (!this.url) return;
    this.audio = new Audio(this.url);
    this.audio.loop = true;
    this.audio.volume = 0.4;
  }

  play(): void {
    if (this.audio) {
      this.audio
        .play()
        .then(() => (this.enabled = true))
        .catch((err) => console.warn('[Audio] autoplay prevented', err));
    }
  }

  fadeTo(volume: number): void {
    if (!this.audio) return;
    this.audio.volume = Math.max(0, Math.min(1, volume));
  }
}
