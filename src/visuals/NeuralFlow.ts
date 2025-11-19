import * as THREE from 'three';
import { VisualModule } from './base';

interface Ribbon {
  mesh: THREE.Line;
  offset: number;
  speed: number;
}

export class NeuralFlow implements VisualModule {
  public object3d: THREE.Group = new THREE.Group();
  private ribbons: Ribbon[] = [];
  private material: THREE.LineBasicMaterial;
  private segments: number;
  private audioLevel = 0;

  constructor(maxPoints = 2000) {
    this.segments = Math.max(24, Math.floor(maxPoints / 40));
    this.material = new THREE.LineBasicMaterial({
      color: new THREE.Color('#76d5ff'),
      transparent: true,
      opacity: 0.35,
      linewidth: 2
    });

    const ribbonCount = Math.max(6, Math.floor(maxPoints / 400));
    for (let i = 0; i < ribbonCount; i++) {
      const geometry = new THREE.BufferGeometry();
      const positions = new Float32Array(this.segments * 3);
      geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      const line = new THREE.Line(geometry, this.material);
      line.userData.positions = positions;
      line.position.set(0, THREE.MathUtils.randFloatSpread(0.5), 0);
      this.object3d.add(line);
      this.ribbons.push({
        mesh: line,
        offset: Math.random() * Math.PI * 2,
        speed: THREE.MathUtils.randFloat(0.02, 0.08)
      });
    }
  }

  update(_delta: number, elapsed: number): void {
    this.ribbons.forEach((ribbon, index) => {
      const positions = ribbon.mesh.userData.positions as Float32Array;
      const phase = ribbon.offset + elapsed * ribbon.speed;
      for (let i = 0; i < this.segments; i++) {
        const t = i / (this.segments - 1);
        const angle = phase + t * Math.PI * 4.0;
        const radius = 3.0 + Math.sin(phase * 0.5 + index) * 0.3;
        positions[i * 3] = Math.cos(angle) * radius;
        positions[i * 3 + 1] = Math.sin(angle * 0.5) * 1.2 + Math.sin(angle * 0.25 + index);
        positions[i * 3 + 2] = Math.sin(angle) * radius;
      }
      const buffer = ribbon.mesh.geometry.getAttribute('position');
      buffer.needsUpdate = true;
      const material = ribbon.mesh.material as THREE.LineBasicMaterial;
      material.opacity = THREE.MathUtils.lerp(0.2, 0.6, this.audioLevel);
    });
  }

  setAudioLevel(value: number): void {
    this.audioLevel = THREE.MathUtils.clamp(value, 0, 1);
  }
}
