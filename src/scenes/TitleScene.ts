import Phaser from 'phaser';
import { gameState } from '../systems/state';
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
      .text(width / 2, height * 0.3, 'STRANGE\nWORLDS', {
        fontFamily: 'Georgia, serif',
        fontSize: '52px',
        color: '#e8e3f5',
        align: 'center',
      })
      .setOrigin(0.5)
      .setLetterSpacing(6);

    this.add
      .text(width / 2, height * 0.41, 'a door where no door should be', {
        fontFamily: 'Georgia, serif',
        fontSize: '15px',
        fontStyle: 'italic',
        color: '#8f86ad',
      })
      .setOrigin(0.5);

    const label = gameState.hasSave ? 'Continue' : 'Begin';
    const button = this.add
      .rectangle(width / 2, height * 0.62, 190, 58, 0x241b3a)
      .setStrokeStyle(1, 0x9df0e8, 0.5)
      .setInteractive({ useHandCursor: true });
    const buttonText = this.add
      .text(width / 2, height * 0.62, label, {
        fontFamily: 'Georgia, serif',
        fontSize: '22px',
        color: '#e8e3f5',
      })
      .setOrigin(0.5);

    this.tweens.add({
      targets: [button, buttonText],
      alpha: { from: 1, to: 0.75 },
      duration: 1400,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    button.on('pointerdown', () => {
      if (this.starting) return;
      this.starting = true;
      const target = gameState.hasSave ? gameState.scene : 'Bedroom';
      // NOTE: resetFX first — a fadeOut started while the fadeIn is still
      // running is silently ignored and its completion event never fires
      this.cameras.main.resetFX();
      this.cameras.main.fadeOut(700, 14, 13, 22);
      this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
        this.scene.start(target);
      });
    });

    this.cameras.main.fadeIn(900, 14, 13, 22);
  }
}
