import type { Metadata } from 'next'
import { PageLayout } from '@/components/layout/PageLayout'
import { getActiveSponsors } from '@/lib/cms/content'
import { PageHero } from '@/components/ui/PageHero'
import { ImpactMetrics } from '@/components/sections/ImpactMetrics'
import { SponsorValueProps } from '@/components/sponsors/SponsorValueProps'
import { SponsorShowcase } from '@/components/sponsors/SponsorShowcase'
import { SponsorTiers } from '@/components/sponsors/SponsorTiers'
import { TierComparison } from '@/components/sponsors/TierComparison'
import { FundAllocation } from '@/components/sponsors/FundAllocation'
import { PartnershipProcess } from '@/components/sponsors/PartnershipProcess'
import { SponsorFaq } from '@/components/sponsors/SponsorFaq'
import { SponsorCTA } from '@/components/sponsors/SponsorCTA'
import { BecomeSponsorSticky } from '@/components/sponsors/BecomeSponsorSticky'
import { sponsorMailto } from '@/lib/sponsorship'
import { SupportCTA } from '@/components/support/SupportCTA'

export const metadata: Metadata = {
  title: 'Sponsor Us',
  description:
    'Sponsor BRACU Mongol-Tori — put your brand on Bangladesh’s top Mars rover team. Reach, talent, and STEM impact on a global stage.',
}

export default async function SponsorsPage() {
  const sponsors = await getActiveSponsors()

  return (
    <PageLayout>
      <PageHero
        index="00"
        kicker="Partnership"
        title="Sponsor the Mission"
        description="Fuel Bangladesh’s top Mars rover team as we compete on the world stage — and put your brand on the rover, the jersey, and the journey."
        watermark="SPONSOR"
        stat={{ value: 60, suffix: '+', label: 'Engineers to back' }}
      >
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <a
            href={sponsorMailto()}
            className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-none bg-primary px-6 py-3 text-sm font-semibold text-on-accent transition-colors hover:bg-primary-hover"
          >
            Become a Sponsor
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </a>
          <a
            href="#tiers"
            className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-none border border-border px-6 py-3 text-sm font-semibold text-text-muted transition-colors hover:border-primary hover:text-primary"
          >
            See sponsorship tiers
          </a>
        </div>
      </PageHero>

      <SponsorValueProps />

      <ImpactMetrics
        index="02"
        tone="bg"
        title="Why it’s worth it"
        description="The reach and credibility your brand gets behind — backed by real numbers."
      />

      <SponsorShowcase sponsors={sponsors} />

      <div id="tiers" className="scroll-mt-20">
        <SponsorTiers />
      </div>

      <TierComparison />

      <FundAllocation />

      <PartnershipProcess />

      <SponsorFaq />

      <SponsorCTA />

      <SupportCTA copy="sponsors" />

      <BecomeSponsorSticky />
    </PageLayout>
  )
}
