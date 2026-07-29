import { PageLayout } from '@/components/layout/PageLayout'
import Link from 'next/link'
import Image from 'next/image'
import type { Metadata } from 'next'
import { getPosts } from '@/lib/cms/content'
import { media } from '@/lib/cms/media'
import { GhostText } from '@/components/motion/GhostText'
import { Reveal } from '@/components/motion/Reveal'
import { PageHero } from '@/components/ui/PageHero'
import { CornerTicks } from '@/components/ui/CornerTicks'
import { SupportCTA } from '@/components/support/SupportCTA'

export const metadata: Metadata = { title: 'News & Blog' }

const CATEGORY_LABELS: Record<string, string> = {
  'competition-update': 'Competition Update',
  'rover-reveal': 'Rover Reveal',
  'research-highlight': 'Research Highlight',
  'outreach': 'Outreach',
  'team-news': 'Team News',
}

export default async function NewsPage() {
  const posts = await getPosts()

  return (
    <PageLayout>
      <PageHero
        kicker="Dispatches"
        title="News & Blog"
        description="Competition recaps, rover reveals, research updates, and team announcements."
        watermark="NEWS"
      />

      <section className="relative py-20 lg:py-28">
        <GhostText text="DISPATCH" drift="left" />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 tech-grid-sm mask-radial-fade opacity-40"
        />
        <div className="section-container relative z-10">
          {!posts?.length ? (
            <Reveal>
              <div className="relative overflow-hidden rounded-card border border-divider bg-surface-raised px-6 py-20 text-center">
                <div
                  aria-hidden
                  className="pointer-events-none absolute inset-0 tech-grid-sm mask-radial-fade opacity-50"
                />
                <div
                  aria-hidden
                  className="pointer-events-none absolute left-1/2 top-1/2 h-64 w-64 -translate-x-1/2 -translate-y-1/2 rounded-full glow-orange opacity-60 blur-[100px]"
                />
                <CornerTicks className="text-primary/30" size="md" />
                <div className="relative">
                  <p className="hud-label text-primary">No Signal</p>
                  <h2 className="mt-4 font-display text-2xl font-bold tracking-tight text-text">
                    No dispatches yet
                  </h2>
                  <p className="mx-auto mt-3 max-w-md text-pretty leading-relaxed text-text-muted">
                    Competition recaps, rover reveals, and research updates will appear
                    here as the mission unfolds.
                  </p>
                  <Link
                    href="/"
                    className="mt-8 inline-flex min-h-[44px] items-center gap-2 rounded-none border border-border bg-bg/40 px-6 py-3 text-sm font-semibold text-text-muted transition-colors hover:border-primary hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                  >
                    Back to home
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      aria-hidden
                    >
                      <path d="M5 12h14M13 6l6 6-6 6" />
                    </svg>
                  </Link>
                </div>
              </div>
            </Reveal>
          ) : (
            <>
              <Reveal className="mb-10 flex items-end justify-between gap-4 border-b border-divider pb-5">
                <div>
                  <p className="hud-label accent-line text-primary">Dispatch Log</p>
                  <h2 className="mt-3 font-display text-2xl font-bold tracking-tight text-text sm:text-3xl">
                    All Dispatches
                  </h2>
                </div>
                <span className="hud-label nums shrink-0 text-text-faint">
                  {String(posts.length).padStart(2, '0')}{' '}
                  {posts.length === 1 ? 'Entry' : 'Entries'}
                </span>
              </Reveal>

              <Reveal stagger className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {posts.map((post, i) => (
                  <Link
                    key={post.id}
                    href={`/news/${post.slug}`}
                    className="group surface-lift relative flex flex-col overflow-hidden rounded-card border border-divider bg-surface-raised hover:border-primary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                  >
                    <CornerTicks className="z-10 text-primary/0 transition-colors group-hover:text-primary/40" />

                    {post.featuredImage ? (
                      <div className="relative aspect-[16/9] overflow-hidden bg-surface-2">
                        <Image
                          src={media(post.featuredImage)?.url ?? ''}
                          alt={post.title}
                          fill
                          className="object-cover transition-transform duration-500 group-hover:scale-105"
                          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                        />
                        <div className="pointer-events-none absolute inset-0 border-b border-divider" />
                      </div>
                    ) : (
                      <div className="relative flex aspect-[16/9] items-center justify-center overflow-hidden bg-surface-2 tech-grid-sm">
                        <span className="figure-ghost select-none text-6xl">
                          {String(i + 1).padStart(2, '0')}
                        </span>
                        <div className="pointer-events-none absolute inset-0 border-b border-divider" />
                      </div>
                    )}

                    <div className="flex flex-1 flex-col p-6">
                      {post.category && (
                        <div className="mb-4">
                          <span className="inline-flex items-center gap-1.5 rounded-none border border-divider bg-surface-2/60 px-2.5 py-1 hud-label text-text-muted">
                            <span className="h-1 w-1 rotate-45 bg-primary" aria-hidden />
                            {CATEGORY_LABELS[post.category] ?? post.category}
                          </span>
                        </div>
                      )}

                      <h2 className="mb-2 line-clamp-2 text-balance font-display text-lg font-bold tracking-tight text-text transition-colors duration-150 group-hover:text-primary">
                        {post.title}
                      </h2>

                      {post.excerpt && (
                        <p className="line-clamp-3 text-pretty text-sm leading-relaxed text-text-muted">
                          {post.excerpt}
                        </p>
                      )}

                      <div className="mt-auto flex items-center justify-between gap-3 border-t border-divider pt-4">
                        {post.publishedAt ? (
                          <time
                            dateTime={post.publishedAt}
                            className="hud-label nums text-text-faint"
                          >
                            {new Date(post.publishedAt).toLocaleDateString('en-US', {
                              month: 'long',
                              day: 'numeric',
                              year: 'numeric',
                            })}
                          </time>
                        ) : (
                          <span className="hud-label text-text-faint">Dispatch</span>
                        )}
                        <span className="inline-flex items-center gap-1.5 hud-label text-text-faint transition-colors group-hover:text-primary">
                          Read
                          <svg
                            width="14"
                            height="14"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            aria-hidden
                            className="transition-transform duration-300 group-hover:translate-x-1"
                          >
                            <path d="M5 12h14M13 6l6 6-6 6" />
                          </svg>
                        </span>
                      </div>
                    </div>
                  </Link>
                ))}
              </Reveal>
            </>
          )}
        </div>
      </section>
      <SupportCTA copy="news" />
    </PageLayout>
  )
}
