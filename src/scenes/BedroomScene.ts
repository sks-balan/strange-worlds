import Phaser from 'phaser';
import { gameState } from '../systems/state';
import { FLAGS, shouldRevealPortal } from '../systems/story';
import { showLine } from '../ui/dialogue';
import { ensureTextures } from './textures';

const FLOOR_Y = 720;
const WALK_SPEED = 170; // px per second
const WALK_MIN_X = 40;
const WALK_MAX_X = 350;

const WALL_X = 195;
const WALL_Y = 470;

export class BedroomScene extends Phaser.Scene {
  private girl!: Phaser.GameObjects.Image;
  private walkTween?: Phaser.Tweens.Tween;
  private deskItems: Phaser.GameObjects.Rectangle[] = [];
  private transitioning = false;

  constructor() {
    super('Bedroom');
  }

  create(): void {
    ensureTextures(this);
    gameState.enterScene('Bedroom');
    this.transitioning = false;
    this.deskItems = [];

    this.drawRoom();
    this.girl = this.add.image(140, FLOOR_Y, 'girl').setOrigin(0.5, 1);

    this.addInteractable(315, 330, 90, 110, 290, () => this.onPoster());
    this.addInteractable(85, 630, 150, 90, 110, () => this.onDesk());
    this.addInteractable(WALL_X, WALL_Y, 110, 220, WALL_X, () => this.onWall());

    // ground taps (not caught by an interactable) just walk her there
    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      this.walkTo(Phaser.Math.Clamp(pointer.worldX, WALK_MIN_X, WALK_MAX_X));
    });

    if (gameState.has(FLAGS.portalRevealed)) {
      this.showPortalSeam(true);
    }

    this.cameras.main.fadeIn(700, 14, 13, 22);
  }

  // MARK: - Room drawing (placeholder shapes until the art pass)

  private drawRoom(): void {
    const { width } = this.scale;
    const g = this.add.graphics();

    // back wall with faint wallpaper stripes
    g.fillStyle(0x262038, 1);
    g.fillRect(0, 0, width, 660);
    g.fillStyle(0x2b2545, 1);
    for (let x = 10; x < width; x += 44) {
      g.fillRect(x, 0, 3, 660);
    }

    // the section of wall hiding the portal, barely discolored
    g.fillStyle(0x2a2342, 1);
    g.fillRoundedRect(WALL_X - 55, WALL_Y - 110, 110, 220, 4);

    // floor with boards
    g.fillStyle(0x3a2f4d, 1);
    g.fillRect(0, 660, width, 184);
    g.lineStyle(1, 0x322944, 1);
    for (let y = 690; y < 844; y += 34) {
      g.lineBetween(0, y, width, y);
    }
    g.fillStyle(0x1b1730, 1);
    g.fillRect(0, 656, width, 6);

    // window with a sliver of night sky
    g.fillStyle(0x1b1730, 1);
    g.fillRect(35, 110, 128, 158);
    g.fillStyle(0x101a2e, 1);
    g.fillRect(43, 118, 112, 142);
    g.fillStyle(0xf2e9e4, 0.85);
    g.fillCircle(75, 150, 14);
    g.fillStyle(0x1b1730, 1);
    g.fillRect(97, 118, 4, 142);
    g.fillRect(43, 187, 112, 4);

    // bed, roughly made, recently kicked
    g.fillStyle(0x433a5e, 1);
    g.fillRoundedRect(275, 668, 115, 52, 6);
    g.fillStyle(0xd8cfe8, 0.9);
    g.fillRoundedRect(350, 660, 34, 16, 4);

    // things she has already thrown on the floor
    const debris = this.add.graphics();
    debris.fillStyle(0x6d597a, 1);
    debris.fillRect(0, 0, 26, 8);
    debris.setPosition(215, 760).setAngle(-24);
    const debris2 = this.add.graphics();
    debris2.fillStyle(0x8f86ad, 1);
    debris2.fillRect(0, 0, 16, 16);
    debris2.setPosition(255, 790).setAngle(40);

    // poster, slightly crooked
    this.add.rectangle(315, 330, 78, 100, 0x7c6f9f).setAngle(-3);
    this.add.rectangle(315, 330, 62, 82, 0x574d78).setAngle(-3);

    // desk with three small items waiting to be swept off
    g.fillStyle(0x6d597a, 1);
    g.fillRect(20, 612, 132, 12);
    g.fillRect(30, 624, 8, 70);
    g.fillRect(134, 624, 8, 70);
    const itemColors = [0x9df0e8, 0xd8cfe8, 0xc98f8f];
    itemColors.forEach((color, i) => {
      this.deskItems.push(this.add.rectangle(45 + i * 36, 604, 18, 14, color));
    });
  }

  // MARK: - Movement

  private walkTo(targetX: number, onArrive?: () => void): void {
    if (this.transitioning) return;
    this.walkTween?.stop();
    const distance = Math.abs(targetX - this.girl.x);
    if (distance < 4) {
      onArrive?.();
      return;
    }
    this.girl.setFlipX(targetX < this.girl.x);
    this.walkTween = this.tweens.add({
      targets: this.girl,
      x: targetX,
      duration: (distance / WALK_SPEED) * 1000,
      ease: 'Linear',
      onComplete: () => onArrive?.(),
    });
  }

  private addInteractable(
    x: number,
    y: number,
    w: number,
    h: number,
    standAtX: number,
    onArrive: () => void,
  ): void {
    const zone = this.add.rectangle(x, y, w, h, 0xffffff, 0).setInteractive();
    zone.on(
      'pointerdown',
      (
        _pointer: Phaser.Input.Pointer,
        _x: number,
        _y: number,
        event: Phaser.Types.Input.EventData,
      ) => {
        event.stopPropagation();
        this.walkTo(standAtX, onArrive);
      },
    );
  }

  // MARK: - Interactions

  private onPoster(): void {
    if (!gameState.has(FLAGS.poster)) {
      gameState.setFlag(FLAGS.poster);
      showLine('My old poster. It looks wrong on these walls.');
    } else {
      showLine('It came all this way just to feel out of place. Same.');
    }
  }

  private onDesk(): void {
    if (!gameState.has(FLAGS.desk)) {
      gameState.setFlag(FLAGS.desk);
      showLine("I didn't ask for any of this!");
      this.cameras.main.shake(180, 0.006);
      this.deskItems.forEach((item, i) => {
        this.tweens.add({
          targets: item,
          x: item.x - 60 - i * 28,
          y: 780 + i * 14,
          angle: Phaser.Math.Between(90, 260),
          duration: 450 + i * 90,
          ease: 'Quad.easeIn',
        });
      });
    } else {
      showLine('The mess feels honest, at least.');
    }
  }

  private onWall(): void {
    if (gameState.has(FLAGS.portalRevealed)) {
      this.enterPortal();
      return;
    }
    if (shouldRevealPortal(gameState.flags)) {
      gameState.setFlag(FLAGS.portalRevealed);
      this.showPortalSeam(false);
      return;
    }
    if (!gameState.has(FLAGS.wallTouched)) {
      gameState.setFlag(FLAGS.wallTouched);
    }
    showLine('There is something behind this wall. Like a held breath.');
  }

  // MARK: - Portal

  private showPortalSeam(instant: boolean): void {
    const seam = this.add.graphics();
    const points = [
      new Phaser.Math.Vector2(WALL_X + 4, WALL_Y - 92),
      new Phaser.Math.Vector2(WALL_X - 5, WALL_Y - 55),
      new Phaser.Math.Vector2(WALL_X + 6, WALL_Y - 18),
      new Phaser.Math.Vector2(WALL_X - 4, WALL_Y + 26),
      new Phaser.Math.Vector2(WALL_X + 5, WALL_Y + 60),
      new Phaser.Math.Vector2(WALL_X - 3, WALL_Y + 94),
    ];
    seam.lineStyle(10, 0x9df0e8, 0.18);
    seam.strokePoints(points, false);
    seam.lineStyle(3, 0x9df0e8, 1);
    seam.strokePoints(points, false);

    this.add.particles(0, 0, 'dot', {
      emitZone: {
        type: 'random',
        // NOTE: Geom.Line doesn't satisfy Phaser's RandomZoneSource typing,
        // so we hand-roll a point-on-the-seam source instead
        source: {
          getRandomPoint: (point) => {
            point.x = WALL_X + Phaser.Math.Between(-4, 4);
            point.y = WALL_Y + Phaser.Math.Between(-90, 92);
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
    this.walkTween?.stop();

    const burst = this.add.particles(WALL_X, WALL_Y, 'dot', {
      speed: { min: 60, max: 240 },
      lifespan: 1000,
      scale: { start: 0.8, end: 0 },
      alpha: { start: 1, end: 0 },
      tint: [0x9df0e8, 0xd8cfe8, 0xffffff],
      emitting: false,
    });
    burst.explode(80);

    this.tweens.add({
      targets: this.girl,
      x: WALL_X,
      alpha: 0,
      duration: 900,
      ease: 'Sine.easeIn',
    });
    this.cameras.main.zoomTo(1.25, 1100, 'Sine.easeIn');
    this.cameras.main.fadeOut(1200, 230, 230, 255);
    this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
      this.cameras.main.setZoom(1);
      this.scene.start('Fantasy');
    });
  }
}
