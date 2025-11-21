import * as THREE from 'three';

export class FadeOverlay {
  private material: THREE.MeshBasicMaterial;
  readonly object3d: THREE.Mesh;
  private opacity = 0;
  private target = 0;

  constructor() {
    const geometry = new THREE.PlaneGeometry(2, 2);
    this.material = new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0 });
    this.object3d = new THREE.Mesh(geometry, this.material);
    this.object3d.renderOrder = 999;
  }

  fadeIn(): void {
    this.target = 1;
  }

  fadeOut(): void {
    this.target = 0;
  }

  update(delta: number): void {
    this.opacity = THREE.MathUtils.damp(this.opacity, this.target, 8, delta);
    this.material.opacity = THREE.MathUtils.clamp(this.opacity, 0, 1);
  }

  isOpaque(): boolean {
    return this.material.opacity >= 0.95;
  }
}
