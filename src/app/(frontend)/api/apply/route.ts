import { NextResponse } from 'next/server'
import { sanityWriteClient } from '@/sanity/lib/writeClient'
import { sanityClient } from '@/sanity/lib/client'
import { RECRUITMENT_CONFIG_QUERY } from '@/sanity/lib/queries'
import type { RecruitmentConfig } from '@/sanity/lib/types'
import { isApplySubteam } from '@/lib/subteams'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

// Field length caps — reject obviously abusive payloads.
const MAX = { short: 200, long: 5000 } as const

function str(v: unknown): string {
  return typeof v === 'string' ? v.trim() : ''
}

export async function POST(req: Request) {
  try {
    // Writes require an Editor token. Fail clearly rather than 401-ing deep in
    // the Sanity client when the env var is missing.
    if (!process.env.SANITY_API_TOKEN) {
      console.error('[apply] SANITY_API_TOKEN is not set — cannot accept submissions')
      return NextResponse.json(
        { error: 'Submissions are temporarily unavailable. Please try again later.' },
        { status: 503 }
      )
    }

    const body = await req.json().catch(() => null)
    if (!body || typeof body !== 'object') {
      return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 })
    }

    const name = str(body.name)
    const email = str(body.email).toLowerCase()
    const phone = str(body.phone)
    const studentId = str(body.studentId)
    const department = str(body.department)
    const year = str(body.year)
    const subteam1 = str(body.subteam1)
    const subteam2 = str(body.subteam2)
    const whyJoin = str(body.whyJoin)
    const experience = str(body.experience)
    const portfolio = str(body.portfolio)

    // Required fields
    if (!name || !email || !studentId || !department || !year || !subteam1 || !whyJoin) {
      return NextResponse.json({ error: 'Please fill in all required fields.' }, { status: 400 })
    }
    if (!EMAIL_RE.test(email)) {
      return NextResponse.json({ error: 'Please enter a valid email address.' }, { status: 400 })
    }
    if (!isApplySubteam(subteam1) || (subteam2 && !isApplySubteam(subteam2))) {
      return NextResponse.json({ error: 'Invalid sub-team selection.' }, { status: 400 })
    }
    if (subteam2 && subteam2 === subteam1) {
      return NextResponse.json({ error: 'Please choose two different sub-teams.' }, { status: 400 })
    }
    // Length guards
    if (
      [name, email, phone, studentId, department, year, portfolio].some((v) => v.length > MAX.short) ||
      whyJoin.length > MAX.long ||
      experience.length > MAX.long
    ) {
      return NextResponse.json({ error: 'One or more fields are too long.' }, { status: 400 })
    }

    // Recruitment must be open (server-side gate — defends the endpoint even if
    // the page is reached directly).
    const recruitment = await sanityClient.fetch<RecruitmentConfig | null>(RECRUITMENT_CONFIG_QUERY)
    if (recruitment?.status !== 'open') {
      return NextResponse.json({ error: 'Applications are currently closed.' }, { status: 403 })
    }

    await sanityWriteClient.create({
      _type: 'application',
      status: 'new',
      name,
      email,
      phone: phone || undefined,
      studentId,
      department,
      year,
      subteam1,
      subteam2: subteam2 || undefined,
      whyJoin,
      experience: experience || undefined,
      portfolio: portfolio || undefined,
      submittedAt: new Date().toISOString(),
    })

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[apply]', err)
    return NextResponse.json({ error: 'Submission failed. Please try again.' }, { status: 500 })
  }
}
