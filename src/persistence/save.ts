export interface SaveGame {
  version: 2;
  /** The active run: where she is and which story flags are set. */
  current: {
    scene: string;
    flags: string[];
  };
  /** Every level ever reached — never shrinks, survives restarts/new games. */
  unlocked: string[];
}

export const SAVE_KEY = 'strange-worlds-save';

export type StorageLike = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;

export function loadSave(storage: StorageLike = localStorage): SaveGame | null {
  const raw = storage.getItem(SAVE_KEY);
  if (raw === null) return null;
  try {
    const data: unknown = JSON.parse(raw);
    if (isSaveGameV2(data)) return data;
    const migrated = migrateV1(data);
    if (migrated !== null) return migrated;
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

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((v) => typeof v === 'string');
}

function isSaveGameV2(data: unknown): data is SaveGame {
  if (typeof data !== 'object' || data === null) return false;
  const record = data as Record<string, unknown>;
  if (record.version !== 2 || !isStringArray(record.unlocked)) return false;
  const current = record.current;
  if (typeof current !== 'object' || current === null) return false;
  const cur = current as Record<string, unknown>;
  return typeof cur.scene === 'string' && isStringArray(cur.flags);
}

/** v1 saves had { version: 1, scene, flags } with no unlock tracking. */
function migrateV1(data: unknown): SaveGame | null {
  if (typeof data !== 'object' || data === null) return null;
  const record = data as Record<string, unknown>;
  if (record.version !== 1 || typeof record.scene !== 'string' || !isStringArray(record.flags)) {
    return null;
  }
  const unlocked = record.scene === 'Fantasy' ? ['Bedroom', 'Fantasy'] : ['Bedroom'];
  return {
    version: 2,
    current: { scene: record.scene, flags: record.flags },
    unlocked,
  };
}
