import * as THREE from 'three';
import { projectionConfig } from './config';

export class EdgeBlendOverlay {
  private mesh: THREE.Mesh;

  constructor() {
    const geometry = new THREE.PlaneGeometry(2, 2);
    const material = new THREE.ShaderMaterial({
      vertexShader: /* glsl */ `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = vec4(position, 1.0);
        }
      `,
      fragmentShader: /* glsl */ `
        precision highp float;
        varying vec2 vUv;
        uniform float projectors;
        uniform float overlap;
        uniform float gamma;

        void main() {
          float blendWidth = overlap / 1920.0; // assume HD base, scale accordingly
          float left = smoothstep(0.0, blendWidth, vUv.x);
          float right = smoothstep(1.0, 1.0 - blendWidth, vUv.x);
          float fade = left * right;
          vec3 tint = vec3(pow(fade, 1.0 / gamma));
          float projectorBands = floor(vUv.x * projectors) / projectors;
          float modulate = mix(0.85, 1.0, projectorBands);
          gl_FragColor = vec4(tint * modulate, 1.0 - fade);
        }
      `,
      transparent: true,
      uniforms: {
        projectors: { value: projectionConfig.projectors },
        overlap: { value: projectionConfig.overlapPx },
        gamma: { value: projectionConfig.gamma }
      }
    });

    this.mesh = new THREE.Mesh(geometry, material);
  }

  get object3d(): THREE.Mesh {
    return this.mesh;
  }
}
