import Phaser from 'phaser';

export interface AutoStep {
  /** ms after the previous step (cumulative schedule). */
  delay: number;
  x: number;
  y: number;
}

// Dev/demo feature: plays the game the way a user would, by dispatching real
// mouse events at the canvas — same input pipeline as a human tap. Each scene
// hands over a script of timed taps; a ghost-cursor ring shows every click.
class Autoplay {
  enabled = false;

  start(): void {
    this.enabled = true;
  }

  stop(): void {
    this.enabled = false;
  }

  /** Schedule a scene's tap script. Timers die with the scene's clock. */
  script(scene: Phaser.Scene, steps: AutoStep[]): void {
    if (!this.enabled) return;
    this.attachChip(scene);
    let t = 0;
    for (const step of steps) {
      t += step.delay;
      scene.time.delayedCall(t, () => {
        if (this.enabled) this.click(scene, step.x, step.y);
      });
    }
  }

  private click(scene: Phaser.Scene, worldX: number, worldY: number): void {
    // ghost cursor so the viewer sees where "the user" tapped
    const ring = scene.add
      .circle(worldX, worldY, 15, 0xffffff, 0.12)
      .setStrokeStyle(2, 0xffffff, 0.95)
      .setDepth(90);
    scene.tweens.add({
      targets: ring,
      scale: 0.4,
      alpha: 0,
      duration: 450,
      ease: 'Quad.easeIn',
      onComplete: () => ring.destroy(),
    });

    const canvas = scene.game.canvas;
    const rect = canvas.getBoundingClientRect();
    const clientX = rect.left + (worldX / scene.scale.width) * rect.width;
    const clientY = rect.top + (worldY / scene.scale.height) * rect.height;
    for (const type of ['mousedown', 'mouseup'] as const) {
      canvas.dispatchEvent(new MouseEvent(type, { clientX, clientY, button: 0, bubbles: true }));
    }
  }

  private attachChip(scene: Phaser.Scene): void {
    const chip = scene.add
      .text(14, 18, 'AUTO ▸ tap to stop', {
        fontFamily: 'Georgia, serif',
        fontSize: '13px',
        color: '#9df0e8',
        backgroundColor: '#0e0d16cc',
        padding: { x: 8, y: 5 },
      })
      .setDepth(90)
      .setScrollFactor(0)
      .setInteractive({ useHandCursor: true });
    chip.on(
      'pointerdown',
      (_p: Phaser.Input.Pointer, _x: number, _y: number, event: Phaser.Types.Input.EventData) => {
        event.stopPropagation();
        this.stop();
        chip.destroy();
      },
    );
  }
}

export const autoplay = new Autoplay();
