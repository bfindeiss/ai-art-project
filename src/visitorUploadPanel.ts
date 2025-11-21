import { VisitorAssetPool } from './visitorAssets';

export class VisitorUploadPanel {
  private container: HTMLDivElement;
  private info: HTMLDivElement;

  constructor(private pool: VisitorAssetPool) {
    this.container = document.createElement('div');
    this.container.setAttribute('aria-label', 'Visitor upload panel');
    Object.assign(this.container.style, {
      position: 'fixed',
      left: '20px',
      bottom: '20px',
      padding: '12px 14px',
      width: '280px',
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

    const title = document.createElement('div');
    title.textContent = 'Visitor Garden';
    Object.assign(title.style, {
      fontWeight: '700',
      marginBottom: '6px',
      letterSpacing: '0.04em'
    });

    const hint = document.createElement('div');
    hint.textContent = 'Lade PNG/JPG/SVG hoch – sie erscheinen als Pixel Flowers.';
    Object.assign(hint.style, { marginBottom: '10px', opacity: '0.8' });

    const dropzone = document.createElement('label');
    dropzone.textContent = 'Datei auswählen oder hier ablegen';
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/png,image/jpeg,image/svg+xml';
    input.multiple = true;
    dropzone.appendChild(input);
    Object.assign(dropzone.style, {
      display: 'block',
      padding: '10px',
      textAlign: 'center',
      border: '1px dashed rgba(255, 255, 255, 0.35)',
      borderRadius: '10px',
      cursor: 'pointer',
      marginBottom: '8px',
      background: 'rgba(255, 255, 255, 0.04)'
    });

    this.info = document.createElement('div');
    Object.assign(this.info.style, { fontSize: '12px', opacity: '0.7' });
    this.info.textContent = 'Noch keine Uploads';

    input.addEventListener('change', (event) => {
      const files = (event.target as HTMLInputElement).files;
      this.processFiles(files);
    });

    dropzone.addEventListener('dragover', (event) => {
      event.preventDefault();
      dropzone.style.borderColor = '#7dd3fc';
    });

    dropzone.addEventListener('dragleave', () => {
      dropzone.style.borderColor = 'rgba(255, 255, 255, 0.35)';
    });

    dropzone.addEventListener('drop', (event) => {
      event.preventDefault();
      dropzone.style.borderColor = 'rgba(255, 255, 255, 0.35)';
      const files = event.dataTransfer?.files;
      this.processFiles(files);
    });

    this.pool.onChange((textures) => {
      this.info.textContent = `${textures.length} Motive aktiv`;
    });

    this.container.appendChild(title);
    this.container.appendChild(hint);
    this.container.appendChild(dropzone);
    this.container.appendChild(this.info);
    document.body.appendChild(this.container);
  }

  private async processFiles(fileList: FileList | null | undefined): Promise<void> {
    if (!fileList) return;
    for (const file of Array.from(fileList)) {
      try {
        await this.pool.addFromFile(file);
      } catch (error) {
        console.error('[VisitorUploadPanel] Failed to load', error);
      }
    }
  }

  dispose(): void {
    this.container.remove();
  }
}
