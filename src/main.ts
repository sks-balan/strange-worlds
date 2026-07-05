import Phaser from 'phaser';
import { BedroomScene } from './scenes/BedroomScene';
import { FantasyScene } from './scenes/FantasyScene';
import { TitleScene } from './scenes/TitleScene';
import { gameState } from './systems/state';

// Portrait phone canvas; FIT scaling letterboxes on other aspect ratios.
export const GAME_WIDTH = 390;
export const GAME_HEIGHT = 844;

gameState.load();

const game = new Phaser.Game({
  type: Phaser.AUTO,
  parent: 'game',
  width: GAME_WIDTH,
  height: GAME_HEIGHT,
  backgroundColor: '#0e0d16',
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  scene: [TitleScene, BedroomScene, FantasyScene],
});

if (import.meta.env.DEV) {
  // NOTE: dev-only hook so the game can be driven from the console / tooling
  Object.assign(window, { __sw: game });
}
