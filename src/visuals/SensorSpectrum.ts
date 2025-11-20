import * as THREE from 'three';
import { VisualModule } from './base';

interface PanelUniforms extends Record<string, THREE.IUniform> {
  time: { value: number };
  intensity: { value: number };
  baseColor: { value: THREE.Color };
  pulseColor: { value: THREE.Color };
  shimmerSpeed: { value: number };
}

interface BridgeUniforms extends Record<string, THREE.IUniform> {
  time: { value: number };
  left: { value: number };
  right: { value: number };
}

export class SensorSpectrum implements VisualModule {
  public object3d = new THREE.Group();
  private panelGeometry = new THREE.PlaneGeometry(4, 6, 1, 1);
  private bridgeGeometry = new THREE.PlaneGeometry(3.2, 3.2, 1, 1);
  private microphoneUniforms: PanelUniforms;
  private cameraUniforms: PanelUniforms;
  private bridgeUniforms: BridgeUniforms;
  private audioLevel = 0;
  private motionLevel = 0;

  constructor() {
    this.microphoneUniforms = this.createPanelUniforms(
      new THREE.Color(0.15, 0.26, 0.35),
      new THREE.Color(0.98, 0.45, 0.22),
      2.6
    );
    this.cameraUniforms = this.createPanelUniforms(
      new THREE.Color(0.1, 0.18, 0.32),
      new THREE.Color(0.1, 0.8, 1.0),
      3.1
    );
    this.bridgeUniforms = {
      time: { value: 0 },
      left: { value: 0 },
      right: { value: 0 }
    };

    const microphonePanel = new THREE.Mesh(
      this.panelGeometry,
      this.createPanelMaterial(this.microphoneUniforms)
    );
    microphonePanel.position.set(-3.2, 0.5, -2.6);

    const cameraPanel = new THREE.Mesh(
      this.panelGeometry,
      this.createPanelMaterial(this.cameraUniforms)
    );
    cameraPanel.position.set(3.2, 0.5, -2.6);

    const bridge = new THREE.Mesh(
      this.bridgeGeometry,
      this.createBridgeMaterial(this.bridgeUniforms)
    );
    bridge.position.set(0, 0.3, -1.8);

    const halo = new THREE.Mesh(
      new THREE.RingGeometry(0.8, 1.6, 64),
      new THREE.MeshBasicMaterial({
        color: new THREE.Color(0.25, 0.65, 1.0),
        transparent: true,
        opacity: 0.2,
        blending: THREE.AdditiveBlending,
        side: THREE.DoubleSide
      })
    );
    halo.rotation.x = Math.PI / 2;
    halo.position.set(0, 0.01, -1.8);

    const basePlane = new THREE.Mesh(
      new THREE.PlaneGeometry(16, 9, 1, 1),
      new THREE.MeshBasicMaterial({ color: new THREE.Color(0.02, 0.03, 0.06) })
    );
    basePlane.position.set(0, 0, -4);

    const microphoneLabel = this.createLabel('MIC', '#ff8a4d');
    microphoneLabel.position.copy(microphonePanel.position).add(new THREE.Vector3(0, 3.8, 0));

    const cameraLabel = this.createLabel('CAM', '#3fd3ff');
    cameraLabel.position.copy(cameraPanel.position).add(new THREE.Vector3(0, 3.8, 0));

    this.object3d.add(basePlane);
    this.object3d.add(microphonePanel);
    this.object3d.add(cameraPanel);
    this.object3d.add(bridge);
    this.object3d.add(halo);
    this.object3d.add(microphoneLabel);
    this.object3d.add(cameraLabel);
  }

  private createPanelUniforms(
    baseColor: THREE.Color,
    pulseColor: THREE.Color,
    shimmerSpeed: number
  ): PanelUniforms {
    return {
      time: { value: 0 },
      intensity: { value: 0 },
      baseColor: { value: baseColor },
      pulseColor: { value: pulseColor },
      shimmerSpeed: { value: shimmerSpeed }
    };
  }

  private createPanelMaterial(uniforms: PanelUniforms): THREE.ShaderMaterial {
    return new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      uniforms,
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
        uniform float time;
        uniform float intensity;
        uniform vec3 baseColor;
        uniform vec3 pulseColor;
        uniform float shimmerSpeed;

        float band(vec2 uv, float offset, float width) {
          float line = smoothstep(offset - width, offset, uv.y) - smoothstep(offset, offset + width, uv.y);
          return line;
        }

        void main() {
          vec2 uv = vUv;
          float glow = smoothstep(0.6, 0.0, abs(uv.x - 0.5)) * 0.4;
          float shimmer = sin((uv.y + time * 0.2) * 10.0 + uv.x * 2.0 * shimmerSpeed);
          float stripes = 0.35 + 0.35 * sin((uv.y * 9.0 - time * 2.0) + intensity * 3.0);

          float scanline = band(uv, fract(time * 0.25), 0.08) * (0.6 + intensity * 0.8);
          float hotspot = smoothstep(0.35, 0.0, length(uv - vec2(0.5, 0.5)));

          vec3 base = mix(baseColor, pulseColor, intensity * 0.65);
          vec3 color = base;
          color += (pulseColor * 0.6 + baseColor * 0.4) * (glow + stripes * intensity);
          color += pulseColor * scanline;
          color += mix(baseColor * 0.2, pulseColor, intensity) * hotspot * 0.8;
          color += vec3(0.25, 0.35, 0.45) * shimmer * 0.12;

          float alpha = 0.55 + intensity * 0.35 + scanline * 0.3;
          gl_FragColor = vec4(color, alpha);
        }
      `
    });
  }

  private createBridgeMaterial(uniforms: BridgeUniforms): THREE.ShaderMaterial {
    return new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
      uniforms,
      vertexShader: /* glsl */ `
        varying vec2 vUv;
        void main() {
          vUv = uv - 0.5;
          vec4 modelPosition = modelMatrix * vec4(position, 1.0);
          gl_Position = projectionMatrix * viewMatrix * modelPosition;
        }
      `,
      fragmentShader: /* glsl */ `
        varying vec2 vUv;
        uniform float time;
        uniform float left;
        uniform float right;

        void main() {
          float radius = length(vUv);
          float angle = atan(vUv.y, vUv.x);
          float wave = sin(angle * 2.5 + time * 1.6);

          float leftGlow = smoothstep(0.7, 0.0, radius) * left;
          float rightGlow = smoothstep(0.7, 0.0, radius) * right;
          float pulse = 0.5 + 0.5 * sin(time * 3.0 + radius * 4.0);

          vec3 leftColor = mix(vec3(0.08, 0.18, 0.32), vec3(0.98, 0.45, 0.22), left);
          vec3 rightColor = mix(vec3(0.05, 0.15, 0.25), vec3(0.1, 0.8, 1.0), right);

          float mixAmount = 0.5 + 0.5 * sin(angle + time + wave * 0.2);
          vec3 color = mix(leftColor, rightColor, mixAmount);
          color += vec3(0.2, 0.3, 0.45) * pulse * 0.4;
          color += leftColor * leftGlow + rightColor * rightGlow;

          float alpha = smoothstep(1.0, 0.25, radius) * (0.4 + 0.4 * (left + right));
          gl_FragColor = vec4(color, alpha);
        }
      `
    });
  }

  private createLabel(text: string, color: string): THREE.Mesh {
    const size = 128;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.clearRect(0, 0, size, size);
      ctx.fillStyle = 'rgba(255,255,255,0.05)';
      ctx.fillRect(8, 8, size - 16, size - 16);
      ctx.strokeStyle = color;
      ctx.lineWidth = 6;
      ctx.strokeRect(8, 8, size - 16, size - 16);
      ctx.fillStyle = color;
      ctx.font = 'bold 54px Inter, Arial, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(text, size / 2, size / 2 + 4);
    }
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    const material = new THREE.MeshBasicMaterial({ map: texture, transparent: true });
    const geometry = new THREE.PlaneGeometry(2.2, 2.2);
    const mesh = new THREE.Mesh(geometry, material);
    mesh.renderOrder = 10;
    return mesh;
  }

  setAudioLevel(value: number): void {
    this.audioLevel = THREE.MathUtils.clamp(value, 0, 1);
  }

  setMotionIntensity(value: number): void {
    this.motionLevel = THREE.MathUtils.clamp(value, 0, 1);
  }

  update(delta: number, elapsed: number): void {
    const audio = THREE.MathUtils.lerp(this.microphoneUniforms.intensity.value, this.audioLevel, 0.12);
    const motion = THREE.MathUtils.lerp(this.cameraUniforms.intensity.value, this.motionLevel, 0.12);

    this.microphoneUniforms.intensity.value = audio;
    this.cameraUniforms.intensity.value = motion;
    this.bridgeUniforms.left.value = audio;
    this.bridgeUniforms.right.value = motion;

    this.microphoneUniforms.time.value = elapsed;
    this.cameraUniforms.time.value = elapsed;
    this.bridgeUniforms.time.value = elapsed;

    this.object3d.position.y = Math.sin(elapsed * 0.4) * 0.05;
  }
}
