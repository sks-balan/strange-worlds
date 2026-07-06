import Phaser from 'phaser';

/** Small expanding ring where the player tapped — instant feedback. */
export function tapMarker(scene: Phaser.Scene, x: number, y: number, color = 0x9df0e8): void {
  const ring = scene.add.circle(x, y, 7).setStrokeStyle(2, color, 0.85);
  scene.tweens.add({
    targets: ring,
    scale: 2.3,
    alpha: 0,
    duration: 380,
    ease: 'Quad.easeOut',
    onComplete: () => ring.destroy(),
  });
}
