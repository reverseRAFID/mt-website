import { PageLayout } from '@/components/layout/PageLayout'
import type { Metadata } from 'next'
import { getMembers } from '@/lib/cms/content'
import { GhostText } from '@/components/motion/GhostText'
import { PageHero } from '@/components/ui/PageHero'
import { TeamDirectory } from '@/components/team/TeamDirectory'
import { SupportCTA } from '@/components/support/SupportCTA'

export const metadata: Metadata = { title: 'The Team' }

export default async function TeamPage() {
  const members = await getMembers()

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

      <section className="relative py-20 lg:py-28">
        <GhostText text="ROSTER" drift="left" />
        <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute inset-0 tech-grid-sm mask-radial-fade opacity-[0.4]" />
          <div className="absolute -left-32 top-16 h-[420px] w-[420px] rounded-full glow-orange blur-[130px] opacity-30" />
        </div>
        <div className="section-container relative z-10">
          <TeamDirectory members={members} />
        </div>
      </section>
      <SupportCTA copy="team" />
    </PageLayout>
  )
}
