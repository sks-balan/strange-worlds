export interface SaveGame {
  version: 1;
  scene: string;
  flags: string[];
}

export const SAVE_KEY = 'strange-worlds-save';

export type StorageLike = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;

export function loadSave(storage: StorageLike = localStorage): SaveGame | null {
  const raw = storage.getItem(SAVE_KEY);
  if (raw === null) return null;
  try {
    const data: unknown = JSON.parse(raw);
    if (isSaveGame(data)) return data;
  } catch {
    // fall through to the corrupt-save path below
  }
  // NOTE: a corrupt or future-versioned save is treated as "no save" rather
  // than crashing — the player restarts the demo instead of hitting an error.
  console.warn('Strange Worlds: ignoring unreadable save data');
  return null;
}

export function writeSave(save: SaveGame, storage: StorageLike = localStorage): void {
  storage.setItem(SAVE_KEY, JSON.stringify(save));
}

export function clearSave(storage: StorageLike = localStorage): void {
  storage.removeItem(SAVE_KEY);
}

function isSaveGame(data: unknown): data is SaveGame {
  if (typeof data !== 'object' || data === null) return false;
  const record = data as Record<string, unknown>;
  return (
    record.version === 1 &&
    typeof record.scene === 'string' &&
    Array.isArray(record.flags) &&
    record.flags.every((flag) => typeof flag === 'string')
  );
}
