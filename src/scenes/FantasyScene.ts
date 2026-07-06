import Phaser from 'phaser';
import { Player } from '../entities/Player';
import { gameState } from '../systems/state';
import { showLine } from '../ui/dialogue';
import { tapMarker } from './effects';
import { ensureTextures } from './textures';

const WALK_SPEED = 185; // slower here — she is taking it in

// Palette: warm sunset above, glowing turquoise water below (see DESIGN.md)
const SKY_TOP = 0xf2a65e;
const SKY_MID = 0xdd8a64;
const SKY_LOW = 0xc07a9c;
const SKY_BASE = 0x8a5f9e;
const SUN = 0xfbe8c8;
const CLOUD_LIGHT = 0xf9d9a6;
const CLOUD_WARM = 0xe89a63;
const CLIFF_FAR = 0x594380;
const CLIFF_LEFT = 0x71549c;
const CLIFF_RIGHT = 0x6a4f96;
const CLIFF_WARM_EDGE = 0xb45a3c;
const FOLIAGE = [0xd97742, 0xc4593a, 0xe08a4e];
const FALL_SOFT = 0x6ee7d8;
const FALL_CORE = 0xd9fbf6;
const POOL_DEEP = 0x1d8f96;
const POOL_GLOW = 0xbdf7ef;
const BANK = 0x2e2342;

export class FantasyScene extends Phaser.Scene {
  private player!: Player;
  private ending = false;
  private floorY = 0;
  private edgeX = 0;

  constructor() {
    super('Fantasy');
  }

  create(): void {
    ensureTextures(this);
    gameState.enterScene('Fantasy');
    this.ending = false;

    const { width: w, height: h } = this.scale;
    this.floorY = h - 64;
    this.edgeX = w - 50;

    this.drawWorld();
    this.player = new Player(this, 26, this.floorY, WALK_SPEED);
    this.player.setDepth(10);
    this.player.walkTo(90); // she steps out of the portal into the light

    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      if (this.ending) return;
      const target = Phaser.Math.Clamp(pointer.worldX, 26, w - 16);
      tapMarker(this, target, this.floorY - 4, 0xf9d9a6);
      this.player.walkTo(target);
    });

    this.cameras.main.fadeIn(1400, 230, 230, 255);
    this.time.delayedCall(1700, () => showLine('...where am I?'));
  }

  override update(_time: number, delta: number): void {
    this.player.update(delta);
    if (!this.ending && this.player.x > this.edgeX) {
      this.endDemo();
    }
  }

  // MARK: - World drawing (placeholder shapes, palette-first)

  private drawWorld(): void {
    const { width: w, height: h } = this.scale;
    this.drawSky(w, h);
    this.drawCliffs(w, h);
    this.drawWaterfalls(w, h);
    this.drawPoolAndBank(w, h);
    this.drawAmbient(w, h);
  }

  private drawSky(w: number, h: number): void {
    const g = this.add.graphics();
    g.fillGradientStyle(SKY_TOP, SKY_MID, SKY_LOW, SKY_BASE, 1);
    g.fillRect(0, 0, w, h);

    // low sun, too large and too pale to be our sun
    const sunX = Math.min(w * 0.22, w / 2 - 90);
    g.fillStyle(SUN, 0.22);
    g.fillCircle(sunX, h * 0.28, 92);
    g.fillStyle(SUN, 0.95);
    g.fillCircle(sunX, h * 0.28, 54);

    const cloud = (x: number, y: number, s: number, color: number, alpha: number): void => {
      g.fillStyle(color, alpha);
      g.fillEllipse(x, y, 120 * s, 34 * s);
      g.fillEllipse(x + 40 * s, y - 14 * s, 80 * s, 26 * s);
      g.fillEllipse(x - 45 * s, y - 8 * s, 70 * s, 22 * s);
    };
    cloud(w * 0.76, h * 0.08, 1.1, CLOUD_LIGHT, 0.95);
    cloud(w * 0.3, h * 0.14, 0.8, 0xf6c489, 0.9);
    cloud(w * 0.85, h * 0.2, 0.7, CLOUD_WARM, 0.8);
    cloud(w * 0.14, h * 0.05, 0.6, CLOUD_LIGHT, 0.85);

    // foliage overhanging from just offscreen, top-left
    FOLIAGE.forEach((color, i) => {
      g.fillStyle(color, 0.9);
      g.fillEllipse(10 + i * 24, 16 + i * 14, 64 - i * 10, 30 - i * 4);
    });
  }

  private drawCliffs(w: number, h: number): void {
    const g = this.add.graphics();
    const cx = w / 2;
    const poolTop = h - 204;

    // far wall the thin falls pour over
    g.fillStyle(CLIFF_FAR, 1);
    g.fillRect(0, h * 0.39, w, poolTop - h * 0.39 + 20);

    // right cliff mass, sunset catching its edge
    const cliffL = w - 130;
    g.fillStyle(CLIFF_RIGHT, 1);
    g.fillRect(cliffL, h * 0.08, 130, poolTop - h * 0.08 + 14);
    g.fillStyle(CLIFF_WARM_EDGE, 0.7);
    g.fillRect(cliffL, h * 0.08, 10, poolTop - h * 0.08 + 14);
    g.fillStyle(CLIFF_FAR, 0.6);
    for (let y = h * 0.17; y < poolTop; y += 74) {
      g.fillRect(cliffL + 10, y, w - cliffL - 10, 5);
    }

    // left plateau
    g.fillStyle(CLIFF_LEFT, 1);
    g.fillRect(0, h * 0.475, cx - 64, poolTop - h * 0.475 + 14);
    g.fillStyle(CLIFF_WARM_EDGE, 0.5);
    g.fillRect(0, h * 0.475, cx - 64, 6);

    // autumn foliage clinging to every edge
    const clump = (x: number, y: number, s: number): void => {
      FOLIAGE.forEach((color, i) => {
        g.fillStyle(color, 0.95);
        g.fillEllipse(x + (i - 1) * 16 * s, y - (i % 2) * 8 * s, 42 * s, 24 * s);
      });
    };
    const edgeY = h * 0.475 - 2;
    for (let x = 28; x < cx - 60; x += 62) {
      clump(x, edgeY, 0.75 + ((x / 61) % 0.3));
    }
    clump(cx + 55, h * 0.49, 0.8);
    clump(cliffL + 38, h * 0.08, 0.9);
    clump(w - 28, h * 0.075, 0.75);
  }

  private drawWaterfalls(w: number, h: number): void {
    const cx = w / 2;
    const poolTop = h - 204;
    const lipY = h * 0.49;

    // thin distant falls over the far wall + one down the right cliff
    this.drawFall(cx - 103, h * 0.4, poolTop + 16, 9, 0.5);
    this.drawFall(cx - 67, h * 0.415, poolTop + 16, 5, 0.4);
    this.drawFall(w - 68, h * 0.165, poolTop + 16, 10, 0.55);

    // the main cascade
    this.drawFall(cx, lipY, poolTop + 18, 62, 0.75);
    const core = this.add.graphics();
    core.fillStyle(FALL_CORE, 0.9);
    core.fillRect(cx - 17, lipY, 34, poolTop + 18 - lipY);
    this.tweens.add({
      targets: core,
      alpha: { from: 0.9, to: 0.55 },
      duration: 900,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    // falling water streaks
    this.add.particles(0, 0, 'dot', {
      x: { min: cx - 28, max: cx + 28 },
      y: lipY + 5,
      speedY: { min: 150, max: 210 },
      gravityY: 60,
      lifespan: 1400,
      scale: { start: 0.45, end: 0.2 },
      alpha: { start: 0.9, end: 0 },
      tint: [0xffffff, FALL_CORE, FALL_SOFT],
      frequency: 30,
      quantity: 2,
    });

    // mist blooming where the water lands
    this.add.particles(0, 0, 'dot', {
      x: { min: cx - 50, max: cx + 50 },
      y: poolTop + 45,
      speedY: { min: -25, max: -8 },
      speedX: { min: -20, max: 20 },
      lifespan: 2800,
      scale: { start: 1.6, end: 3 },
      alpha: { start: 0.16, end: 0 },
      tint: 0xe9fbf7,
      frequency: 120,
    });
  }

  private drawFall(centerX: number, top: number, bottom: number, fw: number, alpha: number): void {
    const fh = bottom - top;
    const fall = this.add.graphics();
    fall.fillStyle(FALL_SOFT, alpha * 0.45);
    fall.fillRect(centerX - fw * 0.75, top, fw * 1.5, fh);
    fall.fillStyle(FALL_SOFT, alpha);
    fall.fillRect(centerX - fw / 2, top, fw, fh);
    this.tweens.add({
      targets: fall,
      alpha: { from: 1, to: 0.7 },
      duration: Phaser.Math.Between(1100, 1700),
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
  }

  private drawPoolAndBank(w: number, h: number): void {
    const g = this.add.graphics();
    const cx = w / 2;
    const poolTop = h - 204;
    const bankTop = h - 86;

    // the pool, lit from within
    g.fillGradientStyle(POOL_DEEP, POOL_DEEP, 0x49d8cb, 0x6fe3d6, 1);
    g.fillRect(0, poolTop, w, bankTop - poolTop);
    g.fillStyle(POOL_GLOW, 0.45);
    g.fillEllipse(cx, poolTop + 48, 190, 46);
    g.fillStyle(POOL_GLOW, 0.35);
    for (let i = 0; i < 8; i += 1) {
      g.fillRect(
        Phaser.Math.Between(0, w - 50),
        Phaser.Math.Between(poolTop + 10, bankTop - 10),
        Phaser.Math.Between(20, 46),
        2,
      );
    }

    // dark shore in the foreground where she walks
    g.fillStyle(BANK, 1);
    g.fillRect(0, bankTop, w, h - bankTop);
    g.fillStyle(POOL_GLOW, 0.25);
    g.fillRect(0, bankTop, w, 3);
    g.fillStyle(0x241b3a, 1);
    g.fillEllipse(w * 0.78, bankTop + 32, 70, 24);
    g.fillEllipse(w * 0.1, bankTop + 62, 90, 30);

    // reeds catching both the sunset and the water light
    const reedCount = Math.max(5, Math.floor(w / 66));
    for (let i = 0; i < reedCount; i += 1) {
      const reed = this.add.graphics();
      const reedH = Phaser.Math.Between(30, 62);
      reed.fillStyle(FOLIAGE[i % FOLIAGE.length] ?? 0xd97742, 0.9);
      reed.fillRect(-1.5, -reedH, 3, reedH);
      reed.fillStyle(FALL_SOFT, 0.9);
      reed.fillCircle(0, -reedH, 3.5);
      reed.setPosition(20 + i * 66, bankTop + 22);
      reed.setDepth(11);
      this.tweens.add({
        targets: reed,
        angle: Phaser.Math.Between(4, 9),
        duration: Phaser.Math.Between(1800, 3200),
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      });
    }
  }

  private drawAmbient(w: number, h: number): void {
    // drifting motes, warm and cool
    this.add.particles(0, 0, 'dot', {
      x: { min: 0, max: w },
      y: { min: h * 0.24, max: h },
      lifespan: 8000,
      speedY: { min: -20, max: -6 },
      speedX: { min: -8, max: 8 },
      scale: { start: 0.5, end: 0 },
      alpha: { start: 0.5, end: 0 },
      tint: [0x9df0e8, CLOUD_LIGHT],
      frequency: 140,
    });

    // sparkles skating on the pool
    this.add.particles(0, 0, 'dot', {
      x: { min: 10, max: w - 10 },
      y: { min: h - 196, max: h - 92 },
      lifespan: 1800,
      scale: { start: 0.35, end: 0 },
      alpha: { start: 0.9, end: 0 },
      tint: 0xffffff,
      frequency: 260,
    });
  }

  private endDemo(): void {
    if (this.ending) return;
    this.ending = true;
    this.player.halt();
    showLine('...to be continued.');
    // NOTE: resetFX so this fadeOut isn't ignored if the fadeIn is still running
    this.cameras.main.resetFX();
    this.cameras.main.fadeOut(1800, 14, 13, 22);
    this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
      this.scene.start('Title');
    });
  }
}
