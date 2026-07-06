import Phaser from 'phaser';
import { Player } from '../entities/Player';
import { autoplay } from '../systems/autoplay';
import { progress } from '../systems/progress';
import { FLAGS } from '../systems/story';
import { showLine } from '../ui/dialogue';
import { attachGameMenu } from '../ui/menu';
import { tapMarker } from './effects';
import { ensureTextures } from './textures';

const WALK_SPEED = 185; // slower here — she is taking it in
const SLIP_LEDGE = 3; // the third hold always gives way once

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
const CLIFF_FOOT = 0x5a4386;
const CLIFF_WARM_EDGE = 0xb45a3c;
const LEDGE_ROCK = 0x4e3a72;
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
  private cliffL = 0;
  private cliffTopY = 0;
  private ledges: { x: number; y: number }[] = [];
  private climbIndex = 0; // 0 = on the ground; ledges.length = summit
  private slipped = false;
  private glint?: Phaser.GameObjects.Container;
  private tower?: Phaser.GameObjects.Graphics;

  constructor() {
    super('Fantasy');
  }

  create(): void {
    ensureTextures(this);
    progress.enterScene('Fantasy');
    this.ending = false;
    this.climbIndex = 0;
    this.slipped = false;

    const { width: w, height: h } = this.scale;
    this.floorY = h - 64;
    this.cliffL = w - 130;
    this.cliffTopY = h * 0.12;

    // the climb: zig-zag holds up the right cliff, summit on top
    const cl = this.cliffL;
    this.ledges = [
      { x: cl + 68, y: h - 176 },
      { x: cl + 24, y: h - 288 },
      { x: cl + 86, y: h - 400 },
      { x: cl + 28, y: h - 512 },
      { x: cl + 82, y: h - 624 },
      { x: cl + 54, y: this.cliffTopY + 4 }, // the summit
    ];

    this.drawWorld();
    this.player = new Player(this, 26, this.floorY, WALK_SPEED);
    this.player.setDepth(10);
    this.player.walkTo(90); // she steps out of the portal into the light

    this.ledges.forEach((_, i) => this.addLedgeZone(i + 1));

    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      if (this.ending || this.player.isBusy) return;
      if (this.climbIndex > 0) {
        if (this.climbIndex === 1) {
          const first = this.ledges[0];
          if (first) {
            this.player.climbTo(first.x - 46, this.floorY, () => {
              this.climbIndex = 0;
            });
          }
        } else {
          showLine('A long way down. One hold at a time.');
        }
        return;
      }
      const target = Phaser.Math.Clamp(pointer.worldX, 26, w - 16);
      tapMarker(this, target, this.floorY - 4, 0xf9d9a6);
      this.player.walkTo(target);
    });

    attachGameMenu(this, 'Fantasy');
    this.cameras.main.fadeIn(1400, 230, 230, 255);
    this.time.delayedCall(1700, () => showLine('...where am I?'));
    if (!progress.has(FLAGS.summit)) {
      this.time.delayedCall(5200, () => {
        if (this.climbIndex === 0) showLine('Something glints at the top of that cliff.');
      });
    }

    // scripted playthrough: walk to the cliff, climb, slip once at the third
    // hold, retry, and take the summit
    const steps = this.ledges.map((l) => ({ delay: 2100, x: l.x, y: l.y - 26 }));
    steps.splice(SLIP_LEDGE, 0, { delay: 3400, x: this.ledges[SLIP_LEDGE - 1]?.x ?? 0, y: (this.ledges[SLIP_LEDGE - 1]?.y ?? 0) - 26 });
    autoplay.script(this, [
      { delay: 6400, x: this.cliffL - 30, y: this.floorY - 4 },
      ...steps,
    ]);
  }

  override update(_time: number, delta: number): void {
    this.player.update(delta);
  }

  // MARK: - The climb

  private addLedgeZone(k: number): void {
    const ledge = this.ledges[k - 1];
    if (!ledge) return;
    const zone = this.add.rectangle(ledge.x, ledge.y - 22, 62, 66, 0xffffff, 0).setInteractive();
    zone.on(
      'pointerdown',
      (
        _p: Phaser.Input.Pointer,
        _x: number,
        _y: number,
        event: Phaser.Types.Input.EventData,
      ) => {
        event.stopPropagation();
        if (this.ending || this.player.isBusy) return;
        tapMarker(this, ledge.x, ledge.y - 14);
        this.attemptClimb(k);
      },
    );
  }

  private attemptClimb(k: number): void {
    const ledge = this.ledges[k - 1];
    if (!ledge) return;

    if (k === this.climbIndex) return; // already standing there

    if (k === this.climbIndex + 1) {
      const from = this.climbIndex === 0 ? null : this.ledges[this.climbIndex - 1];

      // from the ground she first walks to the base of the cliff
      if (this.climbIndex === 0 && Math.abs(this.player.x - (ledge.x - 40)) > 30) {
        this.player.walkTo(ledge.x - 40, () => this.attemptClimb(k));
        return;
      }

      if (k === SLIP_LEDGE && !this.slipped) {
        this.slipped = true;
        const back = from ?? { x: ledge.x - 40, y: this.floorY };
        this.player.slipTo(ledge.x, ledge.y, back.x, back.y, () => {
          showLine('The rock gives way— almost had it.');
        });
        this.cameras.main.shake(200, 0.004);
        this.dustPuff(ledge.x, ledge.y + 8);
        return;
      }

      this.player.climbTo(ledge.x, ledge.y, () => {
        this.climbIndex = k;
        if (k === this.ledges.length) this.onSummit();
      });
      return;
    }

    if (k === this.climbIndex - 1) {
      this.player.climbTo(ledge.x, ledge.y, () => {
        this.climbIndex = k;
      });
      return;
    }

    showLine(k > this.climbIndex ? 'Too far to reach from here.' : 'A long way down. One hold at a time.');
  }

  private dustPuff(x: number, y: number): void {
    const puff = this.add.particles(x, y, 'dot', {
      speed: { min: 20, max: 90 },
      lifespan: 700,
      scale: { start: 0.5, end: 0 },
      alpha: { start: 0.6, end: 0 },
      tint: 0x8f86ad,
      emitting: false,
    });
    puff.explode(14);
    this.time.delayedCall(900, () => puff.destroy());
  }

  private onSummit(): void {
    if (!progress.has(FLAGS.summit)) progress.setFlag(FLAGS.summit);
    this.glint?.destroy();
    this.glint = undefined;

    // the vantage: a burst of light, the camera lifts, and far past the falls
    // a tower she could never have seen from below
    const summit = this.ledges[this.ledges.length - 1];
    if (summit) {
      const burst = this.add.particles(summit.x, summit.y - 30, 'dot', {
        speed: { min: 40, max: 160 },
        lifespan: 900,
        scale: { start: 0.6, end: 0 },
        alpha: { start: 1, end: 0 },
        tint: [0xf9d9a6, 0xffffff],
        emitting: false,
      });
      burst.explode(40);
    }

    // lift the camera toward the sky without ever showing past the world edge
    const cam = this.cameras.main;
    const zoom = 1.1;
    const minCenterY = this.scale.height / 2 / zoom + 4;
    cam.pan(this.scale.width * 0.52, Math.max(this.scale.height * 0.42, minCenterY), 1600, 'Sine.easeInOut');
    cam.zoomTo(zoom, 1600, 'Sine.easeInOut');

    if (this.tower) {
      this.tweens.add({ targets: this.tower, alpha: 0.9, duration: 2600, ease: 'Sine.easeOut' });
    }

    this.time.delayedCall(900, () => showLine('...oh.'));
    this.time.delayedCall(3100, () => showLine('A tower. Past the falls, past everything.'));
    this.time.delayedCall(6100, () => showLine("That's where I need to go."));
    this.time.delayedCall(9300, () => this.endDemo());
  }

  // MARK: - World drawing (placeholder shapes, palette-first)

  private drawWorld(): void {
    const { width: w, height: h } = this.scale;
    this.drawSky(w, h);
    this.drawCliffs(w, h);
    this.drawWaterfalls(w, h);
    this.drawPoolAndBank(w, h);
    this.drawClimb(w, h);
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

    // the tower on the far horizon — invisible until she earns the view
    this.tower = this.add.graphics().setAlpha(0);
    this.tower.fillStyle(0x2e2342, 1);
    this.tower.fillRect(w * 0.33 - 7, h * 0.185, 14, 96);
    this.tower.fillTriangle(w * 0.33 - 11, h * 0.185, w * 0.33 + 11, h * 0.185, w * 0.33, h * 0.185 - 30);
    this.tower.fillStyle(0xf9d9a6, 1);
    this.tower.fillCircle(w * 0.33, h * 0.185 - 8, 3.5);
    this.tower.fillStyle(0xf9d9a6, 0.25);
    this.tower.fillCircle(w * 0.33, h * 0.185 - 8, 9);

    const cloud = (x: number, y: number, s: number, color: number, alpha: number): void => {
      g.fillStyle(color, alpha);
      g.fillEllipse(x, y, 120 * s, 34 * s);
      g.fillEllipse(x + 40 * s, y - 14 * s, 80 * s, 26 * s);
      g.fillEllipse(x - 45 * s, y - 8 * s, 70 * s, 22 * s);
    };
    cloud(w * 0.72, h * 0.055, 1.1, CLOUD_LIGHT, 0.95);
    cloud(w * 0.3, h * 0.14, 0.8, 0xf6c489, 0.9);
    cloud(w * 0.82, h * 0.2, 0.7, CLOUD_WARM, 0.8);
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
    const topY = this.cliffTopY;

    // far wall the thin falls pour over
    g.fillStyle(CLIFF_FAR, 1);
    g.fillRect(0, h * 0.39, w, poolTop - h * 0.39 + 20);

    // right cliff mass — the one she climbs — sunset catching its edge
    const cliffL = this.cliffL;
    g.fillStyle(CLIFF_RIGHT, 1);
    g.fillRect(cliffL, topY, 130, poolTop - topY + 14);
    g.fillStyle(CLIFF_WARM_EDGE, 0.7);
    g.fillRect(cliffL, topY, 10, poolTop - topY + 14);
    g.fillStyle(CLIFF_FAR, 0.6);
    for (let y = topY + 70; y < poolTop; y += 74) {
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
    clump(cliffL + 34, topY, 0.85);
    clump(w - 24, topY - 4, 0.7);
  }

  private drawWaterfalls(w: number, h: number): void {
    const cx = w / 2;
    const poolTop = h - 204;
    const lipY = h * 0.49;

    // thin distant falls over the far wall
    this.drawFall(cx - 103, h * 0.4, poolTop + 16, 9, 0.5);
    this.drawFall(cx - 67, h * 0.415, poolTop + 16, 5, 0.4);

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
    g.fillEllipse(w * 0.55, bankTop + 32, 70, 24);
    g.fillEllipse(w * 0.1, bankTop + 62, 90, 30);

    // reeds catching both the sunset and the water light
    const reedCount = Math.max(4, Math.floor((this.cliffL - 30) / 66));
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

  private drawClimb(w: number, h: number): void {
    const g = this.add.graphics();
    const poolTop = h - 204;

    // the cliff's foot rises straight from the shore — her way up
    g.fillStyle(CLIFF_FOOT, 1);
    g.fillRect(this.cliffL + 42, poolTop - 6, w - this.cliffL - 42, h - poolTop + 6);
    g.fillStyle(0x4a3570, 0.7);
    for (let y = poolTop + 30; y < h - 20; y += 52) {
      g.fillRect(this.cliffL + 48, y, w - this.cliffL - 48, 4);
    }

    // the holds: small rock outcrops with a breath of turquoise moss
    this.ledges.forEach((ledge, i) => {
      if (i === this.ledges.length - 1) return; // the summit is the cliff top itself
      g.fillStyle(LEDGE_ROCK, 1);
      g.fillRoundedRect(ledge.x - 24, ledge.y - 2, 48, 12, 5);
      g.fillStyle(FALL_SOFT, 0.35);
      g.fillRect(ledge.x - 18, ledge.y - 2, 36, 3);
    });

    // the goal: a glint of light at the summit, pulsing patiently
    if (!progress.has(FLAGS.summit)) {
      const summit = this.ledges[this.ledges.length - 1];
      if (summit) {
        const glintCore = this.add.circle(0, 0, 5, 0xf9d9a6, 1);
        const glintHalo = this.add.circle(0, 0, 12, 0xf9d9a6, 0.3);
        this.glint = this.add.container(summit.x, summit.y - 26, [glintHalo, glintCore]);
        this.tweens.add({
          targets: this.glint,
          scale: { from: 0.8, to: 1.5 },
          alpha: { from: 1, to: 0.55 },
          duration: 1100,
          yoyo: true,
          repeat: -1,
          ease: 'Sine.easeInOut',
        });
        this.add.particles(summit.x, summit.y - 26, 'dot', {
          speed: { min: 6, max: 26 },
          lifespan: 1600,
          scale: { start: 0.4, end: 0 },
          alpha: { start: 0.9, end: 0 },
          tint: 0xf9d9a6,
          frequency: 240,
        });
      }
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
    autoplay.stop();
    showLine('...to be continued.');
    // NOTE: resetFX so this fadeOut isn't ignored if the fadeIn is still running
    this.cameras.main.resetFX();
    this.cameras.main.fadeOut(1800, 14, 13, 22);
    this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
      this.cameras.main.setZoom(1);
      this.scene.start('Title');
    });
  }
}
