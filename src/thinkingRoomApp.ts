import * as THREE from 'three';
import { createGradientBackground } from './shaders/gradientBackground';
import { VisualManager } from './visuals/visualManager';
import { projectionConfig, systemConfig, themeConfig } from './config';
import { EdgeBlendOverlay } from './edgeBlendOverlay';
import { MicrophoneController } from './interactions/microphone';
import { WebcamMotionController } from './interactions/webcam';

interface ThinkingRoomOptions {
  enableMicrophone?: boolean;
  enableWebcam?: boolean;
}

export class ThinkingRoomApp {
  private renderer: THREE.WebGLRenderer;
  private scene = new THREE.Scene();
  private camera: THREE.PerspectiveCamera;
  private overlayScene = new THREE.Scene();
  private overlayCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  private edgeOverlay = new EdgeBlendOverlay();
  private background = createGradientBackground(60);
  private visualManager: VisualManager;
  private clock = new THREE.Clock();
  private animationId?: number;
  private container: HTMLElement;
  private paletteIndex = 0;
  private mic = new MicrophoneController();
  private webcam = new WebcamMotionController();
  private fpsSamples: number[] = [];
  private options: ThinkingRoomOptions;
  private handleResize = () => this.onResize();

  constructor(container: HTMLElement, options: ThinkingRoomOptions = {}) {
    this.container = container;
    this.options = options;
    const aspect = window.innerWidth / window.innerHeight;
    const fov = projectionConfig.mode === 'four-wall' ? 90 : 75;
    this.camera = new THREE.PerspectiveCamera(fov, aspect, 0.1, 200);
    this.camera.position.set(0, 0, 0);

    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.autoClear = false;
    this.updatePixelRatio(window.devicePixelRatio * systemConfig.resolutionScale);
    container.appendChild(this.renderer.domElement);

    this.overlayScene.add(this.edgeOverlay.object3d);

    this.scene.add(this.background);
    this.visualManager = new VisualManager(this.scene);
    this.visualManager.init(systemConfig.maxParticles);

    window.addEventListener('resize', this.handleResize);
    this.onResize();

    if (options.enableMicrophone) {
      this.mic.init();
    }
    if (options.enableWebcam) {
      this.webcam.init();
    }
  }

  start(): void {
    this.clock.start();
    this.animate();
  }

  private animate = () => {
    this.animationId = requestAnimationFrame(this.animate);
    const delta = this.clock.getDelta();
    const elapsed = this.clock.elapsedTime;

    this.updateTheme(elapsed);
    this.visualManager.update(delta, elapsed);

    if (this.options.enableMicrophone) {
      const audioLevel = this.mic.getLevel();
      this.visualManager.setAudioLevel(audioLevel);
    }
    if (this.options.enableWebcam) {
      const motion = this.webcam.getMotion();
      this.visualManager.setMotionIntensity(motion);
    }

    this.renderer.clear();
    this.renderer.render(this.scene, this.camera);
    this.renderer.render(this.overlayScene, this.overlayCamera);

    this.trackFps(delta);
  };

  private updateTheme(elapsed: number): void {
    const palette = themeConfig.palettes[this.paletteIndex];
    const nextPalette = themeConfig.palettes[(this.paletteIndex + 1) % themeConfig.palettes.length];
    const duration = themeConfig.transitionSeconds;
    const phase = (elapsed % duration) / duration;
    if (phase < 0.01) {
      this.paletteIndex = (this.paletteIndex + 1) % themeConfig.palettes.length;
    }
    const colorA = new THREE.Color(palette.colors[0]);
    const colorB = new THREE.Color(palette.colors[1]);
    const colorC = new THREE.Color(nextPalette.colors[2] ?? palette.colors[2]);
    const uniforms = (this.background.material as THREE.ShaderMaterial).uniforms;
    uniforms.colorA.value.lerp(colorA, 0.05);
    uniforms.colorB.value.lerp(colorB, 0.05);
    uniforms.colorC.value.lerp(colorC, 0.05);
    uniforms.time.value = elapsed;
  }

  private trackFps(delta: number): void {
    const fps = 1 / delta;
    this.fpsSamples.push(fps);
    if (this.fpsSamples.length > 120) {
      this.fpsSamples.shift();
    }
    if (this.fpsSamples.length === 120 && systemConfig.dynamicResolution) {
      const avg = this.fpsSamples.reduce((a, b) => a + b, 0) / this.fpsSamples.length;
      const currentRatio = this.renderer.getPixelRatio();
      if (avg < systemConfig.minFps && currentRatio > 0.5) {
        this.updatePixelRatio(currentRatio * 0.9);
      } else if (avg > systemConfig.minFps + 10 && currentRatio < window.devicePixelRatio) {
        this.updatePixelRatio(Math.min(window.devicePixelRatio, currentRatio * 1.05));
      }
      this.fpsSamples = [];
    }
  }

  private updatePixelRatio(ratio: number): void {
    const clamped = Math.max(0.5, Math.min(window.devicePixelRatio, ratio));
    this.renderer.setPixelRatio(clamped);
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  private onResize(): void {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  dispose(): void {
    cancelAnimationFrame(this.animationId!);
    window.removeEventListener('resize', this.handleResize);
    this.visualManager.dispose();
    this.renderer.dispose();
  }
}
