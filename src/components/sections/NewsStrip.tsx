import Link from 'next/link'
import type { PostCard } from '@/sanity/lib/types'
import { Reveal } from '@/components/motion/Reveal'
import { SectionHeader } from '@/components/ui/SectionHeader'
import { CornerTicks } from '@/components/ui/CornerTicks'

interface NewsStripProps {
  posts: PostCard[]
}

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

export function NewsStrip({ posts }: NewsStripProps) {
  if (posts.length === 0) return null

  return (
    <section className="relative py-20 lg:py-28 bg-bg">
      <div className="section-container">
        <SectionHeader
          index="04"
          kicker="Latest"
          title="News & Updates"
          action={
            <Link
              href="/news"
              className="group inline-flex items-center gap-1.5 text-sm font-semibold text-text-muted hover:text-primary transition-colors"
            >
              All articles
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="transition-transform group-hover:translate-x-0.5"
              >
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </Link>
          }
        />

        <Reveal stagger className="mt-12 grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {posts.map((post) => (
            <Link
              key={post._id}
              href={`/news/${post.slug.current}`}
              className="group relative flex flex-col rounded-card border border-divider bg-surface-raised p-6 transition-all duration-300 hover:border-primary/40 hover:-translate-y-1 hover:shadow-[0_18px_40px_-24px_rgba(var(--primary-rgb),0.55)]"
            >
              <CornerTicks className="text-primary/0 group-hover:text-primary/40 transition-colors" />

              <div className="flex items-center justify-between mb-4">
                <span
                  className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${CATEGORY_COLORS[post.category ?? ''] ?? 'text-text-faint bg-surface-2'}`}
                >
                  {CATEGORY_LABELS[post.category ?? ''] ?? post.category}
                </span>
              </div>

              <h3 className="font-display font-bold text-lg lg:text-xl text-text tracking-tight group-hover:text-primary transition-colors duration-150 mb-2 line-clamp-2">
                {post.title}
              </h3>

              {post.excerpt && (
                <p className="text-sm text-text-muted leading-relaxed line-clamp-3">{post.excerpt}</p>
              )}

              {post.publishedAt && (
                <div className="mt-5 pt-4 border-t border-divider hud-label text-text-faint nums">
                  {new Date(post.publishedAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                </div>
              )}
            </Link>
          ))}
        </Reveal>

        <div className="mt-6 sm:hidden text-center">
          <Link href="/news" className="text-sm font-medium text-primary hover:text-primary-hover">
            View all articles →
          </Link>
        </div>
      </div>
    </section>
  )
}
