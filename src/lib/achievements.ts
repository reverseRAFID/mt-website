/**
 * Achievements editorial content (not in the CMS).
 *
 * MILESTONES mirrors the team history already published on the About page —
 * these are real, dated events. Competition rankings and the trend chart are
 * data-driven from the `competitions` collection.
 *
 * TODO(team): keep this list in sync with the About page timeline and add new
 * milestones as they happen.
 */

export interface Milestone {
  year: string
  /** Short uppercase tag, e.g. "World debut". */
  tag: string
  title: string
  detail: string
}

export const MILESTONES: Milestone[] = [
  {
    year: '2017',
    tag: 'Origin',
    title: 'The team is founded',
    detail: 'Mongol-Tori is founded at BRAC University, Dhaka — a student-run Mars rover team.',
  },
  {
    year: '2018',
    tag: 'First build',
    title: 'Mongol-Tori I rolls out',
    detail: 'Our first rover prototype is designed and built from the ground up.',
  },
  {
    year: '2020',
    tag: 'First qualification',
    title: 'Onto the international stage',
    detail: 'The team earns its first international qualification — the International Rover Challenge (IRC).',
  },
  {
    year: '2022',
    tag: 'World debut',
    title: 'Racing in the desert',
    detail: 'Mongol-Tori debuts at the University Rover Challenge (URC) in Hanksville, Utah, USA.',
  },
  {
    year: '2023',
    tag: 'Two continents',
    title: 'Competing across the world',
    detail: 'The team competes at the European Rover Challenge (ERC) in Poland alongside URC.',
  },
  {
    year: '2024',
    tag: 'Best result',
    title: 'Top of our game',
    detail: '11th place at URC — our best world ranking to date, against the world’s leading teams.',
  },
]
