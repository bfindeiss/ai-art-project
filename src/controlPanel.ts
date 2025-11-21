interface ControlCallbacks {
  onNext: () => void;
  onPrevious: () => void;
  onTogglePause: () => void;
  onSensitivityChange: (type: 'audio' | 'motion', delta: number) => void;
  onSyncPlaylist?: () => void;
}

export class ControlPanel {
  private container: HTMLDivElement;
  private playState = 'Pause';

  constructor(private callbacks: ControlCallbacks) {
    this.container = document.createElement('div');
    Object.assign(this.container.style, {
      position: 'fixed',
      right: '20px',
      bottom: '20px',
      padding: '12px 14px',
      width: '240px',
      background: 'rgba(0, 0, 0, 0.55)',
      color: '#e6ecff',
      fontFamily: "'Inter', sans-serif",
      fontSize: '13px',
      lineHeight: '1.45',
      borderRadius: '12px',
      border: '1px solid rgba(255, 255, 255, 0.16)',
      boxShadow: '0 18px 50px rgba(0, 0, 0, 0.35)',
      backdropFilter: 'blur(6px)',
      zIndex: '990'
    });

    const header = document.createElement('div');
    header.textContent = 'Operator Panel';
    Object.assign(header.style, {
      fontWeight: '700',
      marginBottom: '10px',
      letterSpacing: '0.04em'
    });

    const buttonRow = document.createElement('div');
    Object.assign(buttonRow.style, { display: 'flex', gap: '8px', marginBottom: '10px' });

    const prev = this.createButton('◀︎');
    prev.onclick = () => this.callbacks.onPrevious();
    const playPause = this.createButton('Play/Pause');
    playPause.onclick = () => {
      this.callbacks.onTogglePause();
      this.playState = this.playState === 'Pause' ? 'Play' : 'Pause';
    };
    const next = this.createButton('▶︎');
    next.onclick = () => this.callbacks.onNext();

    buttonRow.append(prev, playPause, next);

    const sensLabel = document.createElement('div');
    sensLabel.textContent = 'Sensitivity';
    Object.assign(sensLabel.style, { fontWeight: '600', marginBottom: '6px' });

    const sensRow = document.createElement('div');
    Object.assign(sensRow.style, { display: 'flex', gap: '8px', flexWrap: 'wrap' });

    const audioUp = this.createButton('Audio +');
    const audioDown = this.createButton('Audio -');
    audioUp.onclick = () => this.callbacks.onSensitivityChange('audio', 0.1);
    audioDown.onclick = () => this.callbacks.onSensitivityChange('audio', -0.1);

    const motionUp = this.createButton('Motion +');
    const motionDown = this.createButton('Motion -');
    motionUp.onclick = () => this.callbacks.onSensitivityChange('motion', 0.1);
    motionDown.onclick = () => this.callbacks.onSensitivityChange('motion', -0.1);

    sensRow.append(audioUp, audioDown, motionUp, motionDown);

    const syncBtn = this.createButton('Sync Playlist');
    syncBtn.style.marginTop = '10px';
    syncBtn.onclick = () => this.callbacks.onSyncPlaylist?.();

    this.container.append(header, buttonRow, sensLabel, sensRow, syncBtn);
    document.body.appendChild(this.container);
  }

  dispose(): void {
    this.container.remove();
  }

  private createButton(label: string): HTMLButtonElement {
    const btn = document.createElement('button');
    btn.textContent = label;
    Object.assign(btn.style, {
      flex: '1',
      padding: '8px 10px',
      background: 'rgba(255, 255, 255, 0.08)',
      color: '#e6ecff',
      border: '1px solid rgba(255, 255, 255, 0.2)',
      borderRadius: '10px',
      cursor: 'pointer'
    });
    btn.onmouseenter = () => (btn.style.background = 'rgba(255, 255, 255, 0.16)');
    btn.onmouseleave = () => (btn.style.background = 'rgba(255, 255, 255, 0.08)');
    return btn;
  }
}
