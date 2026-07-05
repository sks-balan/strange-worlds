import { describe, expect, it } from 'vitest';
import {
  SAVE_KEY,
  clearSave,
  loadSave,
  writeSave,
  type SaveGame,
  type StorageLike,
} from '../src/persistence/save';

function fakeStorage(initial: Record<string, string> = {}): StorageLike & { data: Map<string, string> } {
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
    const save: SaveGame = { version: 1, scene: 'Fantasy', flags: ['bedroom.poster'] };
    writeSave(save, storage);
    expect(loadSave(storage)).toEqual(save);
  });

  it('returns null when no save exists', () => {
    expect(loadSave(fakeStorage())).toBeNull();
  });

  it('clears a save', () => {
    const storage = fakeStorage();
    writeSave({ version: 1, scene: 'Bedroom', flags: [] }, storage);
    clearSave(storage);
    expect(loadSave(storage)).toBeNull();
  });
});

describe('corrupt or foreign save data', () => {
  it('rejects unparseable JSON', () => {
    expect(loadSave(fakeStorage({ [SAVE_KEY]: 'not json{' }))).toBeNull();
  });

  it('rejects a save with the wrong shape', () => {
    expect(loadSave(fakeStorage({ [SAVE_KEY]: '{"version":1,"scene":42,"flags":[]}' }))).toBeNull();
    expect(loadSave(fakeStorage({ [SAVE_KEY]: '{"version":1,"scene":"Bedroom","flags":[7]}' }))).toBeNull();
  });

  it('rejects a future save version', () => {
    expect(
      loadSave(fakeStorage({ [SAVE_KEY]: '{"version":2,"scene":"Bedroom","flags":[]}' })),
    ).toBeNull();
  });
});
