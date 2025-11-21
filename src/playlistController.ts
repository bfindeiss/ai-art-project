import { PlaylistConfig } from './config';

export interface SceneConfig {
  module: string;
  duration: number;
  title?: string;
  description?: string;
  fadeSeconds?: number;
}

export class PlaylistController {
  private scenes: SceneConfig[];
  private activeIndex = 0;
  private timeInScene = 0;
  onSceneChange?: (scene: SceneConfig) => void;

  constructor(config: PlaylistConfig) {
    this.scenes = config.length ? config : [];
  }

  start(): void {
    this.timeInScene = 0;
    this.activeIndex = 0;
    const scene = this.getActiveScene();
    if (scene) {
      this.onSceneChange?.(scene);
    }
  }

  update(delta: number, isPaused: boolean): void {
    if (isPaused || !this.scenes.length) return;
    this.timeInScene += delta;
    const scene = this.getActiveScene();
    if (!scene) return;

    const fadeBuffer = Math.max(2, scene.fadeSeconds ?? 3);
    if (this.timeInScene >= scene.duration - fadeBuffer) {
      this.next();
    }
  }

  next(): void {
    if (!this.scenes.length) return;
    this.activeIndex = (this.activeIndex + 1) % this.scenes.length;
    this.timeInScene = 0;
    const scene = this.getActiveScene();
    if (scene) {
      this.onSceneChange?.(scene);
    }
  }

  previous(): void {
    if (!this.scenes.length) return;
    this.activeIndex = (this.activeIndex - 1 + this.scenes.length) % this.scenes.length;
    this.timeInScene = 0;
    const scene = this.getActiveScene();
    if (scene) {
      this.onSceneChange?.(scene);
    }
  }

  setScene(index: number): void {
    if (!this.scenes.length) return;
    const clamped = Math.max(0, Math.min(this.scenes.length - 1, index));
    this.activeIndex = clamped;
    this.timeInScene = 0;
    const scene = this.getActiveScene();
    if (scene) {
      this.onSceneChange?.(scene);
    }
  }

  getActiveScene(): SceneConfig | undefined {
    return this.scenes[this.activeIndex];
  }
}
