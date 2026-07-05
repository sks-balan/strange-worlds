import Phaser from 'phaser';

// Placeholder art, generated at runtime — no asset files until the visual pass.
export function ensureTextures(scene: Phaser.Scene): void {
  if (!scene.textures.exists('girl')) {
    const g = scene.make.graphics({ x: 0, y: 0 }, false);
    // hair
    g.fillStyle(0x4a4e69, 1);
    g.fillCircle(13, 11, 10);
    g.fillRect(3, 11, 20, 8);
    // face
    g.fillStyle(0xf2e9e4, 1);
    g.fillCircle(13, 13, 7);
    // body
    g.fillStyle(0x9a8c98, 1);
    g.fillRoundedRect(5, 21, 16, 24, 5);
    // legs
    g.fillStyle(0x4a4e69, 1);
    g.fillRect(8, 44, 4, 8);
    g.fillRect(14, 44, 4, 8);
    g.generateTexture('girl', 26, 52);
    g.destroy();
  }

  if (!scene.textures.exists('dot')) {
    const g = scene.make.graphics({ x: 0, y: 0 }, false);
    g.fillStyle(0xffffff, 1);
    g.fillCircle(4, 4, 4);
    g.generateTexture('dot', 8, 8);
    g.destroy();
  }
}
