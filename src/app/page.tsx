import { sanityFetch } from '@/sanity/lib/client'
import {
  LATEST_COMPETITION_QUERY,
  FEATURED_ROVER_QUERY,
  LATEST_SAR_VIDEO_QUERY,
  LATEST_POSTS_QUERY,
  RESEARCH_QUERY,
  ACTIVE_SPONSORS_QUERY,
} from '@/sanity/lib/queries'
import type {
  CompetitionCard,
  RoverCard,
  SarVideo,
  PostCard,
  ResearchCard,
  Sponsor,
} from '@/sanity/lib/types'

import { AnnouncementBarServer } from '@/components/layout/AnnouncementBarServer'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import { Marquee } from '@/components/ui/Marquee'
import { Hero } from '@/components/sections/Hero'
import { AchievementCallout } from '@/components/sections/AchievementCallout'
import { ImpactMetrics } from '@/components/sections/ImpactMetrics'
import { IMPACT_METRICS } from '@/lib/sponsorship'
import { RoverSpotlight } from '@/components/sections/RoverSpotlight'
import { VideoHighlight } from '@/components/sections/VideoHighlight'
import { NewsStrip } from '@/components/sections/NewsStrip'
import { ResearchHighlights } from '@/components/sections/ResearchHighlights'
import { CTASection } from '@/components/sections/CTASection'
import { SponsorsStrip } from '@/components/sections/SponsorsStrip'
import { MARQUEE_SUBTEAMS } from '@/lib/subteams'

export default async function HomePage() {
  // Fetch all landing page data in parallel
  const [competition, rover, video, posts, allResearch, sponsors] = await Promise.all([
    sanityFetch<CompetitionCard | null>(LATEST_COMPETITION_QUERY),
    sanityFetch<RoverCard | null>(FEATURED_ROVER_QUERY),
    sanityFetch<SarVideo | null>(LATEST_SAR_VIDEO_QUERY),
    sanityFetch<PostCard[]>(LATEST_POSTS_QUERY),
    sanityFetch<ResearchCard[]>(RESEARCH_QUERY),
    sanityFetch<Sponsor[]>(ACTIVE_SPONSORS_QUERY),
  ])

  // Show only the 3 most recent research papers on the landing page
  const papers = allResearch?.slice(0, 3) ?? []

  return (
    <>
      <AnnouncementBarServer />
      <Navbar />
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
        {video && <VideoHighlight video={video} />}
        {posts?.length > 0 && <NewsStrip posts={posts} />}
        {papers.length > 0 && <ResearchHighlights papers={papers} />}
        <CTASection />
        <SponsorsStrip sponsors={sponsors ?? []} />
      </main>
      <Footer />
    </>
  )
}
