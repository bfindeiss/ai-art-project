import * as THREE from 'three';

export class SensorImprint {
  public object3d: THREE.Mesh;
  private material: THREE.ShaderMaterial;
  private placeholder: THREE.DataTexture;
  private audioLevel = 0;
  private motionLevel = 0;

  constructor() {
    const geometry = new THREE.PlaneGeometry(14, 8, 1, 1);
    geometry.translate(0, 0.5, -3.5);

    const data = new Uint8Array([0, 0, 0, 255]);
    this.placeholder = new THREE.DataTexture(data, 1, 1, THREE.RGBAFormat);
    this.placeholder.needsUpdate = true;

    this.material = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      uniforms: {
        time: { value: 0 },
        audio: { value: 0 },
        motion: { value: 0 },
        hasVideo: { value: 0 },
        videoTexture: { value: this.placeholder }
      },
      vertexShader: /* glsl */ `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          vec4 modelPosition = modelMatrix * vec4(position, 1.0);
          gl_Position = projectionMatrix * viewMatrix * modelPosition;
        }
      `,
      fragmentShader: /* glsl */ `
        varying vec2 vUv;
        uniform sampler2D videoTexture;
        uniform float audio;
        uniform float motion;
        uniform float time;
        uniform float hasVideo;

        float hash(vec2 p) {
          return fract(sin(dot(p, vec2(23.1407, 2.6651))) * 43758.5453);
        }

        void main() {
          vec2 uv = vUv;
          float scan = sin((uv.y + time * 0.25) * 12.0) * 0.006;
          float twist = sin((uv.x * 3.1415 + time * 0.4) + audio * 4.0) * (0.01 + motion * 0.03);
          uv.x += scan + twist;

          vec3 videoSample = texture2D(videoTexture, uv).rgb;
          float luminance = dot(videoSample, vec3(0.299, 0.587, 0.114));
          float silhouette = smoothstep(0.05, 0.25, luminance);
          float ghost = smoothstep(0.2, 0.95, luminance) * 0.6;
          vec3 videoGhost = mix(vec3(0.04, 0.07, 0.15), videoSample, 0.6) * ghost * hasVideo;

          float rings = abs(sin((uv.x + time * 0.6) * 8.0));
          float audioBands = smoothstep(0.35, 1.0, rings + audio * 1.2);
          float sparkle = hash(uv * time * 15.0 + motion) * 0.25 * motion;

          vec3 color = videoGhost;
          color += vec3(0.25, 0.6, 1.0) * (audioBands * (0.15 + audio * 0.9));
          color += vec3(0.9, 0.5, 0.2) * (silhouette * 0.25 * motion);
          color += sparkle;

          float alpha = clamp(0.12 + audio * 0.35 + motion * 0.35 + silhouette * 0.25, 0.05, 0.85);
          gl_FragColor = vec4(color, alpha);
        }
      `
    });

    this.object3d = new THREE.Mesh(geometry, this.material);
    this.object3d.renderOrder = 5;
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

  setAudioLevel(value: number): void {
    this.audioLevel = THREE.MathUtils.clamp(value, 0, 1);
  }

  setMotionLevel(value: number): void {
    this.motionLevel = THREE.MathUtils.clamp(value, 0, 1);
  }

  update(delta: number, elapsed: number): void {
    this.material.uniforms.time.value = elapsed;
    this.material.uniforms.audio.value = THREE.MathUtils.lerp(
      this.material.uniforms.audio.value,
      this.audioLevel,
      0.2
    );
    this.material.uniforms.motion.value = THREE.MathUtils.lerp(
      this.material.uniforms.motion.value,
      this.motionLevel,
      0.2
    );
    this.object3d.position.y = 0.5 + Math.sin(elapsed * 0.3) * 0.05;
    this.object3d.rotation.y = Math.sin(elapsed * 0.1) * 0.1;
  }
}
