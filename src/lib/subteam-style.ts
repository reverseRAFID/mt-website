// ============================================================
// Sub-team badge styling — single source of truth.
//
// Keys match the Sub-Team option values in the member schema
// (src/sanity/schemas/member.ts). Used by the team directory, the
// member dossier, and any badge that colours a sub-team.
// ============================================================

export const SUBTEAM_COLORS: Record<string, string> = {
  management: 'bg-purple-50 text-purple-700 dark:bg-purple-950/50 dark:text-purple-400',
  controls: 'bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-400',
  mechanical: 'bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400',
  electronics: 'bg-yellow-50 text-yellow-700 dark:bg-yellow-950/50 dark:text-yellow-400',
  science: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400',
  uav: 'bg-sky-50 text-sky-700 dark:bg-sky-950/50 dark:text-sky-400',
  network: 'bg-cyan-50 text-cyan-700 dark:bg-cyan-950/50 dark:text-cyan-400',
  autonomous: 'bg-green-50 text-green-700 dark:bg-green-950/50 dark:text-green-400',
  rnd: 'bg-violet-50 text-violet-700 dark:bg-violet-950/50 dark:text-violet-400',
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
