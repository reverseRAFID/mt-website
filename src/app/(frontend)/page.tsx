import {
  getActiveSponsors,
  getFeaturedRover,
  getFeaturedTestimonials,
  getLatestCompetition,
  getLatestPosts,
  getLatestSarVideo,
  getResearch,
} from '@/lib/cms/content'

import { AnnouncementBarServer } from '@/components/layout/AnnouncementBarServer'
import { NavbarServer } from '@/components/layout/NavbarServer'
import { Footer } from '@/components/layout/Footer'
import { SupportStickyCTAServer } from '@/components/support/SupportStickyCTAServer'
import { Marquee } from '@/components/ui/Marquee'
import { Hero } from '@/components/sections/Hero'
import { AchievementCallout } from '@/components/sections/AchievementCallout'
import { ImpactMetrics } from '@/components/sections/ImpactMetrics'
import { IMPACT_METRICS } from '@/lib/sponsorship'
import { RoverSpotlight } from '@/components/sections/RoverSpotlight'
import { Innovation } from '@/components/sections/Innovation'
import { VideoHighlight } from '@/components/sections/VideoHighlight'
import { NewsStrip } from '@/components/sections/NewsStrip'
import { ResearchHighlights } from '@/components/sections/ResearchHighlights'
import { CTASection } from '@/components/sections/CTASection'
import { Testimonials } from '@/components/sections/Testimonials'
import { CrowdfundingSection } from '@/components/sections/CrowdfundingSection'
import { ShopTeaser } from '@/components/sections/ShopTeaser'
import { SponsorsStrip } from '@/components/sections/SponsorsStrip'
import { MARQUEE_SUBTEAMS } from '@/lib/subteams'
import { getCrowdfundingConfig, getSupporterCount, getTopSupporters } from '@/lib/cms/donations'
import { getFeaturedProducts, getShopConfig } from '@/lib/cms/shop'

export default async function HomePage() {
  // Fetch all landing page data in parallel
  const [
    competition,
    rover,
    video,
    posts,
    allResearch,
    sponsors,
    testimonials,
    topSupporters,
    supporterCount,
    crowdfunding,
    featuredProducts,
    shopConfig,
  ] = await Promise.all([
    getLatestCompetition(),
    getFeaturedRover(),
    getLatestSarVideo(),
    getLatestPosts(3),
    getResearch(),
    getActiveSponsors(),
    getFeaturedTestimonials(),
    getTopSupporters(),
    getSupporterCount(),
    getCrowdfundingConfig(),
    getFeaturedProducts(4),
    getShopConfig(),
  ])

  // Show only the 3 most recent research papers on the landing page
  const papers = allResearch?.slice(0, 3) ?? []

  return (
    <>
      <AnnouncementBarServer />
      <NavbarServer />
      <main>
        <Hero />
        <AchievementCallout competition={competition} />
        <ImpactMetrics
          kicker="Track record"
          title="Built to compete, proven on the world stage"
          metrics={IMPACT_METRICS.slice(0, 4)}
        />
        <Marquee items={[...MARQUEE_SUBTEAMS]} />
        <RoverSpotlight rover={rover} />
        <Innovation rover={rover} />
        {video && <VideoHighlight video={video} />}
        {posts?.length > 0 && <NewsStrip posts={posts} />}
        {papers.length > 0 && <ResearchHighlights papers={papers} />}
        {testimonials?.length > 0 && <Testimonials testimonials={testimonials} />}
        {/* Nothing to say when the campaign is shut and nobody has been
            verified yet — skip the section rather than show an empty board. */}
        {(crowdfunding.status === 'open' || topSupporters.length > 0) && (
          <CrowdfundingSection
            supporters={topSupporters}
            supporterCount={supporterCount}
            showSupporterCount={crowdfunding.showSupporterCount ?? true}
            isOpen={crowdfunding.status === 'open'}
          />
        )}
        {/* Hidden entirely while the shop is closed. A storefront that cannot
            be bought from is a dead end, and it would compete for attention
            with the crowdfunding ask directly above it. */}
        {shopConfig.status === 'open' && <ShopTeaser products={featuredProducts} />}
        <CTASection />
        <SponsorsStrip sponsors={sponsors ?? []} />
      </main>
      <Footer />
      <SupportStickyCTAServer />
    </>
  )
}
