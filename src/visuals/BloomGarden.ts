import * as THREE from 'three';
import { VisualModule } from './base';
import { VisitorAssetPool } from '../visitorAssets';

interface BloomSprite {
  sprite: THREE.Sprite;
  speed: number;
  radius: number;
  angle: number;
  verticalSpeed: number;
}

export class BloomGarden implements VisualModule {
  object3d = new THREE.Group();
  private sprites: BloomSprite[] = [];
  private audioBoost = 0;
  private motionBoost = 0;

  constructor(private pool: VisitorAssetPool, count = 30) {
    this.object3d.position.z = -8;
    this.buildSprites(count);
    this.pool.onChange(() => this.rebuildTextures());
  }

  update(delta: number, elapsed: number): void {
    this.sprites.forEach((entry, idx) => {
      entry.angle += entry.speed * delta * (1 + this.motionBoost * 0.5);
      const yOffset = Math.sin(elapsed * entry.verticalSpeed + idx) * 0.5;
      const radiusJitter = entry.radius * (1 + this.motionBoost * 0.2);
      entry.sprite.position.set(
        Math.cos(entry.angle) * radiusJitter,
        Math.sin(entry.angle * 0.8) * 0.6 + yOffset,
        Math.sin(entry.angle) * radiusJitter
      );
      const baseScale = 1 + Math.sin(elapsed * 0.6 + idx) * 0.2;
      const pulse = 1 + this.audioBoost * 0.8;
      const scale = baseScale * pulse;
      entry.sprite.scale.setScalar(scale);
      (entry.sprite.material as THREE.SpriteMaterial).opacity = 0.7 + this.audioBoost * 0.3;
    });

    this.audioBoost = THREE.MathUtils.damp(this.audioBoost, 0, 2.5, delta);
    this.motionBoost = THREE.MathUtils.damp(this.motionBoost, 0, 2.5, delta);
  }

  setAudioLevel(value: number): void {
    this.audioBoost = Math.max(this.audioBoost, value);
  }

  setMotionIntensity(value: number): void {
    this.motionBoost = Math.max(this.motionBoost, value);
  }

  private buildSprites(count: number): void {
    const textures = this.pool.getTextures();
    for (let i = 0; i < count; i++) {
      const material = new THREE.SpriteMaterial({
        map: textures[i % textures.length],
        transparent: true,
        depthWrite: false,
        opacity: 0.8
      });
      const sprite = new THREE.Sprite(material);
      sprite.position.set((Math.random() - 0.5) * 6, (Math.random() - 0.5) * 3, (Math.random() - 0.5) * 6);
      sprite.scale.setScalar(1 + Math.random() * 0.6);
      const entry: BloomSprite = {
        sprite,
        speed: 0.4 + Math.random() * 0.9,
        radius: 2 + Math.random() * 4,
        angle: Math.random() * Math.PI * 2,
        verticalSpeed: 0.8 + Math.random() * 0.6
      };
      this.object3d.add(sprite);
      this.sprites.push(entry);
    }
  }

  private rebuildTextures(): void {
    const textures = this.pool.getTextures();
    this.sprites.forEach((entry, idx) => {
      const material = entry.sprite.material as THREE.SpriteMaterial;
      material.map = textures[idx % textures.length];
      material.needsUpdate = true;
    });
  }
}
