export class OnScreenDisplay {
  private container: HTMLDivElement;
  private hideTimeout?: number;

  constructor() {
    this.container = document.createElement('div');
    this.container.setAttribute('aria-live', 'polite');
    this.container.setAttribute('role', 'status');
    Object.assign(this.container.style, {
      position: 'fixed',
      top: '20px',
      right: '20px',
      padding: '12px 16px',
      background: 'rgba(0, 0, 0, 0.7)',
      color: '#e6ecff',
      fontFamily: "'Inter', sans-serif",
      fontSize: '14px',
      letterSpacing: '0.04em',
      borderRadius: '10px',
      border: '1px solid rgba(255, 255, 255, 0.14)',
      boxShadow: '0 10px 40px rgba(0, 0, 0, 0.35)',
      backdropFilter: 'blur(6px)',
      pointerEvents: 'none',
      opacity: '0',
      transition: 'opacity 180ms ease',
      zIndex: '999'
    });

    document.body.appendChild(this.container);
  }

  show(lines: string[], durationMs = 3000): void {
    this.container.innerHTML = lines.map((line) => `<div>${line}</div>`).join('');
    this.container.style.opacity = '1';

    if (this.hideTimeout) {
      window.clearTimeout(this.hideTimeout);
    }

    this.hideTimeout = window.setTimeout(() => this.hide(), durationMs);
  }

  hide(): void {
    this.container.style.opacity = '0';
  }

  dispose(): void {
    if (this.hideTimeout) {
      window.clearTimeout(this.hideTimeout);
    }
    this.container.remove();
  }
}
