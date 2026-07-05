import { loadSave, writeSave } from '../persistence/save';

export type SceneKey = 'Title' | 'Bedroom' | 'Fantasy';

const RESUMABLE_SCENES: readonly SceneKey[] = ['Bedroom', 'Fantasy'];

function isResumableScene(scene: string): scene is SceneKey {
  return (RESUMABLE_SCENES as readonly string[]).includes(scene);
}

class GameState {
  flags = new Set<string>();
  scene: SceneKey = 'Bedroom';
  hasSave = false;

  load(): void {
    const save = loadSave();
    if (save === null) return;
    this.flags = new Set(save.flags);
    this.scene = isResumableScene(save.scene) ? save.scene : 'Bedroom';
    this.hasSave = true;
  }

  has(flag: string): boolean {
    return this.flags.has(flag);
  }

  setFlag(flag: string): void {
    this.flags.add(flag);
    this.persist();
  }

  enterScene(scene: SceneKey): void {
    this.scene = scene;
    this.hasSave = true;
    this.persist();
  }

  private persist(): void {
    writeSave({ version: 1, scene: this.scene, flags: [...this.flags] });
  }
}

// NOTE: a single mutable game state shared by all scenes; every change is
// autosaved immediately, which is the whole save model for milestone 1.
export const gameState = new GameState();
