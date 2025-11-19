import * as THREE from 'three';

export interface VisualModule {
  object3d: THREE.Object3D;
  update(delta: number, elapsed: number): void;
  setAudioLevel?(value: number): void;
  setMotionIntensity?(value: number): void;
}
