import Phaser from 'phaser';
import { BedroomScene } from './scenes/BedroomScene';
import { FantasyScene } from './scenes/FantasyScene';
import { TitleScene } from './scenes/TitleScene';
import { gameState } from './systems/state';

// Base design size (portrait phone). EXPAND grows the game world to match the
// device aspect ratio, so there is never letterboxing — scenes must lay
// themselves out from this.scale.width/height, not these constants.
export const BASE_WIDTH = 390;
export const BASE_HEIGHT = 844;

gameState.load();

const game = new Phaser.Game({
  type: Phaser.AUTO,
  parent: 'game',
  width: BASE_WIDTH,
  height: BASE_HEIGHT,
  backgroundColor: '#0e0d16',
  render: {
    antialias: true,
  },
  scale: {
    mode: Phaser.Scale.EXPAND,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  scene: [TitleScene, BedroomScene, FantasyScene],
});

// Re-lay-out the active scene when the viewport changes (rotation, browser
// chrome collapsing, window resize). Scenes are stateless beyond gameState,
// so a restart is safe and much simpler than per-object reflow.
let resizeTimer: ReturnType<typeof setTimeout> | undefined;
game.scale.on(Phaser.Scale.Events.RESIZE, () => {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(() => {
    const active = game.scene.getScenes(true)[0];
    active?.scene.restart();
  }, 250);
});

if (import.meta.env.DEV) {
  // NOTE: dev-only hook so the game can be driven from the console / tooling
  Object.assign(window, { __sw: game });
}
