export class SensorStatusBadge {
  private container: HTMLDivElement;
  private micIndicator: HTMLSpanElement;
  private camIndicator: HTMLSpanElement;

  constructor() {
    this.container = document.createElement('div');
    Object.assign(this.container.style, {
      position: 'fixed',
      top: '20px',
      left: '20px',
      padding: '10px 12px',
      background: 'rgba(0, 0, 0, 0.6)',
      color: '#e6ecff',
      fontFamily: "'Inter', sans-serif",
      fontSize: '12px',
      borderRadius: '10px',
      border: '1px solid rgba(255, 255, 255, 0.14)',
      backdropFilter: 'blur(6px)',
      zIndex: '999'
    });

    this.micIndicator = document.createElement('span');
    this.camIndicator = document.createElement('span');
    this.container.append(this.micIndicator, document.createTextNode(' · '), this.camIndicator);
    document.body.appendChild(this.container);
  }

  update({ microphone, webcam }: { microphone: boolean; webcam: boolean }): void {
    this.micIndicator.textContent = microphone ? 'Mic: aktiv' : 'Mic: aus';
    this.micIndicator.style.color = microphone ? '#7ee0a3' : '#fca5a5';
    this.camIndicator.textContent = webcam ? 'Cam: aktiv' : 'Cam: aus';
    this.camIndicator.style.color = webcam ? '#7dd3fc' : '#fca5a5';
  }

  dispose(): void {
    this.container.remove();
  }
}
