// ============================================================
// Recruitment — SERVER ONLY.
//
// The gate and the write path for /api/apply. Reads that feed a page live in
// content.ts; these two do not belong there because neither may be cached.
// ============================================================

import type { Application } from '@/payload-types'

import { getCms } from './client'

export type RecruitmentStatus = 'open' | 'under-review' | 'closed'

/**
 * The applications-open gate. UNCACHED, deliberately.
 *
 * This is the check /api/apply makes before accepting a submission. Serving it
 * from a cache would mean recruitment closed a minute ago still takes
 * applications, and the people who submit in that window get a confirmation for
 * an application nobody is reading.
 *
 * Fails CLOSED: an unreadable global resolves to `closed`, so a database
 * problem cannot accidentally open recruitment.
 */
export async function getRecruitmentStatus(): Promise<RecruitmentStatus> {
  try {
    const cms = await getCms()
    const config = await cms.findGlobal({ slug: 'recruitment', depth: 0 })
    return (config?.status as RecruitmentStatus) ?? 'closed'
  } catch (err) {
    console.error('[recruitment] status read failed — treating as closed:', err)
    return 'closed'
  }
}

/**
 * What /api/apply hands over.
 *
 * The sub-team fields are typed against the generated collection type rather
 * than as plain strings, so a value that is not on the list is a compile error
 * here as well as a validation failure at the route — APPLY_SUBTEAMS is the one
 * source of truth and this is where the two ends meet.
 */
export interface ApplicationInput {
  name: string
  email: string
  phone?: string
  studentId: string
  department: string
  year: string
  subteam1: NonNullable<Application['subteam1']>
  subteam2?: NonNullable<Application['subteam2']>
  whyJoin: string
  experience?: string
  portfolio?: string
}

/**
 * Record an application.
 *
 * Writes through the Local API, which runs with `overrideAccess: true` — which
 * is exactly why the collection can set `create: nobody` and still work. The
 * only door into this collection is this function, behind the validation and
 * the gate in /api/apply.
 */
export async function createApplication(input: ApplicationInput): Promise<void> {
  const cms = await getCms()
  const data: Partial<Application> = {
    status: 'new',
    ...input,
    submittedAt: new Date().toISOString(),
  }
  await cms.create({ collection: 'applications', data: data as Application })
}
