import { NextResponse } from 'next/server'
import { createApplication, getRecruitmentStatus } from '@/lib/cms/recruitment'
import { isApplySubteam } from '@/lib/subteams'

// Writes to the database and reads the live recruitment gate, so it must never
// be prerendered or cached.
export const dynamic = 'force-dynamic'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

// Field length caps — reject obviously abusive payloads.
const MAX = { short: 200, long: 5000 } as const

function str(v: unknown): string {
  return typeof v === 'string' ? v.trim() : ''
}

export async function POST(req: Request) {
  try {
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
    // Checked separately rather than as one boolean so the type guard actually
    // narrows both values — a combined `||` tells TypeScript nothing about the
    // second one, and the sub-team then reaches the CMS as a bare string.
    if (!isApplySubteam(subteam1)) {
      return NextResponse.json({ error: 'Invalid sub-team selection.' }, { status: 400 })
    }
    if (subteam2 && !isApplySubteam(subteam2)) {
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
    // the page is reached directly). Read uncached: a recruitment drive that
    // closed a minute ago must not still take applications.
    if ((await getRecruitmentStatus()) !== 'open') {
      return NextResponse.json({ error: 'Applications are currently closed.' }, { status: 403 })
    }

    await createApplication({
      name,
      email,
      phone: phone || undefined,
      studentId,
      department,
      year,
      subteam1,
      subteam2: isApplySubteam(subteam2) ? subteam2 : undefined,
      whyJoin,
      experience: experience || undefined,
      portfolio: portfolio || undefined,
    })

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[apply]', err)
    return NextResponse.json({ error: 'Submission failed. Please try again.' }, { status: 500 })
  }
}
