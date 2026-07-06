import { describe, expect, it } from 'vitest';
import { GameProgress } from '../src/systems/progress';
import { FLAGS } from '../src/systems/story';
import { fakeStorage } from './save.test';

function playedThroughBedroom(): { p: GameProgress; storage: ReturnType<typeof fakeStorage> } {
  const storage = fakeStorage();
  const p = new GameProgress(storage);
  p.enterScene('Bedroom');
  p.setFlag(FLAGS.poster);
  p.setFlag(FLAGS.desk);
  p.setFlag(FLAGS.portalRevealed);
  p.enterScene('Fantasy');
  return { p, storage };
}

describe('unlock tracking', () => {
  it('records every level reached', () => {
    const { p } = playedThroughBedroom();
    expect([...p.unlocked]).toEqual(['Bedroom', 'Fantasy']);
  });

  it('survives a save/load round trip', () => {
    const { storage } = playedThroughBedroom();
    const reloaded = new GameProgress(storage);
    reloaded.load();
    expect(reloaded.hasSave).toBe(true);
    expect([...reloaded.unlocked]).toEqual(['Bedroom', 'Fantasy']);
    expect(reloaded.scene).toBe('Fantasy');
  });
});

describe('restartLevel', () => {
  it('clears only that level’s flags and keeps everything unlocked', () => {
    const { p } = playedThroughBedroom();
    p.setFlag('fantasy.some-future-flag');
    p.restartLevel('Bedroom');

    expect(p.scene).toBe('Bedroom');
    expect(p.has(FLAGS.poster)).toBe(false);
    expect(p.has(FLAGS.portalRevealed)).toBe(false);
    expect(p.has('fantasy.some-future-flag')).toBe(true); // other level untouched
    expect([...p.unlocked]).toEqual(['Bedroom', 'Fantasy']); // progress kept
  });
});

describe('newGame', () => {
  it('clears the run but keeps unlocked chapters', () => {
    const { p, storage } = playedThroughBedroom();
    p.newGame();

    expect(p.scene).toBe('Bedroom');
    expect(p.flags.size).toBe(0);

    const reloaded = new GameProgress(storage);
    reloaded.load();
    expect([...reloaded.unlocked]).toEqual(['Bedroom', 'Fantasy']);
  });
});
