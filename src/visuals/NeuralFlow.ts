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

  constructor(maxPoints = 2000) {
    this.segments = Math.max(24, Math.floor(maxPoints / 40));
    this.material = new THREE.LineBasicMaterial({
      color: new THREE.Color('#76d5ff'),
      transparent: true,
      opacity: 0.55,
      vertexColors: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });
    this.haloMaterial = new THREE.LineBasicMaterial({
      color: new THREE.Color('#ffffff'),
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

        const hue = 0.52 + 0.08 * Math.sin(angle + index * 0.5);
        const lightness = 0.45 + 0.3 * (t + this.audioLevel * 0.5);
        this.colorHelper.setHSL(hue, 0.8, THREE.MathUtils.clamp(lightness, 0, 1));
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
