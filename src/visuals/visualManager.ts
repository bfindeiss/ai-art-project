import * as THREE from 'three';
import { VisualModule } from './base';
import { NeuralFlow } from './NeuralFlow';
import { SynapseParticles } from './SynapseParticles';
import { AIGridMorph } from './AIGridMorph';

export class VisualManager {
  private modules: VisualModule[] = [];
  private group = new THREE.Group();

  constructor(private scene: THREE.Scene) {}

  init(maxParticles: number): void {
    this.modules = [
      new NeuralFlow(maxParticles * 0.1),
      new SynapseParticles(maxParticles * 0.6),
      new AIGridMorph()
    ];

    this.modules.forEach((module) => this.group.add(module.object3d));
    this.scene.add(this.group);
  }

  update(delta: number, elapsed: number): void {
    for (const module of this.modules) {
      module.update(delta, elapsed);
    }
  }

  setAudioLevel(level: number): void {
    for (const module of this.modules) {
      module.setAudioLevel?.(level);
    }
  }

  setMotionIntensity(level: number): void {
    for (const module of this.modules) {
      module.setMotionIntensity?.(level);
    }
  }

  dispose(): void {
    this.scene.remove(this.group);
    this.group.traverse((child) => {
      if ((child as THREE.Mesh).geometry) {
        (child as THREE.Mesh).geometry.dispose();
      }
      if ((child as THREE.Mesh).material) {
        const material = (child as THREE.Mesh).material;
        if (Array.isArray(material)) {
          material.forEach((m) => m.dispose());
        } else {
          material.dispose();
        }
      }
    });
  }
}
