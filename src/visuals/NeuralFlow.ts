import * as THREE from 'three';
import { VisualModule } from './base';

interface Ribbon {
  mesh: THREE.Line;
  halo: THREE.Line;
  positions: Float32Array;
  colors: Float32Array;
  offset: number;
  speed: number;
  twist: number;
}

export class NeuralFlow implements VisualModule {
  public object3d: THREE.Group = new THREE.Group();
  private ribbons: Ribbon[] = [];
  private material: THREE.LineBasicMaterial;
  private haloMaterial: THREE.LineBasicMaterial;
  private segments: number;
  private audioLevel = 0;
  private motionLevel = 0;
  private colorHelper = new THREE.Color();
  private readonly brandCool = new THREE.Color('#19f2ff');
  private readonly brandWarm = new THREE.Color('#f6ad3c');
  private readonly haloTint = new THREE.Color('#f4f6fb');

  constructor(maxPoints = 2000) {
    this.segments = Math.max(24, Math.floor(maxPoints / 40));
    this.material = new THREE.LineBasicMaterial({
      color: this.brandCool.clone(),
      transparent: true,
      opacity: 0.55,
      vertexColors: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });
    this.haloMaterial = new THREE.LineBasicMaterial({
      color: this.haloTint.clone(),
      transparent: true,
      opacity: 0.2,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });

    const ribbonCount = Math.max(6, Math.floor(maxPoints / 400));
    for (let i = 0; i < ribbonCount; i++) {
      const geometry = new THREE.BufferGeometry();
      const positions = new Float32Array(this.segments * 3);
      const colors = new Float32Array(this.segments * 3);
      geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
      const line = new THREE.Line(geometry, this.material.clone());
      const halo = new THREE.Line(geometry, this.haloMaterial.clone());
      const group = new THREE.Group();
      group.add(halo);
      group.add(line);
      group.position.set(0, THREE.MathUtils.randFloatSpread(0.6), 0);
      this.object3d.add(group);
      this.ribbons.push({
        mesh: line,
        halo,
        positions,
        colors,
        offset: Math.random() * Math.PI * 2,
        speed: THREE.MathUtils.randFloat(0.03, 0.1),
        twist: THREE.MathUtils.randFloat(0.5, 1.4)
      });
    }
  }

  update(delta: number, elapsed: number): void {
    this.object3d.rotation.y += delta * 0.05;
    this.object3d.rotation.x = Math.sin(elapsed * 0.1) * (0.05 + this.motionLevel * 0.15);
    this.ribbons.forEach((ribbon, index) => {
      const phase = ribbon.offset + elapsed * ribbon.speed * (1.0 + this.motionLevel);
      const twist = ribbon.twist + this.motionLevel * 1.5;
      const colorAttr = ribbon.mesh.geometry.getAttribute('color') as THREE.BufferAttribute;
      for (let i = 0; i < this.segments; i++) {
        const t = i / (this.segments - 1);
        const angle = phase + t * Math.PI * 4.0;
        const spiral = Math.sin(angle * 0.5 + index) * twist;
        const radius = 2.6 + spiral * 0.2 + this.motionLevel * Math.sin(t * Math.PI * 2);
        const audioPulse = 1 + this.audioLevel * 0.5 * Math.sin(elapsed * 4 + t * 10 + index);
        const idx = i * 3;
        ribbon.positions[idx] = Math.cos(angle) * radius * audioPulse;
        ribbon.positions[idx + 1] =
          Math.sin(angle * 0.3 + index) * 1.2 +
          Math.cos(t * Math.PI * 2 + phase) * (0.3 + this.motionLevel * 0.7);
        ribbon.positions[idx + 2] = Math.sin(angle) * radius * audioPulse;

        const accentMix = THREE.MathUtils.clamp(0.2 + t * 0.6 + 0.2 * Math.sin(angle + index * 0.5), 0, 1);
        this.colorHelper
          .copy(this.brandCool)
          .lerp(this.brandWarm, accentMix)
          .lerp(this.haloTint, this.audioLevel * 0.2);
        ribbon.colors[idx] = this.colorHelper.r;
        ribbon.colors[idx + 1] = this.colorHelper.g;
        ribbon.colors[idx + 2] = this.colorHelper.b;
      }
      const positionAttr = ribbon.mesh.geometry.getAttribute('position') as THREE.BufferAttribute;
      positionAttr.needsUpdate = true;
      colorAttr.needsUpdate = true;

      const material = ribbon.mesh.material as THREE.LineBasicMaterial;
      material.opacity = THREE.MathUtils.lerp(0.25, 0.9, this.audioLevel);
      const haloMaterial = ribbon.halo.material as THREE.LineBasicMaterial;
      haloMaterial.opacity = THREE.MathUtils.lerp(0.08, 0.35, this.audioLevel);
      ribbon.halo.scale.setScalar(1.02 + this.audioLevel * 0.4);
    });
  }

  setAudioLevel(value: number): void {
    this.audioLevel = THREE.MathUtils.clamp(value, 0, 1);
  }

  setMotionIntensity(value: number): void {
    this.motionLevel = THREE.MathUtils.clamp(value, 0, 1);
  }
}
