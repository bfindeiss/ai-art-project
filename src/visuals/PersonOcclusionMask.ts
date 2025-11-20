import * as THREE from 'three';

export class PersonOcclusionMask {
  public object3d: THREE.Mesh;
  private material: THREE.ShaderMaterial;
  private placeholder: THREE.DataTexture;

  constructor() {
    const geometry = new THREE.PlaneGeometry(2, 2);

    const data = new Uint8Array([255, 255, 255, 255]);
    this.placeholder = new THREE.DataTexture(data, 1, 1, THREE.RGBAFormat);
    this.placeholder.needsUpdate = true;

    this.material = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      depthTest: false,
      blending: THREE.CustomBlending,
      blendSrc: THREE.ZeroFactor,
      blendDst: THREE.OneMinusSrcAlphaFactor,
      blendEquation: THREE.AddEquation,
      uniforms: {
        videoTexture: { value: this.placeholder },
        hasVideo: { value: 0 },
        threshold: { value: 0.35 },
        softness: { value: 0.18 },
        time: { value: 0 },
        vignette: { value: 0.35 }
      },
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
        uniform sampler2D videoTexture;
        uniform float hasVideo;
        uniform float threshold;
        uniform float softness;
        uniform float time;
        uniform float vignette;

        float luminance(vec3 color) {
          return dot(color, vec3(0.299, 0.587, 0.114));
        }

        void main() {
          vec2 uv = vUv;
          // Gentle undulation keeps the edge from feeling static
          float wobble = sin((uv.y + time * 0.3) * 18.0) * 0.01;
          uv.y += wobble;

          vec3 video = texture2D(videoTexture, uv).rgb;
          float luma = luminance(video);
          float inverted = 1.0 - luma;

          // Build a soft matte from the darker silhouette in front of the projection
          float baseMask = smoothstep(threshold, threshold + softness, inverted);

          // Accentuate the edge slightly so the cut-out reads crisply
          float edge = smoothstep(0.05, 0.2, inverted) * 0.25;

          // Keep the silhouette stronger toward screen center to avoid projector falloff
          float dist = distance(vUv, vec2(0.5));
          float vignetteMask = smoothstep(0.75, vignette, dist);

          float mask = clamp(baseMask + edge, 0.0, 1.0);
          mask = mix(mask, mask * 1.1, vignetteMask);
          mask = clamp(mask, 0.0, 1.0);

          // Color is ignored by the blending equation, alpha punches a hole in the render
          gl_FragColor = vec4(vec3(0.0), mask * hasVideo);
        }
      `
    });

    this.object3d = new THREE.Mesh(geometry, this.material);
    this.object3d.renderOrder = 0;
  }

  setVideoTexture(texture?: THREE.Texture): void {
    if (!texture) {
      this.material.uniforms.videoTexture.value = this.placeholder;
      this.material.uniforms.hasVideo.value = 0;
      return;
    }
    texture.needsUpdate = true;
    this.material.uniforms.videoTexture.value = texture;
    this.material.uniforms.hasVideo.value = 1;
  }

  update(elapsed: number): void {
    this.material.uniforms.time.value = elapsed;
  }
}
