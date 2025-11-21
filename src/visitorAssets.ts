import * as THREE from 'three';

type Listener = (textures: THREE.Texture[]) => void;

export class VisitorAssetPool {
  private textures: THREE.Texture[] = [];
  private listeners: Listener[] = [];

  constructor() {
    // Add a default procedural texture so the scene is never empty
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = '#0c1f26';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      const gradient = ctx.createRadialGradient(128, 128, 20, 128, 128, 120);
      gradient.addColorStop(0, '#8ad8ff');
      gradient.addColorStop(0.4, '#9cf6d7');
      gradient.addColorStop(1, '#0a1a1f');
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(128, 128, 110, 0, Math.PI * 2);
      ctx.fill();
      this.textures.push(new THREE.CanvasTexture(canvas));
    }
  }

  getTextures(): THREE.Texture[] {
    return this.textures;
  }

  async addFromFile(file: File): Promise<void> {
    const url = await this.readFileAsDataUrl(file);
    const texture = await this.loadTexture(url);
    texture.colorSpace = THREE.SRGBColorSpace;
    this.textures.push(texture);
    this.notify();
  }

  onChange(listener: Listener): void {
    this.listeners.push(listener);
  }

  private notify(): void {
    this.listeners.forEach((listener) => listener(this.textures));
  }

  private readFileAsDataUrl(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(file);
    });
  }

  private loadTexture(url: string): Promise<THREE.Texture> {
    return new Promise((resolve, reject) => {
      const loader = new THREE.TextureLoader();
      loader.load(url, (texture) => resolve(texture), undefined, reject);
    });
  }
}
