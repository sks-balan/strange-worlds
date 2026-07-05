export const FLAGS = {
  poster: 'bedroom.poster',
  desk: 'bedroom.desk',
  wallTouched: 'bedroom.wall-touched',
  portalRevealed: 'bedroom.portal-revealed',
} as const;

const BEDROOM_INTERACTIONS: readonly string[] = [FLAGS.poster, FLAGS.desk, FLAGS.wallTouched];

export function interactionCount(flags: ReadonlySet<string>): number {
  return BEDROOM_INTERACTIONS.filter((flag) => flags.has(flag)).length;
}

// NOTE: the wall itself counts as one of the "at least two things" — touching
// the wall once, then anything else, then the wall again also opens the portal.
export function shouldRevealPortal(flags: ReadonlySet<string>): boolean {
  return !flags.has(FLAGS.portalRevealed) && interactionCount(flags) >= 2;
}
