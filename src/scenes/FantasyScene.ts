import Phaser from 'phaser';
import { gameState } from '../systems/state';
import { showLine } from '../ui/dialogue';
import { ensureTextures } from './textures';

const FLOOR_Y = 780;
const WALK_SPEED = 150; // slower here — she is taking it in
const WALK_MIN_X = 30;
const EDGE_X = 345; // walking past this ends the demo

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
  private girl!: Phaser.GameObjects.Image;
  private walkTween?: Phaser.Tweens.Tween;
  private ending = false;

  constructor() {
    super('Fantasy');
  }

  create(): void {
    ensureTextures(this);
    gameState.enterScene('Fantasy');
    this.ending = false;

    this.drawWorld();
    this.girl = this.add.image(55, FLOOR_Y, 'girl').setOrigin(0.5, 1).setDepth(10);

    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      if (this.ending) return;
      this.walkTo(Phaser.Math.Clamp(pointer.worldX, WALK_MIN_X, this.scale.width - 20));
    });

    this.cameras.main.fadeIn(1400, 230, 230, 255);
    this.time.delayedCall(1600, () => showLine('...where am I?'));
  }

  // MARK: - World drawing (placeholder shapes, palette-first)

  private drawWorld(): void {
    const { width, height } = this.scale;
    this.drawSky(width, height);
    this.drawCliffs(width);
    this.drawWaterfalls();
    this.drawPoolAndBank(width, height);
    this.drawAmbient(width, height);
  }

  private drawSky(width: number, height: number): void {
    const g = this.add.graphics();
    g.fillGradientStyle(SKY_TOP, SKY_MID, SKY_LOW, SKY_BASE, 1);
    g.fillRect(0, 0, width, height);

    // low sun, too large and too pale to be our sun
    g.fillStyle(SUN, 0.22);
    g.fillCircle(85, 240, 92);
    g.fillStyle(SUN, 0.95);
    g.fillCircle(85, 240, 54);

    const cloud = (x: number, y: number, s: number, color: number, alpha: number): void => {
      g.fillStyle(color, alpha);
      g.fillEllipse(x, y, 120 * s, 34 * s);
      g.fillEllipse(x + 40 * s, y - 14 * s, 80 * s, 26 * s);
      g.fillEllipse(x - 45 * s, y - 8 * s, 70 * s, 22 * s);
    };
    cloud(300, 70, 1.1, CLOUD_LIGHT, 0.95);
    cloud(120, 120, 0.8, 0xf6c489, 0.9);
    cloud(330, 165, 0.7, CLOUD_WARM, 0.8);
    cloud(55, 42, 0.6, CLOUD_LIGHT, 0.85);
  }

  private drawCliffs(width: number): void {
    const g = this.add.graphics();

    // far wall the thin falls pour over
    g.fillStyle(CLIFF_FAR, 1);
    g.fillRect(0, 330, width, 370);

    // right cliff mass, sunset catching its edge
    g.fillStyle(CLIFF_RIGHT, 1);
    g.fillRect(262, 70, width - 262, 630);
    g.fillStyle(CLIFF_WARM_EDGE, 0.7);
    g.fillRect(262, 70, 10, 630);
    g.fillStyle(CLIFF_FAR, 0.6);
    for (let y = 150; y < 660; y += 74) {
      g.fillRect(272, y, width - 272, 5);
    }

    // left plateau the girl arrived on top of, once
    g.fillStyle(CLIFF_LEFT, 1);
    g.fillRect(0, 400, 150, 300);
    g.fillStyle(CLIFF_WARM_EDGE, 0.5);
    g.fillRect(0, 400, 150, 6);

    // autumn foliage clinging to every edge
    const clump = (x: number, y: number, s: number): void => {
      FOLIAGE.forEach((color, i) => {
        g.fillStyle(color, 0.95);
        g.fillEllipse(x + (i - 1) * 16 * s, y - (i % 2) * 8 * s, 42 * s, 24 * s);
      });
    };
    clump(28, 398, 1);
    clump(92, 402, 0.85);
    clump(142, 408, 0.7);
    clump(250, 410, 0.8);
    clump(300, 70, 0.9);
    clump(362, 64, 0.75);

    // foliage overhanging from just offscreen, top-left, framing the sun
    FOLIAGE.forEach((color, i) => {
      g.fillStyle(color, 0.9);
      g.fillEllipse(10 + i * 24, 16 + i * 14, 64 - i * 10, 30 - i * 4);
    });
  }

  private drawWaterfalls(): void {
    // thin distant falls over the far wall
    this.drawFall(92, 340, 700, 9, 0.5);
    this.drawFall(128, 352, 700, 5, 0.4);
    this.drawFall(322, 140, 700, 10, 0.55);

    // the main cascade, pouring off the far wall between the plateaus
    this.drawFall(200, 410, 700, 62, 0.75);
    const core = this.add.graphics();
    core.fillStyle(FALL_CORE, 0.9);
    core.fillRect(200 - 17, 410, 34, 290);
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
      x: { min: 172, max: 228 },
      y: 415,
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
      x: { min: 150, max: 250 },
      y: 685,
      speedY: { min: -25, max: -8 },
      speedX: { min: -20, max: 20 },
      lifespan: 2800,
      scale: { start: 1.6, end: 3 },
      alpha: { start: 0.16, end: 0 },
      tint: 0xe9fbf7,
      frequency: 120,
    });
  }

  private drawFall(centerX: number, top: number, bottom: number, w: number, alpha: number): void {
    const h = bottom - top;
    const fall = this.add.graphics();
    fall.fillStyle(FALL_SOFT, alpha * 0.45);
    fall.fillRect(centerX - w * 0.75, top, w * 1.5, h);
    fall.fillStyle(FALL_SOFT, alpha);
    fall.fillRect(centerX - w / 2, top, w, h);
    this.tweens.add({
      targets: fall,
      alpha: { from: 1, to: 0.7 },
      duration: Phaser.Math.Between(1100, 1700),
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
  }

  private drawPoolAndBank(width: number, height: number): void {
    const g = this.add.graphics();

    // the pool, lit from within
    g.fillGradientStyle(POOL_DEEP, POOL_DEEP, 0x49d8cb, 0x6fe3d6, 1);
    g.fillRect(0, 640, width, 120);
    g.fillStyle(POOL_GLOW, 0.45);
    g.fillEllipse(200, 688, 190, 46);
    g.fillStyle(POOL_GLOW, 0.35);
    for (let i = 0; i < 7; i += 1) {
      g.fillRect(Phaser.Math.Between(0, width - 50), Phaser.Math.Between(650, 750), Phaser.Math.Between(20, 46), 2);
    }

    // dark shore in the foreground where she walks
    g.fillStyle(BANK, 1);
    g.fillRect(0, 758, width, height - 758);
    g.fillStyle(POOL_GLOW, 0.25);
    g.fillRect(0, 758, width, 3);
    g.fillStyle(0x241b3a, 1);
    g.fillEllipse(300, 790, 70, 24);
    g.fillEllipse(40, 820, 90, 30);

    // reeds catching both the sunset and the water light
    for (let i = 0; i < 6; i += 1) {
      const reed = this.add.graphics();
      const reedH = Phaser.Math.Between(34, 70);
      reed.fillStyle(FOLIAGE[i % FOLIAGE.length] ?? 0xd97742, 0.9);
      reed.fillRect(-1.5, -reedH, 3, reedH);
      reed.fillStyle(FALL_SOFT, 0.9);
      reed.fillCircle(0, -reedH, 3.5);
      reed.setPosition(20 + i * 68, 780);
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

  private drawAmbient(width: number, height: number): void {
    // drifting motes, warm and cool
    this.add.particles(0, 0, 'dot', {
      x: { min: 0, max: width },
      y: { min: 200, max: height },
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
      x: { min: 10, max: width - 10 },
      y: { min: 648, max: 752 },
      lifespan: 1800,
      scale: { start: 0.35, end: 0 },
      alpha: { start: 0.9, end: 0 },
      tint: 0xffffff,
      frequency: 260,
    });
  }

  // MARK: - Movement

  private walkTo(targetX: number): void {
    this.walkTween?.stop();
    const distance = Math.abs(targetX - this.girl.x);
    if (distance < 4) return;
    this.girl.setFlipX(targetX < this.girl.x);
    this.walkTween = this.tweens.add({
      targets: this.girl,
      x: targetX,
      duration: (distance / WALK_SPEED) * 1000,
      ease: 'Linear',
      onUpdate: () => {
        if (this.girl.x > EDGE_X) this.endDemo();
      },
    });
  }

  private endDemo(): void {
    if (this.ending) return;
    this.ending = true;
    this.walkTween?.stop();
    showLine('...to be continued.');
    // NOTE: resetFX so this fadeOut isn't ignored if the fadeIn is still running
    this.cameras.main.resetFX();
    this.cameras.main.fadeOut(1800, 14, 13, 22);
    this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
      this.scene.start('Title');
    });
  }
}
