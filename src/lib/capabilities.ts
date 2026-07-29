/**
 * Rover capabilities / innovation reel (editorial).
 *
 * These describe the subsystems every competitive Mars-rover team builds for
 * URC/ERC/IRC missions. Where the featured rover has a matching spec in the CMS
 * (`specKey`), the real value is surfaced on the card; otherwise the card still
 * reads correctly without it.
 *
 * TODO(team): tweak the copy to match the current rover's standout features.
 */

import type { Rover } from '@/lib/cms/types'

/** Spec fields actually projected onto the featured-rover card. */
type CardSpecKey = keyof NonNullable<Rover['specs']>

export interface Capability {
  icon: 'arm' | 'cpu' | 'beaker' | 'wheel' | 'signal' | 'bolt'
  title: string
  description: string
  /** Optional featured-rover spec to surface on the card. */
  specKey?: CardSpecKey
  specLabel?: string
}

export const CAPABILITIES: Capability[] = [
  {
    icon: 'arm',
    title: 'Dexterous robotic arm',
    description:
      'A multi-jointed manipulator that types on keyboards, flips switches, and services equipment with sub-centimetre precision — the same tasks astronauts perform on a real mission.',
    specKey: 'dof',
    specLabel: 'Arm',
  },
  {
    icon: 'cpu',
    title: 'Autonomous navigation',
    description:
      'Fusing GPS, vision, and odometry, the rover drives itself across unmarked terrain to distant targets — no driver, no line of sight, just code and sensors.',
  },
  {
    icon: 'beaker',
    title: 'On-board science lab',
    description:
      'A self-contained payload collects soil, runs assays, and analyses samples for signs of life — turning the rover into a field laboratory on wheels.',
  },
  {
    icon: 'wheel',
    title: 'All-terrain drive',
    description:
      'A rocker-bogie suspension keeps all wheels on the ground over rocks, sand, and steep slopes, so the rover stays stable where the desert is at its worst.',
    specKey: 'driveSystem',
    specLabel: 'Drive',
  },
  {
    icon: 'signal',
    title: 'Long-range comms',
    description:
      'A resilient radio link streams live video and telemetry back to the base station hundreds of metres away, with a mission-control HUD for the operators.',
  },
  {
    icon: 'bolt',
    title: 'Custom power & electronics',
    description:
      'In-house PCBs and a managed power system keep every subsystem running through a full competition run — designed, etched, and debugged by the team.',
  },
]
