import Phaser from 'phaser';
import { Player } from '../entities/Player';
import { autoplay } from '../systems/autoplay';
import { progress } from '../systems/progress';
import { FLAGS, shouldRevealPortal } from '../systems/story';
import { showLine } from '../ui/dialogue';
import { attachGameMenu } from '../ui/menu';
import { tapMarker } from './effects';
import { ensureTextures } from './textures';

// Human scale: the girl is 84px ≈ 1.65m, so ~51px per metre. Furniture below
// sticks to that ratio (bed ~2.1m, desk surface ~0.75m high, door ~2.1m).
const WALK_SPEED = 230;

export class BedroomScene extends Phaser.Scene {
  private player!: Player;
  private deskItems: Phaser.GameObjects.Rectangle[] = [];
  private transitioning = false;
  private cx = 0;
  private floorY = 0;
  private spread = 1; // widens furniture placement on tablet/desktop

  constructor() {
    super('Bedroom');
  }

  create(): void {
    ensureTextures(this);
    progress.enterScene('Bedroom');
    this.transitioning = false;
    this.deskItems = [];

    const { width: w, height: h } = this.scale;
    this.cx = w / 2;
    this.floorY = h - 124;
    this.spread = Phaser.Math.Clamp(w / 390, 1, 1.5);
    const sp = this.spread;

    this.drawRoom();
    this.player = new Player(this, this.cx - 60, this.floorY, WALK_SPEED);

    // interactables: poster (right), desk (left), the wall itself (centre)
    this.addInteractable(this.cx + 122 * sp, this.floorY - 118, 60, 76, this.cx + 122 * sp - 34, () => this.onPoster());
    this.addInteractable(this.cx - 100 * sp, this.floorY - 28, 96, 76, this.cx - 100 * sp + 56, () => this.onDesk());
    this.addInteractable(this.cx, this.floorY - 64, 74, 120, this.cx - 46, () => this.onWall());

    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      if (this.transitioning) return;
      const target = Phaser.Math.Clamp(pointer.worldX, 30, w - 30);
      tapMarker(this, target, this.floorY - 6);
      this.player.walkTo(target);
    });

    if (progress.has(FLAGS.portalRevealed)) {
      this.showPortalSeam(true);
    }

    attachGameMenu(this, 'Bedroom');
    this.cameras.main.fadeIn(700, 14, 13, 22);

    // scripted playthrough: poster → desk → wall (reveal) → wall (enter)
    autoplay.script(this, [
      { delay: 1800, x: this.cx + 122 * sp, y: this.floorY - 118 },
      { delay: 3600, x: this.cx - 100 * sp, y: this.floorY - 28 },
      { delay: 3800, x: this.cx, y: this.floorY - 64 },
      { delay: 3600, x: this.cx, y: this.floorY - 64 },
    ]);
  }

  override update(_time: number, delta: number): void {
    this.player.update(delta);
  }

  // MARK: - Room drawing (placeholder shapes until the art pass)

  private drawRoom(): void {
    const { width: w, height: h } = this.scale;
    const cx = this.cx;
    const floorY = this.floorY;
    const sp = this.spread;
    const g = this.add.graphics();

    // wall with faint wallpaper stripes
    g.fillStyle(0x262038, 1);
    g.fillRect(0, 0, w, floorY);
    g.fillStyle(0x2b2545, 1);
    for (let x = 10; x < w; x += 44) {
      g.fillRect(x, 0, 3, floorY);
    }

    // the room darkens toward the (unseen) ceiling
    g.fillGradientStyle(0x0a0912, 0x0a0912, 0x0a0912, 0x0a0912, 0.55, 0.55, 0, 0);
    g.fillRect(0, 0, w, floorY * 0.5);

    // pendant lamp hanging in from offscreen, dark — she hasn't turned it on
    const lampX = cx + 62 * sp;
    const lampY = floorY - 336;
    g.fillStyle(0x1b1730, 1);
    g.fillRect(lampX - 1, 0, 2, lampY);
    g.fillStyle(0x574d78, 1);
    g.fillTriangle(lampX - 22, lampY + 26, lampX + 22, lampY + 26, lampX, lampY - 4);
    g.fillStyle(0xf9d9a6, 0.14);
    g.fillCircle(lampX, lampY + 30, 7);

    // the stretch of wall hiding the portal — a door-sized discoloration
    g.fillStyle(0x2a2342, 1);
    g.fillRoundedRect(cx - 34, floorY - 118, 68, 112, 4);

    // floor with boards and a rug
    g.fillStyle(0x3a2f4d, 1);
    g.fillRect(0, floorY, w, h - floorY);
    g.lineStyle(1, 0x322944, 1);
    for (let y = floorY + 30; y < h; y += 34) {
      g.lineBetween(0, y, w, y);
    }
    g.fillStyle(0x1b1730, 1);
    g.fillRect(0, floorY - 5, w, 6);
    g.fillStyle(0x46395c, 1);
    g.fillEllipse(cx - 16, floorY + 52, 236, 52);
    g.lineStyle(2, 0x574d78, 0.6);
    g.strokeEllipse(cx - 16, floorY + 52, 200, 40);

    // window: sill ~0.9m, top ~2.1m, with curtains and the moon outside
    const winX = cx - 158 * sp;
    g.fillStyle(0x1b1730, 1);
    g.fillRect(winX, floorY - 156, 80, 110);
    g.fillStyle(0x101a2e, 1);
    g.fillRect(winX + 6, floorY - 150, 68, 98);
    g.fillStyle(0xf2e9e4, 0.85);
    g.fillCircle(winX + 26, floorY - 126, 11);
    g.fillStyle(0x1b1730, 1);
    g.fillRect(winX + 37, floorY - 150, 4, 98);
    g.fillRect(winX + 6, floorY - 104, 68, 4);
    g.fillStyle(0x574d78, 0.9);
    g.fillRect(winX - 8, floorY - 162, 10, 122);
    g.fillRect(winX + 78, floorY - 162, 10, 122);

    // moonlight spilling in
    g.fillStyle(0xd8e6f5, 0.05);
    g.fillTriangle(winX + 6, floorY - 150, winX + 74, floorY - 150, winX + 108, floorY + 56);
    g.fillTriangle(winX + 6, floorY - 150, winX - 26, floorY + 56, winX + 108, floorY + 56);

    // poster, slightly crooked, roughly 0.8m x 1.1m
    const posterX = cx + 122 * sp;
    this.add.rectangle(posterX, floorY - 118, 44, 60, 0x7c6f9f).setAngle(-4);
    this.add.rectangle(posterX, floorY - 118, 32, 46, 0x574d78).setAngle(-4);
    this.add.rectangle(posterX - 4, floorY - 126, 12, 12, 0x9df0e8).setAngle(-4).setAlpha(0.7);

    // desk: surface at ~0.75m with a drawer block, items waiting to be swept
    const deskL = cx - 100 * sp - 40;
    g.fillStyle(0x6d597a, 1);
    g.fillRect(deskL, floorY - 40, 80, 8);
    g.fillRect(deskL + 2, floorY - 32, 6, 32);
    g.fillRect(deskL + 72, floorY - 32, 6, 32);
    g.fillStyle(0x574d78, 1);
    g.fillRect(deskL + 46, floorY - 32, 30, 20);
    g.fillStyle(0x2a2342, 1);
    g.fillRect(deskL + 52, floorY - 26, 18, 3);
    const itemColors = [0x9df0e8, 0xd8cfe8, 0xc98f8f];
    itemColors.forEach((color, i) => {
      if (progress.has(FLAGS.desk)) {
        // she already swept the desk — the items stay where they fell
        this.add
          .rectangle(deskL - 32 - i * 26, floorY + 28 + i * 22, 13, 9, color)
          .setAngle(Phaser.Math.Between(40, 300));
      } else {
        this.deskItems.push(this.add.rectangle(deskL + 14 + i * 24, floorY - 45, 13, 9, color));
      }
    });

    // bed: ~2.1m long against the right side, recently kicked
    const bedR = Math.min(w - 4, cx + 186 * sp);
    g.fillStyle(0x433a5e, 1);
    g.fillRoundedRect(bedR - 108, floorY - 30, 108, 24, 5);
    g.fillStyle(0x574d78, 1);
    g.fillRoundedRect(bedR - 74, floorY - 30, 74, 24, 5);
    g.fillStyle(0xd8cfe8, 0.95);
    g.fillRoundedRect(bedR - 104, floorY - 36, 28, 13, 4);
    g.fillStyle(0x322944, 1);
    g.fillRect(bedR - 106, floorY - 6, 6, 8);
    g.fillRect(bedR - 8, floorY - 6, 6, 8);
    g.fillStyle(0x3a3154, 1);
    g.fillRect(bedR, floorY - 60, 8, 62);

    // a shelf she hasn't unpacked onto yet — three books and a small plant,
    // hung high so it clears the poster below
    const shelfX = bedR - 92;
    g.fillStyle(0x574d78, 1);
    g.fillRect(shelfX, floorY - 196, 72, 6);
    g.fillStyle(0x6d597a, 1);
    g.fillRect(shelfX + 8, floorY - 216, 7, 20);
    g.fillStyle(0x8f86ad, 1);
    g.fillRect(shelfX + 17, floorY - 212, 7, 16);
    g.fillStyle(0xc98f8f, 1);
    g.fillRect(shelfX + 27, floorY - 214, 6, 18);
    g.fillStyle(0x2a2342, 1);
    g.fillRect(shelfX + 52, floorY - 206, 12, 10);
    g.fillStyle(0x6ee7c8, 0.8);
    g.fillCircle(shelfX + 55, floorY - 209, 4);
    g.fillCircle(shelfX + 61, floorY - 211, 4);

    // things she has already thrown around
    const debris = (x: number, y: number, ww: number, hh: number, color: number, angle: number): void => {
      this.add.rectangle(x, y, ww, hh, color).setAngle(angle);
    };
    debris(cx + 34, floorY + 64, 26, 9, 0x6d597a, -22);
    debris(cx - 4, floorY + 86, 16, 12, 0x8f86ad, 38);
    debris(cx + 148, floorY + 40, 20, 8, 0xc98f8f, 12);
    debris(cx - 190, floorY + 30, 18, 10, 0x574d78, -30);
  }

  // MARK: - Movement + interaction plumbing

  private addInteractable(
    x: number,
    y: number,
    wZone: number,
    hZone: number,
    standAtX: number,
    onArrive: () => void,
  ): void {
    const zone = this.add.rectangle(x, y, wZone, hZone, 0xffffff, 0).setInteractive();
    zone.on(
      'pointerdown',
      (
        _pointer: Phaser.Input.Pointer,
        _x: number,
        _y: number,
        event: Phaser.Types.Input.EventData,
      ) => {
        if (this.transitioning) return;
        event.stopPropagation();
        tapMarker(this, x, y);
        this.player.walkTo(standAtX, () => {
          this.player.face(x);
          onArrive();
        });
      },
    );
  }

  // MARK: - Interactions

  private onPoster(): void {
    if (!progress.has(FLAGS.poster)) {
      progress.setFlag(FLAGS.poster);
      showLine('My old poster. It looks wrong on these walls.');
    } else {
      showLine('It came all this way just to feel out of place. Same.');
    }
  }

  private onDesk(): void {
    if (!progress.has(FLAGS.desk)) {
      progress.setFlag(FLAGS.desk);
      showLine("I didn't ask for any of this!");
      this.cameras.main.shake(180, 0.006);
      this.deskItems.forEach((item, i) => {
        this.tweens.add({
          targets: item,
          x: item.x - 46 - i * 26,
          y: this.floorY + 28 + i * 22,
          angle: Phaser.Math.Between(90, 260),
          duration: 420 + i * 90,
          ease: 'Quad.easeIn',
        });
      });
    } else {
      showLine('The mess feels honest, at least.');
    }
  }

  private onWall(): void {
    if (progress.has(FLAGS.portalRevealed)) {
      this.enterPortal();
      return;
    }
    if (shouldRevealPortal(progress.flags)) {
      progress.setFlag(FLAGS.portalRevealed);
      this.showPortalSeam(false);
      return;
    }
    if (!progress.has(FLAGS.wallTouched)) {
      progress.setFlag(FLAGS.wallTouched);
    }
    showLine('There is something behind this wall. Like a held breath.');
  }

  // MARK: - Portal

  private seamPoints(): Phaser.Math.Vector2[] {
    const cx = this.cx;
    const top = this.floorY - 112;
    const bottom = this.floorY - 8;
    const step = (bottom - top) / 5;
    const sway = [4, -5, 6, -4, 5, -3];
    return sway.map((dx, i) => new Phaser.Math.Vector2(cx + dx, top + step * i));
  }

  private showPortalSeam(instant: boolean): void {
    const seam = this.add.graphics();
    const points = this.seamPoints();
    seam.lineStyle(10, 0x9df0e8, 0.18);
    seam.strokePoints(points, false);
    seam.lineStyle(3, 0x9df0e8, 1);
    seam.strokePoints(points, false);

    const top = this.floorY - 110;
    const bottom = this.floorY - 10;
    this.add.particles(0, 0, 'dot', {
      emitZone: {
        type: 'random',
        // NOTE: Geom.Line doesn't satisfy Phaser's RandomZoneSource typing,
        // so we hand-roll a point-on-the-seam source instead
        source: {
          getRandomPoint: (point) => {
            point.x = this.cx + Phaser.Math.Between(-4, 4);
            point.y = Phaser.Math.Between(top, bottom);
          },
        },
      },
      lifespan: 1600,
      speedX: { min: -14, max: 14 },
      speedY: { min: -10, max: 10 },
      scale: { start: 0.5, end: 0 },
      alpha: { start: 0.8, end: 0 },
      tint: 0x9df0e8,
      frequency: 70,
    });

    if (instant) return;

    seam.setAlpha(0);
    this.tweens.add({ targets: seam, alpha: 1, duration: 1400, ease: 'Sine.easeOut' });
    this.tweens.add({
      targets: seam,
      alpha: { from: 1, to: 0.55 },
      delay: 1400,
      duration: 1100,
      yoyo: true,
      repeat: -1,
    });
    this.cameras.main.shake(260, 0.004);
    showLine('The wall... it is opening.');
  }

  private enterPortal(): void {
    if (this.transitioning) return;
    this.transitioning = true;

    const cx = this.cx;
    const seamY = this.floorY - 62;

    // she steps up to the seam, pauses, and the wall takes her
    this.player.walkTo(cx - 20, () => {
      this.player.face(cx);
      this.time.delayedCall(320, () => {
        // flare + expanding ring + burst
        const flare = this.add.circle(cx, seamY, 30, 0x9df0e8, 0.28);
        this.tweens.add({ targets: flare, scale: 5, alpha: 0, duration: 1100, ease: 'Sine.easeOut' });
        const ring = this.add.circle(cx, seamY, 24).setStrokeStyle(3, 0xd9fbf6, 0.9);
        this.tweens.add({ targets: ring, scale: 7, alpha: 0, duration: 1000, ease: 'Quad.easeOut' });
        const burst = this.add.particles(cx, seamY, 'dot', {
          speed: { min: 60, max: 260 },
          lifespan: 1000,
          scale: { start: 0.8, end: 0 },
          alpha: { start: 1, end: 0 },
          tint: [0x9df0e8, 0xd8cfe8, 0xffffff],
          emitting: false,
        });
        burst.explode(90);

        this.tweens.add({
          targets: this.player,
          x: cx,
          alpha: 0,
          duration: 800,
          delay: 150,
          ease: 'Sine.easeIn',
        });

        const cam = this.cameras.main;
        // NOTE: resetFX first (a fadeOut during an active fadeIn is silently
        // ignored) — it must come before pan/zoom or it would cancel them too
        cam.resetFX();
        cam.pan(cx, seamY, 1100, 'Sine.easeIn');
        cam.zoomTo(1.7, 1100, 'Sine.easeIn');
        cam.fadeOut(1150, 235, 235, 255);
        cam.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
          cam.setZoom(1);
          this.scene.start('Fantasy');
        });
      });
    });
  }
}
