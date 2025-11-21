import { SceneConfig } from './playlistController';

export class SceneInfoBanner {
  private container: HTMLDivElement;
  private titleEl: HTMLDivElement;
  private descriptionEl: HTMLDivElement;

  constructor() {
    this.container = document.createElement('div');
    Object.assign(this.container.style, {
      position: 'fixed',
      left: '20px',
      top: '70px',
      maxWidth: '420px',
      padding: '12px 14px',
      background: 'rgba(0, 0, 0, 0.55)',
      color: '#e6ecff',
      fontFamily: "'Inter', sans-serif",
      fontSize: '14px',
      lineHeight: '1.5',
      borderRadius: '12px',
      border: '1px solid rgba(255, 255, 255, 0.14)',
      boxShadow: '0 14px 40px rgba(0,0,0,0.35)',
      backdropFilter: 'blur(6px)',
      zIndex: '990'
    });

    this.titleEl = document.createElement('div');
    Object.assign(this.titleEl.style, { fontWeight: '700', marginBottom: '6px', letterSpacing: '0.04em' });
    this.descriptionEl = document.createElement('div');
    Object.assign(this.descriptionEl.style, { opacity: '0.85' });

    this.container.append(this.titleEl, this.descriptionEl);
    document.body.appendChild(this.container);
  }

  show(scene: SceneConfig): void {
    this.titleEl.textContent = scene.title ?? scene.module;
    this.descriptionEl.textContent = scene.description ?? '';
  }

  dispose(): void {
    this.container.remove();
  }
}
