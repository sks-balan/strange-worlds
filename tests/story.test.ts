import { describe, expect, it } from 'vitest';
import { FLAGS, interactionCount, shouldRevealPortal } from '../src/systems/story';

describe('interactionCount', () => {
  it('is zero with no flags', () => {
    expect(interactionCount(new Set())).toBe(0);
  });

  it('counts poster, desk, and wall touches but not unrelated flags', () => {
    const flags = new Set([FLAGS.poster, FLAGS.desk, FLAGS.wallTouched, 'chapter2.whatever']);
    expect(interactionCount(flags)).toBe(3);
  });
});

describe('shouldRevealPortal', () => {
  it('does not reveal with fewer than two interactions', () => {
    expect(shouldRevealPortal(new Set())).toBe(false);
    expect(shouldRevealPortal(new Set([FLAGS.poster]))).toBe(false);
    expect(shouldRevealPortal(new Set([FLAGS.wallTouched]))).toBe(false);
  });

  it('reveals after poster and desk', () => {
    expect(shouldRevealPortal(new Set([FLAGS.poster, FLAGS.desk]))).toBe(true);
  });

  it('reveals after one interaction plus an earlier wall touch', () => {
    expect(shouldRevealPortal(new Set([FLAGS.desk, FLAGS.wallTouched]))).toBe(true);
  });

  it('never reveals twice', () => {
    const flags = new Set([FLAGS.poster, FLAGS.desk, FLAGS.portalRevealed]);
    expect(shouldRevealPortal(flags)).toBe(false);
  });
});
