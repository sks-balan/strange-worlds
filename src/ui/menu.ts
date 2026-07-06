import Phaser from 'phaser';
import { LEVEL_INFO, progress, type LevelKey } from '../systems/progress';

const INK = 0xe8e3f5;
const GLOW = 0x9df0e8;
const PANEL = 0x241b3a;

export interface MenuButton {
  zone: Phaser.GameObjects.Rectangle;
  label: Phaser.GameObjects.Text;
}

/** A rectangular tappable button; stops event propagation to the scene. */
export function makeButton(
  scene: Phaser.Scene,
  x: number,
  y: number,
  w: number,
  h: number,
  text: string,
  onTap: () => void,
  depth = 0,
  fontSize = 20,
): MenuButton {
  const zone = scene.add
    .rectangle(x, y, w, h, PANEL, 0.92)
    .setStrokeStyle(1, GLOW, 0.5)
    .setDepth(depth)
    .setInteractive({ useHandCursor: true });
  const label = scene.add
    .text(x, y, text, {
      fontFamily: 'Georgia, serif',
      fontSize: `${fontSize}px`,
      color: '#e8e3f5',
    })
    .setOrigin(0.5)
    .setDepth(depth);
  zone.on(
    'pointerdown',
    (
      _p: Phaser.Input.Pointer,
      _x: number,
      _y: number,
      event: Phaser.Types.Input.EventData,
    ) => {
      event.stopPropagation();
      onTap();
    },
  );
  return { zone, label };
}

/**
 * Adds the ≡ button (top-right) that opens the pause menu:
 * Resume / Restart level / Exit to title.
 */
export function attachGameMenu(scene: Phaser.Scene, level: LevelKey): void {
  const w = scene.scale.width;
  const h = scene.scale.height;

  const toggle = scene.add
    .circle(w - 32, 34, 19, 0x0e0d16, 0.55)
    .setStrokeStyle(1, GLOW, 0.45)
    .setDepth(50)
    .setScrollFactor(0)
    .setInteractive({ useHandCursor: true });
  const glyph = scene.add.graphics().setDepth(50).setScrollFactor(0);
  glyph.lineStyle(2, INK, 0.9);
  for (let i = -1; i <= 1; i += 1) {
    glyph.lineBetween(w - 40, 34 + i * 5.5, w - 24, 34 + i * 5.5);
  }

  let open: Phaser.GameObjects.GameObject[] | null = null;

  const closeMenu = (): void => {
    open?.forEach((o) => o.destroy());
    open = null;
  };

  const openMenu = (): void => {
    if (open) return;
    const dim = scene.add
      .rectangle(w / 2, h / 2, w, h, 0x0e0d16, 0.72)
      .setDepth(60)
      .setInteractive(); // swallows taps behind the menu
    dim.on(
      'pointerdown',
      (_p: Phaser.Input.Pointer, _x: number, _y: number, e: Phaser.Types.Input.EventData) =>
        e.stopPropagation(),
    );

    const title = scene.add
      .text(w / 2, h * 0.32, LEVEL_INFO[level].title, {
        fontFamily: 'Georgia, serif',
        fontSize: '26px',
        fontStyle: 'italic',
        color: '#8f86ad',
      })
      .setOrigin(0.5)
      .setDepth(61);

    const resume = makeButton(scene, w / 2, h * 0.42, 220, 54, 'Resume', () => closeMenu(), 61);
    const restart = makeButton(
      scene,
      w / 2,
      h * 0.42 + 74,
      220,
      54,
      'Restart level',
      () => {
        progress.restartLevel(level);
        scene.scene.restart();
      },
      61,
    );
    const exit = makeButton(
      scene,
      w / 2,
      h * 0.42 + 148,
      220,
      54,
      'Exit to title',
      () => scene.scene.start('Title'),
      61,
    );

    open = [
      dim,
      title,
      resume.zone,
      resume.label,
      restart.zone,
      restart.label,
      exit.zone,
      exit.label,
    ];
  };

  toggle.on(
    'pointerdown',
    (_p: Phaser.Input.Pointer, _x: number, _y: number, event: Phaser.Types.Input.EventData) => {
      event.stopPropagation();
      openMenu();
    },
  );
}
