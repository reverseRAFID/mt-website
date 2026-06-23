import { PageLayout } from '@/components/layout/PageLayout'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { PortableText } from '@portabletext/react'
import { sanityFetch, urlFor, getFileUrl } from '@/sanity/lib/client'
import { ROVER_BY_SLUG_QUERY, ROVERS_QUERY } from '@/sanity/lib/queries'
import type { RoverFull, RoverCard } from '@/sanity/lib/types'
import { Reveal } from '@/components/motion/Reveal'
import { CornerTicks } from '@/components/ui/CornerTicks'
import { RoverHero } from '@/components/rover/RoverHero'
import { RoverInnovations } from '@/components/rover/RoverInnovations'
import { RoverSubsystems } from '@/components/rover/RoverSubsystems'
import { RoverSpecReadout } from '@/components/rover/RoverSpecReadout'
import { RoverMissions } from '@/components/rover/RoverMissions'
import { RoverSarVideo } from '@/components/rover/RoverSarVideo'
import { RoverGallery } from '@/components/rover/RoverGallery'
import { RoverCrew } from '@/components/rover/RoverCrew'
import { RoverFleetStrip } from '@/components/rover/RoverFleetStrip'

interface Props {
  params: Promise<{ slug: string }>
}

export async function generateStaticParams() {
  const rovers = await sanityFetch<RoverCard[]>(ROVERS_QUERY)
  return rovers?.filter((r) => r?.slug?.current).map((r) => ({ slug: r.slug.current })) ?? []
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const rover = await sanityFetch<RoverFull | null>(ROVER_BY_SLUG_QUERY, { slug })
  if (!rover) return { title: 'Rover' }
  const hero = rover.featuredImage ?? rover.gallery?.[0]
  return {
    title: `${rover.name} — Rover`,
    description: rover.tagline ?? rover.overview,
    openGraph: {
      title: `${rover.name} · BRACU Mongol-Tori`,
      description: rover.tagline ?? rover.overview ?? undefined,
      images: hero ? [urlFor(hero).width(1200).height(630).fit('crop').url()] : undefined,
    },
  }
}

export default async function RoverPage({ params }: Props) {
  const { slug } = await params
  const rover = await sanityFetch<RoverFull | null>(ROVER_BY_SLUG_QUERY, { slug })
  if (!rover) notFound()

  // Resolve hero media: explicit featured image, else first gallery shot.
  const heroSource = rover.featuredImage ?? rover.gallery?.[0]
  const heroUrl = heroSource ? urlFor(heroSource).width(2000).height(1300).fit('crop').url() : undefined
  // Avoid repeating the hero shot in the gallery grid when it came from gallery[0].
  const galleryImages = rover.featuredImage ? rover.gallery ?? [] : (rover.gallery ?? []).slice(1)
  const pdfUrl = rover.technicalPdf?.asset?._ref ? getFileUrl(rover.technicalPdf.asset._ref) : undefined

  const comp = rover.competition
  const metaRows: Array<{ label: string; value: React.ReactNode }> = []
  if (comp) {
    metaRows.push({
      label: 'Competition',
      value: comp.slug ? (
        <Link href={`/competitions/${comp.slug.current}`} className="text-text transition-colors hover:text-primary">
          {comp.shortName} {comp.year}
        </Link>
      ) : (
        `${comp.shortName} ${comp.year}`
      ),
    })
    if (comp.location) metaRows.push({ label: 'Venue', value: comp.location })
    if (comp.rank) metaRows.push({ label: 'Result', value: `#${comp.rank}${comp.totalTeams ? ` of ${comp.totalTeams}` : ''}` })
    else if (comp.result) metaRows.push({ label: 'Result', value: comp.result })
  }
  metaRows.push({ label: 'Year', value: String(rover.year) })
  if (rover.teamLead) metaRows.push({ label: 'Team Lead', value: rover.teamLead })

  return (
    <PageLayout>
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
        hasVideo={Boolean(rover.sarVideoUrl)}
      />

      {/* Mission brief */}
      {(rover.overview || rover.description || metaRows.length > 0) && (
        <section className="relative py-16 lg:py-24">
          <div className="section-container grid gap-10 lg:grid-cols-[1.5fr_1fr] lg:gap-16">
            <Reveal>
              <div className="mb-5 flex items-center gap-2.5">
                <span className="h-1.5 w-1.5 rotate-45 bg-primary" aria-hidden />
                <span className="hud-label text-primary">Mission Brief</span>
              </div>
              {rover.overview && (
                <p className="max-w-2xl text-balance font-display text-xl font-medium leading-snug tracking-tight text-text sm:text-2xl lg:text-3xl">
                  {rover.overview}
                </p>
              )}
              {rover.description && (
                <div className="prose prose-sm mt-7 max-w-none leading-relaxed text-text-muted">
                  <PortableText value={rover.description} />
                </div>
              )}
            </Reveal>

            {metaRows.length > 0 && (
              <Reveal y={20}>
                <div className="relative rounded-card border border-divider bg-surface-raised p-6 lg:sticky lg:top-24">
                  <CornerTicks className="text-primary/25" />
                  <div className="mb-4 hud-label text-text-faint">Spec Sheet</div>
                  <dl className="divide-y divide-divider">
                    {metaRows.map((row) => (
                      <div key={row.label} className="flex items-baseline justify-between gap-4 py-3">
                        <dt className="hud-label text-text-faint">{row.label}</dt>
                        <dd className="text-right text-sm font-medium text-text">{row.value}</dd>
                      </div>
                    ))}
                  </dl>
                  {pdfUrl && (
                    <a
                      href={pdfUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-none border border-border px-4 py-2.5 text-sm font-semibold text-text-muted transition-colors hover:border-primary hover:text-primary"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                        <path d="M12 17V3M7 12l5 5 5-5M20 21H4" />
                      </svg>
                      Download SAR PDF
                    </a>
                  )}
                </div>
              </Reveal>
            )}
          </div>
        </section>
      )}

      <RoverInnovations innovations={rover.keyInnovations ?? []} roverName={rover.name} index="01" />
      <RoverSubsystems subsystems={rover.subsystems ?? []} index="02" />
      <RoverSpecReadout keySpecs={rover.keySpecs} namedComponents={rover.namedComponents} index="03" />
      <RoverMissions missions={rover.missions ?? []} index="04" />
      <RoverSarVideo url={rover.sarVideoUrl} roverName={rover.name} year={rover.year} index="05" />
      <RoverGallery images={galleryImages} roverName={rover.name} index="06" />
      <RoverCrew crew={rover.crew ?? []} roverName={rover.name} index="07" />
      <RoverFleetStrip rovers={rover.siblings} />
    </PageLayout>
  )
}
