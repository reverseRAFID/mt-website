import { PageLayout } from '@/components/layout/PageLayout'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { getRoverBySlug, getRoverSlugs, getSiblingRovers } from '@/lib/cms/content'
import { file, getYouTubeID, media, ogImageUrl } from '@/lib/cms/media'
import { roverHeroImage } from '@/components/rover/roverHelpers'
import { RoverHero } from '@/components/rover/RoverHero'
import { RoverBrief } from '@/components/rover/RoverBrief'
import { RoverInnovations } from '@/components/rover/RoverInnovations'
import { RoverBlueprint } from '@/components/rover/RoverBlueprint'
import { RoverSubsystems } from '@/components/rover/RoverSubsystems'
import { RoverSpecReadout } from '@/components/rover/RoverSpecReadout'
import { RoverMissions } from '@/components/rover/RoverMissions'
import { RoverSarVideo } from '@/components/rover/RoverSarVideo'
import { RoverGallery } from '@/components/rover/RoverGallery'
import { RoverCrew } from '@/components/rover/RoverCrew'
import { RoverFleetStrip } from '@/components/rover/RoverFleetStrip'
import { MissionRail } from '@/components/rover/MissionRail'
import { SupportCTA } from '@/components/support/SupportCTA'

interface Props {
  params: Promise<{ slug: string }>
}

export async function generateStaticParams() {
  return (await getRoverSlugs()).map((slug) => ({ slug }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const rover = await getRoverBySlug(slug)
  if (!rover) return { title: 'Rover' }
  // The stored 1200x630 crop, absolute: a scraper cannot call the image
  // optimiser and has no idea what origin a relative path was relative to.
  const og = ogImageUrl(roverHeroImage(rover))
  return {
    title: `${rover.name} — Rover`,
    description: rover.tagline ?? rover.overview ?? undefined,
    openGraph: {
      title: `${rover.name} · BRACU Mongol-Tori`,
      description: rover.tagline ?? rover.overview ?? undefined,
      images: og ? [og] : undefined,
    },
  }
}

export default async function RoverPage({ params }: Props) {
  const { slug } = await params
  const rover = await getRoverBySlug(slug)
  if (!rover) notFound()

  const [siblings] = await Promise.all([getSiblingRovers(rover.id)])

  // Resolve hero media: explicit featured image, else first gallery shot.
  const heroUrl = media(roverHeroImage(rover))?.url ?? undefined
  // Avoid repeating the hero shot in the gallery grid when it came from gallery[0].
  const galleryImages = rover.featuredImage ? (rover.gallery ?? []) : (rover.gallery ?? []).slice(1)
  const pdfUrl = file(rover.technicalPdf)?.url ?? undefined

  const comp = typeof rover.competition === 'object' ? rover.competition : null
  // Gate the SAR section on the SAME predicate the component renders on, so the
  // hero "Watch SAR Video" CTA can never point at a section that returns null.
  const hasVideo = Boolean(rover.sarVideoUrl && getYouTubeID(rover.sarVideoUrl))
  // A crew row whose member did not come back populated cannot be rendered —
  // the card links to their profile and shows their face.
  const validCrew = (rover.crew ?? []).filter(
    (c) => typeof c?.member === 'object' && c.member?.slug
  )

  // Number ONLY the sections that will actually render (each `show` mirrors the
  // component's own null-guard), so an unseeded section never leaves a gap in
  // the 01..0N sequence and MissionRail's tick count stays truthful.
  const numbered: Array<[string, boolean]> = [
    ['innovations', (rover.keyInnovations?.length ?? 0) > 0],
    ['blueprint', (rover.diagrams?.length ?? 0) > 0],
    ['subsystems', (rover.subsystems?.length ?? 0) > 0],
    ['spec', (rover.keySpecs?.length ?? 0) > 0 || (rover.namedComponents?.length ?? 0) > 0],
    ['missions', (rover.missions?.length ?? 0) > 0],
    ['sar', hasVideo],
    ['gallery', galleryImages.length > 0],
    ['crew', validCrew.length > 0],
  ]
  const idx: Record<string, string> = {}
  let shown = 0
  for (const [key, show] of numbered) {
    if (show) {
      shown += 1
      idx[key] = String(shown).padStart(2, '0')
    }
  }

  return (
    <PageLayout>
      <MissionRail total={shown} callsign={rover.name} />

      <RoverHero
        name={rover.name}
        year={rover.year}
        tagline={rover.tagline}
        overview={rover.overview}
        isFlagship={rover.isFlagship}
        teamLead={rover.teamLead}
        imageUrl={heroUrl}
        specs={rover.specs}
        competition={comp}
        pdfUrl={pdfUrl}
        hasVideo={hasVideo}
      />

      <RoverBrief
        overview={rover.overview}
        description={rover.description}
        competition={comp}
        year={rover.year}
        teamLead={rover.teamLead}
        pdfUrl={pdfUrl}
        slug={rover.slug}
      />

      <RoverInnovations innovations={rover.keyInnovations ?? []} roverName={rover.name} index={idx.innovations} />
      <RoverBlueprint
        diagrams={rover.diagrams}
        annotations={rover.diagramAnnotations}
        cadModel={rover.cadModel}
        name={rover.name}
        year={rover.year}
        index={idx.blueprint}
      />
      <RoverSubsystems subsystems={rover.subsystems ?? []} index={idx.subsystems} />
      <RoverSpecReadout keySpecs={rover.keySpecs} namedComponents={rover.namedComponents} index={idx.spec} />
      <RoverMissions missions={rover.missions ?? []} index={idx.missions} />
      <RoverSarVideo url={rover.sarVideoUrl} roverName={rover.name} year={rover.year} index={idx.sar} />
      <RoverGallery images={galleryImages} roverName={rover.name} index={idx.gallery} />
      <RoverCrew crew={validCrew} roverName={rover.name} index={idx.crew} />
      <RoverFleetStrip rovers={siblings} />
      <SupportCTA copy="roverDetail" />
    </PageLayout>
  )
}
