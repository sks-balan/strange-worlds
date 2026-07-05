import Phaser from 'phaser';
import { gameState } from '../systems/state';
import { showLine } from '../ui/dialogue';
import { ensureTextures } from './textures';

const FLOOR_Y = 740;
const WALK_SPEED = 150; // slower here — she is taking it in
const WALK_MIN_X = 30;
const EDGE_X = 345; // walking past this ends the demo

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
    this.girl = this.add.image(55, FLOOR_Y, 'girl').setOrigin(0.5, 1).setDepth(5);

    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      if (this.ending) return;
      this.walkTo(Phaser.Math.Clamp(pointer.worldX, WALK_MIN_X, this.scale.width - 20));
    });

    this.cameras.main.fadeIn(1400, 230, 230, 255);
    this.time.delayedCall(1600, () => showLine('...where am I?'));
  }

  private drawWorld(): void {
    const { width, height } = this.scale;
    const g = this.add.graphics();

    // dusk sky
    g.fillGradientStyle(0x120f22, 0x120f22, 0x4a3b6b, 0x6b4a76, 1);
    g.fillRect(0, 0, width, height);

    // an enormous, too-close moon
    g.fillStyle(0xf2e9e4, 0.12);
    g.fillCircle(290, 190, 105);
    g.fillStyle(0xf2e9e4, 0.9);
    g.fillCircle(290, 190, 72);
    g.fillStyle(0xd8cfe8, 0.6);
    g.fillCircle(268, 172, 14);
    g.fillCircle(310, 205, 9);

    // floating islands, gently breathing
    const islandSpecs = [
      { x: 90, y: 300, w: 130, h: 34 },
      { x: 300, y: 420, w: 100, h: 26 },
      { x: 150, y: 520, w: 70, h: 20 },
    ];
    islandSpecs.forEach((spec, i) => {
      const island = this.add.graphics();
      island.fillStyle(0x3e3562, 1);
      island.fillEllipse(0, 0, spec.w, spec.h);
      island.fillStyle(0x6ee7c8, 0.5);
      island.fillEllipse(0, -spec.h / 4, spec.w * 0.85, spec.h / 3);
      island.setPosition(spec.x, spec.y);
      this.tweens.add({
        targets: island,
        y: spec.y - 12,
        duration: 3200 + i * 700,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      });
    });

    // ground the girl walks on
    g.fillStyle(0x1c1631, 1);
    g.fillRect(0, FLOOR_Y - 6, width, height - FLOOR_Y + 6);
    g.fillStyle(0x6ee7c8, 0.25);
    g.fillRect(0, FLOOR_Y - 6, width, 3);

    // strange tall stalks swaying at different rhythms
    for (let i = 0; i < 6; i += 1) {
      const stalk = this.add.graphics();
      stalk.fillStyle(0x6ee7c8, 0.55);
      stalk.fillRect(-1.5, -Phaser.Math.Between(40, 90), 3, Phaser.Math.Between(40, 90));
      stalk.fillCircle(0, -Phaser.Math.Between(40, 88), 4);
      stalk.setPosition(30 + i * 62, FLOOR_Y - 2);
      this.tweens.add({
        targets: stalk,
        angle: Phaser.Math.Between(4, 9),
        duration: Phaser.Math.Between(1800, 3200),
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      });
    }

    // drifting motes
    this.add.particles(0, 0, 'dot', {
      x: { min: 0, max: width },
      y: { min: 200, max: height },
      lifespan: 8000,
      speedY: { min: -20, max: -6 },
      speedX: { min: -8, max: 8 },
      scale: { start: 0.5, end: 0 },
      alpha: { start: 0.5, end: 0 },
      tint: [0x9df0e8, 0xd8cfe8],
      frequency: 140,
    });
  }

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
    this.cameras.main.fadeOut(1800, 14, 13, 22);
    this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
      this.scene.start('Title');
    });
  }
}
