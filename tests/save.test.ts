import { describe, expect, it } from 'vitest';
import {
  SAVE_KEY,
  clearSave,
  loadSave,
  writeSave,
  type SaveGame,
  type StorageLike,
} from '../src/persistence/save';

export function fakeStorage(
  initial: Record<string, string> = {},
): StorageLike & { data: Map<string, string> } {
  const data = new Map(Object.entries(initial));
  return {
    data,
    getItem: (key) => data.get(key) ?? null,
    setItem: (key, value) => void data.set(key, value),
    removeItem: (key) => void data.delete(key),
  };
}

describe('save round trip', () => {
  it('writes and reads a save back unchanged', () => {
    const storage = fakeStorage();
    const save: SaveGame = {
      version: 2,
      current: { scene: 'Fantasy', flags: ['bedroom.poster'] },
      unlocked: ['Bedroom', 'Fantasy'],
    };
    writeSave(save, storage);
    expect(loadSave(storage)).toEqual(save);
  });

  it('returns null when no save exists', () => {
    expect(loadSave(fakeStorage())).toBeNull();
  });

  it('clears a save', () => {
    const storage = fakeStorage();
    writeSave({ version: 2, current: { scene: 'Bedroom', flags: [] }, unlocked: ['Bedroom'] }, storage);
    clearSave(storage);
    expect(loadSave(storage)).toBeNull();
  });
});

describe('v1 migration', () => {
  it('migrates a v1 save reaching Fantasy, unlocking both levels', () => {
    const storage = fakeStorage({
      [SAVE_KEY]: '{"version":1,"scene":"Fantasy","flags":["bedroom.poster"]}',
    });
    expect(loadSave(storage)).toEqual({
      version: 2,
      current: { scene: 'Fantasy', flags: ['bedroom.poster'] },
      unlocked: ['Bedroom', 'Fantasy'],
    });
  });

  it('migrates a v1 save still in the bedroom', () => {
    const storage = fakeStorage({ [SAVE_KEY]: '{"version":1,"scene":"Bedroom","flags":[]}' });
    expect(loadSave(storage)?.unlocked).toEqual(['Bedroom']);
  });
});

describe('corrupt or foreign save data', () => {
  it('rejects unparseable JSON', () => {
    expect(loadSave(fakeStorage({ [SAVE_KEY]: 'not json{' }))).toBeNull();
  });

  it('rejects a save with the wrong shape', () => {
    expect(loadSave(fakeStorage({ [SAVE_KEY]: '{"version":2,"current":{"scene":42,"flags":[]},"unlocked":[]}' }))).toBeNull();
    expect(loadSave(fakeStorage({ [SAVE_KEY]: '{"version":2,"current":{"scene":"Bedroom","flags":[7]},"unlocked":[]}' }))).toBeNull();
    expect(loadSave(fakeStorage({ [SAVE_KEY]: '{"version":2,"unlocked":["Bedroom"]}' }))).toBeNull();
  });

  it('rejects a future save version', () => {
    expect(
      loadSave(fakeStorage({ [SAVE_KEY]: '{"version":3,"current":{"scene":"Bedroom","flags":[]},"unlocked":[]}' })),
    ).toBeNull();
  });
});
