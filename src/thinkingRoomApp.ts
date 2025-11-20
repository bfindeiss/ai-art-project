import * as THREE from 'three';
import { createGradientBackground } from './shaders/gradientBackground';
import { VisualManager } from './visuals/visualManager';
import { projectionConfig, systemConfig, themeConfig } from './config';
import { EdgeBlendOverlay } from './edgeBlendOverlay';
import { MicrophoneController } from './interactions/microphone';
import { WebcamMotionController } from './interactions/webcam';
import { SensorImprint } from './visuals/SensorImprint';
import { PersonOcclusionMask } from './visuals/PersonOcclusionMask';

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
  private sensorImprint = new SensorImprint();
  private occlusionMask = new PersonOcclusionMask();
  private visualManager: VisualManager;
  private clock = new THREE.Clock();
  private elapsed = 0;
  private animationId?: number;
  private container: HTMLElement;
  private paletteIndex = 0;
  private mic = new MicrophoneController();
  private webcam = new WebcamMotionController();
  private webcamTexture?: THREE.VideoTexture;
  private fpsSamples: number[] = [];
  private options: ThinkingRoomOptions;
  private handleResize = () => this.onResize();
  private handleKeyDown = (event: KeyboardEvent) => this.onKeyDown(event);
  private isPaused = false;
  private audioSensitivity = 1;
  private motionSensitivity = 1;
  private readonly sensitivityStep = 0.1;

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

    this.overlayScene.add(this.occlusionMask.object3d);
    this.overlayScene.add(this.edgeOverlay.object3d);

    this.scene.add(this.background);
    this.scene.add(this.sensorImprint.object3d);
    this.visualManager = new VisualManager(this.scene);
    this.visualManager.init(systemConfig.maxParticles);

    window.addEventListener('resize', this.handleResize);
    window.addEventListener('keydown', this.handleKeyDown);
    this.onResize();

    if (options.enableMicrophone) {
      this.mic.init();
    }
    if (options.enableWebcam) {
      this.webcam.init().then(() => {
        const videoEl = this.webcam.getVideoElement();
        if (videoEl) {
          this.webcamTexture = new THREE.VideoTexture(videoEl);
          this.webcamTexture.colorSpace = THREE.SRGBColorSpace;
          this.sensorImprint.setVideoTexture(this.webcamTexture);
          this.occlusionMask.setVideoTexture(this.webcamTexture);
        }
      });
    }
  }

  start(): void {
    this.clock.start();
    this.animate();
  }

  private animate = () => {
    this.animationId = requestAnimationFrame(this.animate);
    const delta = this.clock.getDelta();

    if (!this.isPaused) {
      this.elapsed += delta;
      this.updateTheme(this.elapsed);
      this.visualManager.update(delta, this.elapsed);

      if (this.options.enableMicrophone) {
        const audioLevel = this.getScaledAudioLevel();
        this.visualManager.setAudioLevel(audioLevel);
        this.sensorImprint.setAudioLevel(audioLevel);
      }
      if (this.options.enableWebcam) {
        const motion = this.getScaledMotionLevel();
        this.visualManager.setMotionIntensity(motion);
        this.sensorImprint.setMotionLevel(motion);
        this.occlusionMask.update(this.elapsed);
      }

      this.trackFps(delta);

      this.sensorImprint.update(delta, this.elapsed);
    }

    this.renderer.clear();
    this.renderer.render(this.scene, this.camera);
    this.renderer.render(this.overlayScene, this.overlayCamera);
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

  private onKeyDown(event: KeyboardEvent): void {
    if (['INPUT', 'TEXTAREA'].includes((event.target as HTMLElement)?.tagName)) {
      return;
    }

    switch (event.code) {
      case 'Space':
        event.preventDefault();
        this.togglePause();
        break;
      case 'KeyV':
        event.preventDefault();
        if (event.shiftKey) {
          this.visualManager.previousModule();
        } else {
          this.visualManager.nextModule();
        }
        this.announceActiveVisual();
        break;
      case 'ArrowUp':
        event.preventDefault();
        this.adjustAudioSensitivity(this.sensitivityStep);
        break;
      case 'ArrowDown':
        event.preventDefault();
        this.adjustAudioSensitivity(-this.sensitivityStep);
        break;
      case 'ArrowRight':
        event.preventDefault();
        this.adjustMotionSensitivity(this.sensitivityStep);
        break;
      case 'ArrowLeft':
        event.preventDefault();
        this.adjustMotionSensitivity(-this.sensitivityStep);
        break;
      default:
        if (event.code.startsWith('Digit')) {
          const digit = Number(event.code.replace('Digit', ''));
          if (!Number.isNaN(digit)) {
            const index = digit - 1;
            if (index >= 0 && index < this.visualManager.getModuleNames().length) {
              event.preventDefault();
              this.visualManager.selectModule(index);
              this.announceActiveVisual();
              break;
            }
          }
        }
        break;
    }
  }

  private togglePause(): void {
    this.isPaused = !this.isPaused;
    if (!this.isPaused) {
      this.clock.getDelta();
    }
  }

  private announceActiveVisual(): void {
    const active = this.visualManager.getActiveModuleName();
    if (active) {
      console.info(`[ThinkingRoom] Active visual module: ${active}`);
    }
  }

  private getScaledAudioLevel(): number {
    const level = this.mic.getLevel() * this.audioSensitivity;
    return THREE.MathUtils.clamp(level, 0, 1);
  }

  private getScaledMotionLevel(): number {
    const level = this.webcam.getMotion() * this.motionSensitivity;
    return THREE.MathUtils.clamp(level, 0, 1);
  }

  private adjustAudioSensitivity(delta: number): void {
    this.audioSensitivity = THREE.MathUtils.clamp(this.audioSensitivity + delta, 0, 3);
    console.info(
      `[ThinkingRoom] Audio sensitivity ${(this.audioSensitivity * 100).toFixed(0)}%`
    );
  }

  private adjustMotionSensitivity(delta: number): void {
    this.motionSensitivity = THREE.MathUtils.clamp(this.motionSensitivity + delta, 0, 3);
    console.info(
      `[ThinkingRoom] Motion sensitivity ${(this.motionSensitivity * 100).toFixed(0)}%`
    );
  }

  dispose(): void {
    cancelAnimationFrame(this.animationId!);
    window.removeEventListener('resize', this.handleResize);
    window.removeEventListener('keydown', this.handleKeyDown);
    this.visualManager.dispose();
    this.renderer.dispose();
  }
}
