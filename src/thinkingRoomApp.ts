import * as THREE from 'three';
import { createGradientBackground } from './shaders/gradientBackground';
import { VisualManager } from './visuals/visualManager';
import { playlistConfig, projectionConfig, systemConfig, themeConfig } from './config';
import { EdgeBlendOverlay } from './edgeBlendOverlay';
import { MicrophoneController } from './interactions/microphone';
import { WebcamMotionController } from './interactions/webcam';
import { SensorImprint } from './visuals/SensorImprint';
import { PersonOcclusionMask } from './visuals/PersonOcclusionMask';
import { OnScreenDisplay } from './onScreenDisplay';
import { PlaylistController, SceneConfig } from './playlistController';
import { FadeOverlay } from './fadeOverlay';
import { SceneInfoBanner } from './sceneInfoBanner';
import { SensorConsentOverlay } from './sensorConsent';
import { SensorStatusBadge } from './sensorStatus';
import { VisitorAssetPool } from './visitorAssets';
import { VisitorUploadPanel } from './visitorUploadPanel';
import { ControlPanel } from './controlPanel';

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
  private edgeOverlay: EdgeBlendOverlay;
  private background = createGradientBackground(60);
  private sensorImprint = new SensorImprint();
  private occlusionMask = new PersonOcclusionMask();
  private visualManager: VisualManager;
  private clock = new THREE.Clock();
  private elapsed = 0;
  private animationId?: number;
  private container: HTMLElement;
  private paletteIndex = 0;
  private environmentBlend = 0;
  private mic = new MicrophoneController();
  private webcam = new WebcamMotionController();
  private webcamTexture?: THREE.VideoTexture;
  private hasWebcamFrame = false;
  private fpsSamples: number[] = [];
  private options: ThinkingRoomOptions;
  private handleResize = () => this.onResize();
  private handleKeyDown = (event: KeyboardEvent) => this.onKeyDown(event);
  private isPaused = false;
  private audioSensitivity = 1;
  private motionSensitivity = 1;
  private readonly sensitivityStep = 0.1;
  private osd = new OnScreenDisplay();
  private playlist = new PlaylistController(playlistConfig);
  private fadeOverlay = new FadeOverlay();
  private infoBanner = new SceneInfoBanner();
  private sensorConsent?: SensorConsentOverlay;
  private sensorStatus = new SensorStatusBadge();
  private visitorAssets = new VisitorAssetPool();
  private uploadPanel = new VisitorUploadPanel(this.visitorAssets);
  private controlPanel = new ControlPanel({
    onNext: () => this.handleManualNext(),
    onPrevious: () => this.handleManualPrevious(),
    onTogglePause: () => this.togglePause(),
    onSensitivityChange: (type, delta) =>
      type === 'audio' ? this.adjustAudioSensitivity(delta) : this.adjustMotionSensitivity(delta),
    onSyncPlaylist: () => this.restartPlaylist()
  });
  private pendingScene?: SceneConfig;
  private micEnabled = false;
  private webcamEnabled = false;

  constructor(container: HTMLElement, options: ThinkingRoomOptions = {}) {
    this.container = container;
    this.options = options;
    const projectionMode = this.getProjectionMode();
    const aspect = window.innerWidth / window.innerHeight;
    const fov = projectionMode === 'four-wall' ? 90 : 75;
    this.camera = new THREE.PerspectiveCamera(fov, aspect, 0.1, 200);
    this.camera.position.set(0, 0, 0);

    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.autoClear = false;
    this.updatePixelRatio(window.devicePixelRatio * systemConfig.resolutionScale);
    container.appendChild(this.renderer.domElement);

    const useEdgeBlend = projectionMode === 'four-wall' && projectionConfig.projectors > 1;
    this.edgeOverlay = new EdgeBlendOverlay(useEdgeBlend);
    this.overlayScene.add(this.occlusionMask.object3d);
    this.overlayScene.add(this.edgeOverlay.object3d);
    this.overlayScene.add(this.fadeOverlay.object3d);

    this.scene.add(this.background);
    this.scene.add(this.sensorImprint.object3d);
    this.visualManager = new VisualManager(this.scene, this.visitorAssets);
    this.visualManager.init(systemConfig.maxParticles);

    window.addEventListener('resize', this.handleResize);
    window.addEventListener('keydown', this.handleKeyDown);
    this.onResize();

    this.playlist.onSceneChange = (scene) => this.queueScene(scene);
    this.sensorStatus.update({ microphone: false, webcam: false });
    this.showConsent();
  }

  start(): void {
    this.clock.start();
    this.playlist.start();
    this.animate();
  }

  private showConsent(): void {
    this.sensorConsent = new SensorConsentOverlay({
      onConfirm: (opts) => {
        if (opts.microphone) {
          this.enableMicrophone();
        }
        if (opts.webcam) {
          this.enableWebcam();
        }
        this.sensorStatus.update({ microphone: this.micEnabled, webcam: this.webcamEnabled });
        this.queueScene(this.playlist.getActiveScene() ?? { module: 'NeuralFlow', duration: 0 });
      }
    });
  }

  private enableMicrophone(): void {
    if (this.micEnabled) return;
    this.mic.init();
    this.options.enableMicrophone = true;
    this.micEnabled = true;
  }

  private enableWebcam(): void {
    if (this.webcamEnabled) return;
    this.webcam.init().then(() => {
      const videoEl = this.webcam.getVideoElement();
      if (videoEl) {
        this.webcamTexture = new THREE.VideoTexture(videoEl);
        this.webcamTexture.colorSpace = THREE.SRGBColorSpace;
        this.sensorImprint.setVideoTexture(this.webcamTexture);
        this.occlusionMask.setVideoTexture(this.webcamTexture);
        this.webcamEnabled = true;
        this.options.enableWebcam = true;
        this.sensorStatus.update({ microphone: this.micEnabled, webcam: this.webcamEnabled });
      }
    });
  }

  private animate = () => {
    this.animationId = requestAnimationFrame(this.animate);
    const delta = this.clock.getDelta();

    if (!this.isPaused) {
      this.elapsed += delta;
      const audioLevel = this.options.enableMicrophone ? this.getScaledAudioLevel() : 0;
      const motionLevel = this.options.enableWebcam ? this.getScaledMotionLevel() : 0;

      this.updateWebcamTexture();

      this.updateTheme(this.elapsed, delta, audioLevel, motionLevel);
      this.visualManager.update(delta, this.elapsed);

      if (this.options.enableMicrophone) {
        this.visualManager.setAudioLevel(audioLevel);
        this.sensorImprint.setAudioLevel(audioLevel);
      }
      if (this.options.enableWebcam) {
        this.visualManager.setMotionIntensity(motionLevel);
        this.sensorImprint.setMotionLevel(motionLevel);
        this.occlusionMask.update(this.elapsed);
      }

      this.sensorImprint.update(delta, this.elapsed);
      this.trackFps(delta);
      this.playlist.update(delta, this.isPaused);
    }

    this.fadeOverlay.update(delta);
    this.applyPendingSceneIfReady();

    this.renderer.clear();
    this.renderer.render(this.scene, this.camera);
    this.renderer.render(this.overlayScene, this.overlayCamera);
  };

  private updateTheme(elapsed: number, delta: number, audioLevel: number, motionLevel: number): void {
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

    this.updateEnvironmentBlend(delta, audioLevel, motionLevel);

    const moodA = this.applyMoodToColor(colorA, this.environmentBlend);
    const moodB = this.applyMoodToColor(colorB, this.environmentBlend);
    const moodC = this.applyMoodToColor(colorC, this.environmentBlend);
    const uniforms = (this.background.material as THREE.ShaderMaterial).uniforms;
    uniforms.colorA.value.lerp(moodA, 0.05);
    uniforms.colorB.value.lerp(moodB, 0.05);
    uniforms.colorC.value.lerp(moodC, 0.05);
    uniforms.time.value = elapsed;
  }

  private updateEnvironmentBlend(delta: number, audioLevel: number, motionLevel: number): void {
    const targetIntensity = THREE.MathUtils.clamp(audioLevel * 0.6 + motionLevel * 0.4, 0, 1);
    const smoothing = 1 - Math.exp(-delta * 3);
    this.environmentBlend = THREE.MathUtils.lerp(this.environmentBlend, targetIntensity, smoothing);
  }

  private applyMoodToColor(color: THREE.Color, intensity: number): THREE.Color {
    const hsl = { h: 0, s: 0, l: 0 };
    color.getHSL(hsl);
    const calmerLightness = Math.max(0.08, hsl.l * 0.4);
    const vibrantLightness = Math.min(0.9, hsl.l * 1.35 + 0.05);
    const calmerSaturation = hsl.s * 0.65;
    const vibrantSaturation = Math.min(1, hsl.s * 1.2 + 0.05);

    const targetLightness = THREE.MathUtils.lerp(calmerLightness, vibrantLightness, intensity);
    const targetSaturation = THREE.MathUtils.lerp(calmerSaturation, vibrantSaturation, intensity);

    return new THREE.Color().setHSL(hsl.h, targetSaturation, targetLightness);
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

  private getProjectionMode(): 'single' | 'four-wall' {
    const params = new URLSearchParams(window.location.search);
    const urlOverride = params.get('projection');
    const candidate = (urlOverride as 'single' | 'four-wall' | 'auto' | null) ?? projectionConfig.mode;

    if (candidate === 'four-wall') return 'four-wall';
    if (candidate === 'single') return 'single';

    const wideEnough = window.innerWidth >= 2400 || window.innerHeight >= 1400;
    const multipleProjectors = projectionConfig.projectors > 1;
    return wideEnough && multipleProjectors ? 'four-wall' : 'single';
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
          this.handleManualPrevious();
        } else {
          this.handleManualNext();
        }
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
              const name = this.visualManager.getModuleNames()[index];
              this.queueScene({ module: name, duration: 0, title: name });
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

  private handleManualNext(): void {
    this.playlist.next();
  }

  private handleManualPrevious(): void {
    this.playlist.previous();
  }

  private restartPlaylist(): void {
    this.playlist.start();
  }

  private queueScene(scene: SceneConfig): void {
    this.pendingScene = scene;
    this.fadeOverlay.fadeIn();
  }

  private applyPendingSceneIfReady(): void {
    if (!this.pendingScene) return;
    if (!this.fadeOverlay.isOpaque()) return;

    const names = this.visualManager.getModuleNames();
    const targetIndex = names.indexOf(this.pendingScene.module);
    if (targetIndex >= 0) {
      this.visualManager.selectModule(targetIndex);
      this.infoBanner.show(this.pendingScene);
      this.osd.show([
        this.pendingScene.title ?? this.pendingScene.module,
        this.pendingScene.description ?? ''
      ]);
    }
    this.pendingScene = undefined;
    this.fadeOverlay.fadeOut();
  }

  private getScaledAudioLevel(): number {
    const level = this.mic.getLevel() * this.audioSensitivity;
    return THREE.MathUtils.clamp(level, 0, 1);
  }

  private getScaledMotionLevel(): number {
    const level = this.webcam.getMotion() * this.motionSensitivity;
    return THREE.MathUtils.clamp(level, 0, 1);
  }

  private updateWebcamTexture(): void {
    if (!this.webcamTexture || !this.options.enableWebcam) return;

    const hasFrame = this.webcam.hasFrame();
    this.hasWebcamFrame = hasFrame || this.hasWebcamFrame;

    if (hasFrame) {
      this.webcamTexture.needsUpdate = true;
    }

    const videoActive = this.hasWebcamFrame && !this.isPaused;
    this.sensorImprint.setVideoTexture(videoActive ? this.webcamTexture : undefined);
    this.occlusionMask.setVideoTexture(videoActive ? this.webcamTexture : undefined);
  }

  private adjustAudioSensitivity(delta: number): void {
    this.audioSensitivity = THREE.MathUtils.clamp(this.audioSensitivity + delta, 0, 3);
    console.info(
      `[ThinkingRoom] Audio sensitivity ${(this.audioSensitivity * 100).toFixed(0)}%`
    );
    this.showActiveOptions();
  }

  private adjustMotionSensitivity(delta: number): void {
    this.motionSensitivity = THREE.MathUtils.clamp(this.motionSensitivity + delta, 0, 3);
    console.info(
      `[ThinkingRoom] Motion sensitivity ${(this.motionSensitivity * 100).toFixed(0)}%`
    );
    this.showActiveOptions();
  }

  private showActiveOptions(): void {
    const items = [
      `Mikrofon: ${this.options.enableMicrophone ? 'aktiv' : 'deaktiviert'}`,
      `Kamera: ${this.options.enableWebcam ? 'aktiv' : 'deaktiviert'}`,
      `Audio-Sensitivität: ${(this.audioSensitivity * 100).toFixed(0)}%`,
      `Motion-Sensitivität: ${(this.motionSensitivity * 100).toFixed(0)}%`
    ];
    this.osd.show(items, 3000);
  }

  dispose(): void {
    cancelAnimationFrame(this.animationId!);
    window.removeEventListener('resize', this.handleResize);
    window.removeEventListener('keydown', this.handleKeyDown);
    this.visualManager.dispose();
    this.renderer.dispose();
    this.osd.dispose();
    this.infoBanner.dispose();
    this.sensorStatus.dispose();
    this.uploadPanel.dispose();
    this.controlPanel.dispose();
  }
}
