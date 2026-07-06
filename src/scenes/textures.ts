import Phaser from 'phaser';

const GIRL_W = 34;
const GIRL_H = 84;

// Leg x-positions per animation frame (left leg, right leg)
const LEG_FRAMES: Record<string, [number, number]> = {
  'girl-idle': [13, 18],
  'girl-walk-a': [9, 20],
  'girl-walk-b': [14, 16],
};

function drawGirl(g: Phaser.GameObjects.Graphics, legs: [number, number]): void {
  // hair — a heavy bob
  g.fillStyle(0x4a4e69, 1);
  g.fillCircle(17, 13, 11);
  g.fillRect(6, 13, 22, 9);
  // face
  g.fillStyle(0xf2e9e4, 1);
  g.fillCircle(17, 18, 6.5);
  // dress
  g.fillStyle(0x9a8c98, 1);
  g.fillRoundedRect(9, 26, 16, 32, 5);
  // arms
  g.fillStyle(0x8a7c88, 1);
  g.fillRect(6, 30, 3, 18);
  g.fillRect(25, 30, 3, 18);
  // legs + shoes
  for (const legX of legs) {
    g.fillStyle(0x4a4e69, 1);
    g.fillRect(legX, 58, 4, 23);
    g.fillStyle(0x241b3a, 1);
    g.fillRect(legX - 1, 80, 6, 4);
  }
}

// Placeholder art, generated at runtime — no asset files until the visual pass.
export function ensureTextures(scene: Phaser.Scene): void {
  for (const [key, legs] of Object.entries(LEG_FRAMES)) {
    if (!scene.textures.exists(key)) {
      const g = scene.make.graphics({ x: 0, y: 0 }, false);
      drawGirl(g, legs);
      g.generateTexture(key, GIRL_W, GIRL_H);
      g.destroy();
    }
  }

  if (!scene.textures.exists('dot')) {
    const g = scene.make.graphics({ x: 0, y: 0 }, false);
    g.fillStyle(0xffffff, 1);
    g.fillCircle(4, 4, 4);
    g.generateTexture('dot', 8, 8);
    g.destroy();
  }
}
