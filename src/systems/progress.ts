import { loadSave, writeSave, type SaveGame, type StorageLike } from '../persistence/save';

export type LevelKey = 'Bedroom' | 'Fantasy';
export type SceneKey = 'Title' | LevelKey;

export const LEVELS: readonly LevelKey[] = ['Bedroom', 'Fantasy'];

export const LEVEL_INFO: Record<LevelKey, { title: string; flagPrefix: string }> = {
  Bedroom: { title: 'The Bedroom', flagPrefix: 'bedroom.' },
  Fantasy: { title: 'The Other Side', flagPrefix: 'fantasy.' },
};

export function isLevel(scene: string): scene is LevelKey {
  return (LEVELS as readonly string[]).includes(scene);
}

// Game-life management: one active run (scene + flags) plus a permanent
// record of every level reached. Restarting a level or starting a new game
// only touches the run — reached levels stay reachable from the title screen.
export class GameProgress {
  flags = new Set<string>();
  scene: LevelKey = 'Bedroom';
  unlocked = new Set<LevelKey>();
  hasSave = false;

  constructor(private storage?: StorageLike) {}

  load(): void {
    const save = loadSave(this.storage);
    if (save === null) return;
    this.flags = new Set(save.current.flags);
    this.scene = isLevel(save.current.scene) ? save.current.scene : 'Bedroom';
    this.unlocked = new Set(save.unlocked.filter(isLevel));
    this.unlocked.add(this.scene);
    this.hasSave = true;
  }

  has(flag: string): boolean {
    return this.flags.has(flag);
  }

  setFlag(flag: string): void {
    this.flags.add(flag);
    this.persist();
  }

  /** Called by every level's create() — records position and unlocks it. */
  enterScene(scene: LevelKey): void {
    this.scene = scene;
    this.unlocked.add(scene);
    this.hasSave = true;
    this.persist();
  }

  /** Replay a level from scratch: clears only that level's flags. */
  restartLevel(level: LevelKey): void {
    const prefix = LEVEL_INFO[level].flagPrefix;
    this.flags = new Set([...this.flags].filter((f) => !f.startsWith(prefix)));
    this.scene = level;
    this.persist();
  }

  /** Fresh run from the beginning. Unlocked levels are deliberately kept. */
  newGame(): void {
    this.flags.clear();
    this.scene = 'Bedroom';
    this.hasSave = true;
    this.persist();
  }

  private persist(): void {
    const save: SaveGame = {
      version: 2,
      current: { scene: this.scene, flags: [...this.flags] },
      unlocked: [...this.unlocked],
    };
    writeSave(save, this.storage);
  }
}

export const progress = new GameProgress();
