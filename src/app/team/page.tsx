import { PageLayout } from '@/components/layout/PageLayout'
import type { Metadata } from 'next'
import { sanityFetch } from '@/sanity/lib/client'
import { MEMBERS_QUERY } from '@/sanity/lib/queries'
import type { MemberCard } from '@/sanity/lib/types'
import { PageHero } from '@/components/ui/PageHero'
import { TeamDirectory } from '@/components/team/TeamDirectory'

export const metadata: Metadata = { title: 'The Team' }

export default async function TeamPage() {
  const members = (await sanityFetch<MemberCard[]>(MEMBERS_QUERY)) ?? []

  return (
    <PageLayout>
      <PageHero
        index="03"
        kicker="Crew Manifest"
        title="The Team"
        description="Current members and alumni — the engineers, scientists, and leaders who built Mongol-Tori. Filter by sub-team to explore the crew."
        watermark="CREW"
        stat={{ value: members.length, label: 'On Record' }}
      />

      <section className="relative py-16 lg:py-24">
        <div className="section-container">
          <TeamDirectory members={members} />
        </div>
      </section>
    </PageLayout>
  )
}
