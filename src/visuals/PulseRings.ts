import * as THREE from 'three';
import { VisualModule } from './base';

export class PulseRings implements VisualModule {
  public object3d: THREE.Group = new THREE.Group();
  private instanced: THREE.InstancedMesh;
  private dummy = new THREE.Object3D();
  private audioLevel = 0;
  private motionLevel = 0;
  private ringCount: number;

  constructor(ringCount = 18) {
    this.ringCount = ringCount;
    const geometry = new THREE.TorusGeometry(1, 0.02, 8, 90);
    const material = new THREE.MeshBasicMaterial({
      color: new THREE.Color('#9efcff'),
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      opacity: 0.85
    });

    this.instanced = new THREE.InstancedMesh(geometry, material, ringCount);
    this.instanced.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    this.object3d.add(this.instanced);
  }

  update(delta: number, elapsed: number): void {
    const time = elapsed * 0.6;
    for (let i = 0; i < this.ringCount; i++) {
      const progress = i / this.ringCount;
      const offset = progress * Math.PI * 2;
      const pulse = 1 + Math.sin(time * 2 + offset) * 0.08 * (1 + this.audioLevel * 2);
      const spread = 0.8 + progress * 3.2 + this.audioLevel * 0.6;
      const wobble = Math.sin(time + offset * 2) * this.motionLevel * 0.8;

      this.dummy.position.set(0, wobble * 0.3, -1 + progress * 0.15);
      const uniformScale = spread * pulse;
      this.dummy.scale.setScalar(uniformScale);
      this.dummy.rotation.x = offset * 0.15 + time * 0.05;
      this.dummy.rotation.y = offset * 0.2;
      this.dummy.rotation.z = time * 0.15 + progress * Math.PI;
      this.dummy.updateMatrix();
      this.instanced.setMatrixAt(i, this.dummy.matrix);
    }
    this.instanced.instanceMatrix.needsUpdate = true;

    const material = this.instanced.material as THREE.MeshBasicMaterial;
    material.opacity = THREE.MathUtils.lerp(0.35, 0.95, this.audioLevel);
    material.color.setHSL(0.52 + this.audioLevel * 0.1, 0.9, 0.65 + this.motionLevel * 0.2);
    this.object3d.rotation.y += delta * (0.2 + this.motionLevel * 0.6);
  }

  setAudioLevel(value: number): void {
    this.audioLevel = THREE.MathUtils.clamp(value, 0, 1);
  }

  setMotionIntensity(value: number): void {
    this.motionLevel = THREE.MathUtils.clamp(value, 0, 1);
  }
}
