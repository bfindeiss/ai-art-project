import * as THREE from 'three';
import { VisualModule } from './base';

export class SynapseParticles implements VisualModule {
  public object3d: THREE.Points;
  private velocities: Float32Array;
  private geometry: THREE.BufferGeometry;
  private audioLevel = 0;
  private motion = 0;

  constructor(count = 8000) {
    this.geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);
    this.velocities = new Float32Array(count);
    const colors = new Float32Array(count * 3);
    const cool = new THREE.Color('#19f2ff');
    const warm = new THREE.Color('#f6ad3c');
    const highlight = new THREE.Color('#f4f6fb');
    const tempColor = new THREE.Color();

    for (let i = 0; i < count; i++) {
      positions[i * 3] = THREE.MathUtils.randFloatSpread(8);
      positions[i * 3 + 1] = THREE.MathUtils.randFloatSpread(4);
      positions[i * 3 + 2] = THREE.MathUtils.randFloatSpread(8);
      this.velocities[i] = THREE.MathUtils.randFloat(0.002, 0.015);

      const mix = Math.pow(Math.random(), 1.4) * 0.75;
      tempColor
        .copy(cool)
        .lerp(warm, mix)
        .lerp(highlight, Math.random() * 0.15);
      colors[i * 3] = tempColor.r;
      colors[i * 3 + 1] = tempColor.g;
      colors[i * 3 + 2] = tempColor.b;
    }

    this.geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    this.geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const material = new THREE.PointsMaterial({
      size: 0.05,
      vertexColors: true,
      transparent: true,
      opacity: 0.8,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });

    this.object3d = new THREE.Points(this.geometry, material);
  }

  update(delta: number, elapsed: number): void {
    const positions = this.geometry.getAttribute('position') as THREE.BufferAttribute;
    const data = positions.array as Float32Array;
    for (let i = 0; i < data.length; i += 3) {
      const idx = i / 3;
      const drift = this.velocities[idx] * (1.0 + this.audioLevel * 2.0);
      data[i] += Math.sin(elapsed * 0.2 + idx) * drift * delta;
      data[i + 1] += Math.cos(elapsed * 0.15 + idx * 0.5) * drift * 0.5 * delta;
      data[i + 2] += Math.sin(elapsed * 0.1 + idx) * drift * delta;

      const limit = 6.0;
      if (data[i] > limit) data[i] = -limit;
      if (data[i] < -limit) data[i] = limit;
      if (data[i + 2] > limit) data[i + 2] = -limit;
      if (data[i + 2] < -limit) data[i + 2] = limit;
    }
    positions.needsUpdate = true;

    const mat = this.object3d.material as THREE.PointsMaterial;
    mat.size = THREE.MathUtils.lerp(0.04, 0.09, this.motion);
    mat.opacity = 0.5 + this.audioLevel * 0.5;
  }

  setAudioLevel(value: number): void {
    this.audioLevel = THREE.MathUtils.clamp(value, 0, 1);
  }

  setMotionIntensity(value: number): void {
    this.motion = THREE.MathUtils.clamp(value, 0, 1);
  }
}
