import { NextResponse } from 'next/server'
import { getSql } from '@/lib/db'

const SUBTEAMS = ['mechanical', 'electrical', 'software', 'science', 'drone', 'outreach', 'management']

export async function POST(req: Request) {
  try {
    const sql = getSql()
    const body = await req.json()

    const { name, email, studentId, department, year, subteam1, subteam2, whyJoin, experience } = body

    // Basic validation
    if (!name || !email || !studentId || !department || !year || !subteam1) {
      return NextResponse.json({ error: 'Missing required fields.' }, { status: 400 })
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: 'Invalid email address.' }, { status: 400 })
    }
    if (!SUBTEAMS.includes(subteam1)) {
      return NextResponse.json({ error: 'Invalid sub-team selection.' }, { status: 400 })
    }

    // Ensure table exists
    await sql`
      CREATE TABLE IF NOT EXISTS applications (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT NOT NULL,
        student_id TEXT NOT NULL,
        department TEXT NOT NULL,
        year TEXT NOT NULL,
        subteam1 TEXT NOT NULL,
        subteam2 TEXT,
        why_join TEXT,
        experience TEXT,
        submitted_at TIMESTAMPTZ DEFAULT now()
      )
    `

    await sql`
      INSERT INTO applications (name, email, student_id, department, year, subteam1, subteam2, why_join, experience)
      VALUES (${name}, ${email}, ${studentId}, ${department}, ${year}, ${subteam1}, ${subteam2 ?? null}, ${whyJoin ?? null}, ${experience ?? null})
    `

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[apply]', err)
    return NextResponse.json({ error: 'Submission failed. Please try again.' }, { status: 500 })
  }
}
