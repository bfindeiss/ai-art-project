import * as THREE from 'three';
import { VisualModule } from './base';
import { NeuralFlow } from './NeuralFlow';
import { SynapseParticles } from './SynapseParticles';
import { AIGridMorph } from './AIGridMorph';
import { PulseRings } from './PulseRings';
import { AuroraVeil } from './AuroraVeil';
import { SensorSpectrum } from './SensorSpectrum';
import { BloomGarden } from './BloomGarden';
import { VisitorAssetPool } from '../visitorAssets';

interface ManagedVisual {
  name: string;
  module: VisualModule;
}

export class VisualManager {
  private modules: ManagedVisual[] = [];
  private group = new THREE.Group();
  private activeIndex = 0;

  constructor(private scene: THREE.Scene, private visitorAssets: VisitorAssetPool) {}

  init(maxParticles: number): void {
    this.modules = [
      { name: 'NeuralFlow', module: new NeuralFlow(maxParticles * 0.1) },
      { name: 'SynapseParticles', module: new SynapseParticles(maxParticles * 0.6) },
      { name: 'AIGridMorph', module: new AIGridMorph() },
      { name: 'PulseRings', module: new PulseRings() },
      { name: 'AuroraVeil', module: new AuroraVeil() },
      { name: 'SensorSpectrum', module: new SensorSpectrum() },
      { name: 'BloomGarden', module: new BloomGarden(this.visitorAssets) }
    ];

    this.modules.forEach(({ module }) => {
      module.object3d.visible = false;
      this.group.add(module.object3d);
    });
    this.scene.add(this.group);
    this.setActiveModule(0);
  }

  update(delta: number, elapsed: number): void {
    const active = this.modules[this.activeIndex];
    if (!active) return;
    active.module.update(delta, elapsed);
  }

  private setActiveModule(index: number): void {
    if (!this.modules.length) return;
    const clamped = THREE.MathUtils.euclideanModulo(index, this.modules.length);
    this.modules.forEach(({ module }, idx) => {
      module.object3d.visible = idx === clamped;
    });
    this.activeIndex = clamped;
  }

  nextModule(): string {
    this.setActiveModule(this.activeIndex + 1);
    return this.getActiveModuleName();
  }

  previousModule(): string {
    this.setActiveModule(this.activeIndex - 1);
    return this.getActiveModuleName();
  }

  selectModule(index: number): string {
    this.setActiveModule(index);
    return this.getActiveModuleName();
  }

  getModuleNames(): string[] {
    return this.modules.map((entry) => entry.name);
  }

  getActiveModuleName(): string {
    return this.modules[this.activeIndex]?.name ?? '';
  }

  setAudioLevel(level: number): void {
    const active = this.modules[this.activeIndex];
    active?.module.setAudioLevel?.(level);
  }

  setMotionIntensity(level: number): void {
    const active = this.modules[this.activeIndex];
    active?.module.setMotionIntensity?.(level);
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
