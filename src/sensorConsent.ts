interface SensorConsentCallbacks {
  onConfirm: (opts: { microphone: boolean; webcam: boolean }) => void;
}

export class SensorConsentOverlay {
  private container: HTMLDivElement;
  private checkboxMic: HTMLInputElement;
  private checkboxCam: HTMLInputElement;
  private hidden = false;

  constructor(private callbacks: SensorConsentCallbacks) {
    this.container = document.createElement('div');
    Object.assign(this.container.style, {
      position: 'fixed',
      inset: '0',
      background: 'rgba(0, 0, 0, 0.72)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: '1000',
      color: '#e6ecff',
      fontFamily: "'Inter', sans-serif"
    });

    const card = document.createElement('div');
    Object.assign(card.style, {
      padding: '24px',
      width: '340px',
      background: 'rgba(6, 14, 20, 0.9)',
      borderRadius: '16px',
      border: '1px solid rgba(255, 255, 255, 0.2)',
      boxShadow: '0 26px 80px rgba(0,0,0,0.45)'
    });

    const title = document.createElement('div');
    title.textContent = 'Sensor-Opt-in';
    Object.assign(title.style, { fontSize: '18px', fontWeight: '700', marginBottom: '8px' });

    const copy = document.createElement('div');
    copy.textContent = 'Die Installation kann Mikrofon und Kamera nutzen, um auf Klang und Bewegung zu reagieren. Bitte wähle aus:';
    Object.assign(copy.style, { fontSize: '14px', lineHeight: '1.5', marginBottom: '14px', opacity: '0.85' });

    this.checkboxMic = document.createElement('input');
    this.checkboxMic.type = 'checkbox';
    this.checkboxMic.id = 'mic-optin';
    this.checkboxMic.checked = true;
    const micLabel = document.createElement('label');
    micLabel.textContent = 'Mikrofon aktivieren';
    micLabel.htmlFor = this.checkboxMic.id;

    this.checkboxCam = document.createElement('input');
    this.checkboxCam.type = 'checkbox';
    this.checkboxCam.id = 'cam-optin';
    this.checkboxCam.checked = true;
    const camLabel = document.createElement('label');
    camLabel.textContent = 'Kamera aktivieren';
    camLabel.htmlFor = this.checkboxCam.id;

    const micRow = this.makeRow(this.checkboxMic, micLabel);
    const camRow = this.makeRow(this.checkboxCam, camLabel);

    const button = document.createElement('button');
    button.textContent = 'Start';
    Object.assign(button.style, {
      width: '100%',
      marginTop: '16px',
      padding: '12px',
      borderRadius: '12px',
      background: 'linear-gradient(120deg, #5eead4, #38bdf8)',
      border: 'none',
      color: '#04131a',
      fontWeight: '700',
      cursor: 'pointer'
    });

    button.onclick = () => {
      this.hide();
      this.callbacks.onConfirm({ microphone: this.checkboxMic.checked, webcam: this.checkboxCam.checked });
    };

    card.append(title, copy, micRow, camRow, button);
    this.container.appendChild(card);
    document.body.appendChild(this.container);
  }

  private makeRow(input: HTMLInputElement, label: HTMLLabelElement): HTMLDivElement {
    const row = document.createElement('div');
    Object.assign(row.style, { display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' });
    row.append(input, label);
    return row;
  }

  hide(): void {
    if (this.hidden) return;
    this.hidden = true;
    this.container.remove();
  }
}
