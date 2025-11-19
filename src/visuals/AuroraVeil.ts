import * as THREE from 'three';
import { VisualModule } from './base';

export class AuroraVeil implements VisualModule {
  public object3d: THREE.Mesh;
  private material: THREE.ShaderMaterial;
  private audioLevel = 0;
  private motionLevel = 0;

  constructor() {
    const geometry = new THREE.PlaneGeometry(16, 9, 200, 90);
    geometry.translate(0, 2.2, -7);

    this.material = new THREE.ShaderMaterial({
      transparent: true,
      side: THREE.DoubleSide,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      uniforms: {
        time: { value: 0 },
        audio: { value: 0 },
        motion: { value: 0 },
        colorA: { value: new THREE.Color('#3fe4ff') },
        colorB: { value: new THREE.Color('#ff7cdb') }
      },
      vertexShader: /* glsl */ `
        uniform float time;
        uniform float audio;
        uniform float motion;
        varying float vIntensity;
        varying vec2 vUv;
        void main() {
          vUv = uv;
          vec3 pos = position;
          float wave = sin((pos.x * 1.2 + time * 0.6)) + cos((pos.y * 1.4 + time * 0.35));
          float warp = sin((pos.x + pos.y) * 0.3 + time * 0.4) * motion * 1.5;
          pos.z += wave * 0.35 + warp;
          pos.y += sin(pos.x * 0.8 + time) * (0.2 + audio * 0.8);
          vIntensity = wave + warp;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
        }
      `,
      fragmentShader: /* glsl */ `
        uniform vec3 colorA;
        uniform vec3 colorB;
        uniform float audio;
        varying float vIntensity;
        varying vec2 vUv;
        void main() {
          float glow = smoothstep(0.0, 1.0, vUv.y);
          float pulse = 0.5 + 0.5 * sin(vIntensity + vUv.x * 3.1415);
          vec3 base = mix(colorA, colorB, glow);
          vec3 color = mix(base, vec3(1.0), pulse * (0.2 + audio * 0.5));
          float alpha = 0.25 + glow * 0.4 + audio * 0.25;
          gl_FragColor = vec4(color, alpha);
        }
      `
    });

    this.object3d = new THREE.Mesh(geometry, this.material);
  }

  update(_delta: number, elapsed: number): void {
    this.material.uniforms.time.value = elapsed;
    this.material.uniforms.audio.value = THREE.MathUtils.lerp(
      this.material.uniforms.audio.value,
      this.audioLevel,
      0.1
    );
    this.material.uniforms.motion.value = THREE.MathUtils.lerp(
      this.material.uniforms.motion.value,
      this.motionLevel,
      0.1
    );
    this.object3d.rotation.y = Math.sin(elapsed * 0.05) * (0.1 + this.motionLevel * 0.2);
  }

  setAudioLevel(value: number): void {
    this.audioLevel = THREE.MathUtils.clamp(value, 0, 1);
  }

  setMotionIntensity(value: number): void {
    this.motionLevel = THREE.MathUtils.clamp(value, 0, 1);
  }
}
