import * as THREE from 'three';
import { VisualModule } from './base';

export class AIGridMorph implements VisualModule {
  public object3d: THREE.Mesh;
  private material: THREE.ShaderMaterial;
  private motion = 0;

  constructor() {
    const geometry = new THREE.PlaneGeometry(12, 12, 120, 120);
    geometry.rotateX(-Math.PI / 2);

    this.material = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      uniforms: {
        time: { value: 0 },
        intensity: { value: 0.5 },
        colorA: { value: new THREE.Color('#0f2b46') },
        colorB: { value: new THREE.Color('#6fffd3') }
      },
      vertexShader: /* glsl */ `
        uniform float time;
        uniform float intensity;
        varying float vHeight;
        void main() {
          vec3 pos = position;
          float wave = sin(pos.x * 1.2 + time * 0.5) + cos(pos.z * 1.2 + time * 0.3);
          pos.y += wave * 0.3 * (0.3 + intensity);
          vHeight = pos.y;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
        }
      `,
      fragmentShader: /* glsl */ `
        varying float vHeight;
        uniform vec3 colorA;
        uniform vec3 colorB;
        void main() {
          float h = vHeight * 0.5 + 0.5;
          vec3 color = mix(colorA, colorB, h);
          gl_FragColor = vec4(color, 0.35 + h * 0.25);
        }
      `
    });

    this.object3d = new THREE.Mesh(geometry, this.material);
    this.object3d.position.y = -2.5;
  }

  update(delta: number, elapsed: number): void {
    this.material.uniforms.time.value = elapsed;
    this.material.uniforms.intensity.value = THREE.MathUtils.lerp(
      0.3,
      1.0,
      this.motion
    );
  }

  setMotionIntensity(value: number): void {
    this.motion = THREE.MathUtils.clamp(value, 0, 1);
  }
}
