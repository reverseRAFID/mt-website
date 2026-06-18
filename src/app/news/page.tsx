import { PageLayout } from '@/components/layout/PageLayout'
import Link from 'next/link'
import Image from 'next/image'
import type { Metadata } from 'next'
import { sanityFetch, urlFor } from '@/sanity/lib/client'
import { POSTS_QUERY } from '@/sanity/lib/queries'
import type { PostCard } from '@/sanity/lib/types'
import { Reveal } from '@/components/motion/Reveal'
import { PageHero } from '@/components/ui/PageHero'
import { CornerTicks } from '@/components/ui/CornerTicks'

export const metadata: Metadata = { title: 'News & Blog' }

const CATEGORY_LABELS: Record<string, string> = {
  'competition-update': 'Competition Update',
  'rover-reveal': 'Rover Reveal',
  'research-highlight': 'Research Highlight',
  'outreach': 'Outreach',
  'team-news': 'Team News',
}

const CATEGORY_COLORS: Record<string, string> = {
  'competition-update': 'bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-400',
  'rover-reveal': 'bg-primary-highlight text-primary',
  'team-news': 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400',
  'research-highlight': 'bg-purple-50 text-purple-700 dark:bg-purple-950/50 dark:text-purple-400',
  'outreach': 'bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400',
}

export default async function NewsPage() {
  const posts = await sanityFetch<PostCard[]>(POSTS_QUERY)

  return (
    <PageLayout>
      <PageHero
        kicker="Dispatches"
        title="News & Blog"
        description="Competition recaps, rover reveals, research updates, and team announcements."
        watermark="NEWS"
      />

      <section className="relative py-16 lg:py-24">
        <div className="section-container">
          {!posts?.length ? (
            <Reveal>
              <div className="relative rounded-card border border-divider bg-surface-raised py-20 text-center">
                <CornerTicks className="text-primary/30" />
                <p className="text-text-muted">
                  No posts yet — add them in Sanity CMS → News &amp; Blog.
                </p>
              </div>
            </Reveal>
          ) : (
            <Reveal stagger className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {posts.map((post) => (
                <Link
                  key={post._id}
                  href={`/news/${post.slug.current}`}
                  className="group relative flex flex-col overflow-hidden rounded-card border border-divider bg-surface-raised transition-all duration-300 hover:border-primary/40 hover:-translate-y-1 hover:shadow-[0_18px_40px_-24px_rgba(var(--primary-rgb),0.55)]"
                >
                  <CornerTicks className="z-10 text-primary/0 group-hover:text-primary/40 transition-colors" />

                  {post.featuredImage && (
                    <div className="relative aspect-[16/9] overflow-hidden bg-surface-2">
                      <Image
                        src={urlFor(post.featuredImage).width(600).height(338).url()}
                        alt={post.title}
                        fill
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      />
                      <div className="pointer-events-none absolute inset-0 border-b border-divider" />
                    </div>
                  )}

                  <div className="flex flex-1 flex-col p-6">
                    <div className="mb-4 flex items-center justify-between">
                      {post.category && (
                        <span
                          className={`inline-flex items-center rounded-none px-2.5 py-0.5 text-xs font-semibold ${CATEGORY_COLORS[post.category] ?? 'bg-surface-2 text-text-faint'}`}
                        >
                          {CATEGORY_LABELS[post.category] ?? post.category}
                        </span>
                      )}
                    </div>

                    <h2 className="mb-2 font-display text-lg font-bold tracking-tight text-text transition-colors duration-150 group-hover:text-primary line-clamp-2">
                      {post.title}
                    </h2>

                    {post.excerpt && (
                      <p className="text-sm leading-relaxed text-text-muted line-clamp-3">
                        {post.excerpt}
                      </p>
                    )}

                    {post.publishedAt && (
                      <div className="mt-auto border-t border-divider pt-4 hud-label text-text-faint nums">
                        {new Date(post.publishedAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                      </div>
                    )}
                  </div>
                </Link>
              ))}
            </Reveal>
          )}
        </div>
      </section>
    </PageLayout>
  )
}
