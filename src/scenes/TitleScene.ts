import Phaser from 'phaser';
import { LEVEL_INFO, LEVELS, progress } from '../systems/progress';
import { makeButton } from '../ui/menu';
import { ensureTextures } from './textures';

export class TitleScene extends Phaser.Scene {
  private starting = false;

  constructor() {
    super('Title');
  }

  create(): void {
    ensureTextures(this);
    this.starting = false;
    const { width, height } = this.scale;

    const bg = this.add.graphics();
    bg.fillGradientStyle(0x0e0d16, 0x0e0d16, 0x241b3a, 0x2b1f45, 1);
    bg.fillRect(0, 0, width, height);

    // slow-rising motes for a first hint of the other world
    this.add.particles(0, 0, 'dot', {
      x: { min: 0, max: width },
      y: height + 10,
      lifespan: 11000,
      speedY: { min: -22, max: -8 },
      scale: { start: 0.5, end: 0 },
      alpha: { start: 0.35, end: 0 },
      tint: 0x9df0e8,
      frequency: 260,
    });

    this.add
      .text(width / 2, height * 0.26, 'STRANGE\nWORLDS', {
        fontFamily: 'Georgia, serif',
        fontSize: '52px',
        color: '#e8e3f5',
        align: 'center',
      })
      .setOrigin(0.5)
      .setLetterSpacing(6);

    this.add
      .text(width / 2, height * 0.37, 'a door where no door should be', {
        fontFamily: 'Georgia, serif',
        fontSize: '15px',
        fontStyle: 'italic',
        color: '#8f86ad',
      })
      .setOrigin(0.5);

    // primary action
    const primaryLabel = progress.hasSave ? 'Continue' : 'Begin';
    const primary = makeButton(this, width / 2, height * 0.52, 200, 58, primaryLabel, () => {
      this.startScene(progress.hasSave ? progress.scene : 'Bedroom');
    });
    this.tweens.add({
      targets: [primary.zone, primary.label],
      alpha: { from: 1, to: 0.75 },
      duration: 1400,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    if (progress.hasSave) {
      // a fresh run — chapters already reached stay unlocked below
      makeButton(this, width / 2, height * 0.52 + 76, 200, 50, 'New game', () => {
        progress.newGame();
        this.startScene('Bedroom');
      }, 0, 18);

      const unlocked = LEVELS.filter((l) => progress.unlocked.has(l));
      if (unlocked.length > 0) {
        this.add
          .text(width / 2, height * 0.52 + 150, '— chapters —', {
            fontFamily: 'Georgia, serif',
            fontSize: '13px',
            fontStyle: 'italic',
            color: '#8f86ad',
          })
          .setOrigin(0.5);
        const bw = 172;
        const gap = 14;
        const total = unlocked.length * bw + (unlocked.length - 1) * gap;
        unlocked.forEach((level, i) => {
          const x = width / 2 - total / 2 + bw / 2 + i * (bw + gap);
          makeButton(this, x, height * 0.52 + 196, bw, 46, LEVEL_INFO[level].title, () => {
            this.startScene(level);
          }, 0, 15);
        });
      }
    }

    this.cameras.main.fadeIn(900, 14, 13, 22);
  }

  private startScene(target: string): void {
    if (this.starting) return;
    this.starting = true;
    // NOTE: resetFX first — a fadeOut started while the fadeIn is still
    // running is silently ignored and its completion event never fires
    this.cameras.main.resetFX();
    this.cameras.main.fadeOut(700, 14, 13, 22);
    this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
      this.scene.start(target);
    });
  }
}
