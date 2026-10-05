// ============================================================
// Sub-team badge styling — single source of truth.
//
// Keys match the Sub-Team option values in the member schema
// (src/payload/collections/Members.ts, via src/payload/fields/subteam.ts).
// Used by the team directory, the
// member dossier, and any badge that colours a sub-team.
// ============================================================

export const SUBTEAM_COLORS: Record<string, string> = {
  management: 'bg-purple-50 text-purple-950 ring-1 ring-inset ring-purple-600/20 dark:bg-purple-950/50 dark:text-purple-400 dark:ring-purple-400/25',
  controls: 'bg-blue-50 text-blue-950 ring-1 ring-inset ring-blue-600/20 dark:bg-blue-950/50 dark:text-blue-400 dark:ring-blue-400/25',
  mechanical: 'bg-amber-50 text-amber-950 ring-1 ring-inset ring-amber-600/20 dark:bg-amber-950/50 dark:text-amber-400 dark:ring-amber-400/25',
  electronics: 'bg-yellow-50 text-yellow-950 ring-1 ring-inset ring-yellow-600/20 dark:bg-yellow-950/50 dark:text-yellow-400 dark:ring-yellow-400/25',
  science: 'bg-emerald-50 text-emerald-950 ring-1 ring-inset ring-emerald-600/20 dark:bg-emerald-950/50 dark:text-emerald-400 dark:ring-emerald-400/25',
  uav: 'bg-sky-50 text-sky-950 ring-1 ring-inset ring-sky-600/20 dark:bg-sky-950/50 dark:text-sky-400 dark:ring-sky-400/25',
  network: 'bg-cyan-50 text-cyan-950 ring-1 ring-inset ring-cyan-600/20 dark:bg-cyan-950/50 dark:text-cyan-400 dark:ring-cyan-400/25',
  autonomous: 'bg-green-50 text-green-950 ring-1 ring-inset ring-green-600/20 dark:bg-green-950/50 dark:text-green-400 dark:ring-green-400/25',
  rnd: 'bg-violet-50 text-violet-950 ring-1 ring-inset ring-violet-600/20 dark:bg-violet-950/50 dark:text-violet-400 dark:ring-violet-400/25',
}

export const SUBTEAM_LABEL: Record<string, string> = {
  uav: 'UAV',
  rnd: 'R&D',
  autonomous: 'Autonomous',
  controls: 'Controls',
  mechanical: 'Mechanical',
  electronics: 'Electronics',
  science: 'Science',
  network: 'Network',
  management: 'Management',
}

export const labelFor = (s: string) => SUBTEAM_LABEL[s] ?? s.charAt(0).toUpperCase() + s.slice(1)
