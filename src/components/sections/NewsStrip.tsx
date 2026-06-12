import Link from 'next/link'
import type { PostCard } from '@/sanity/lib/types'

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
    <section className="py-20 bg-bg">
      <div className="section-container">
        <div className="flex items-end justify-between mb-10">
          <div>
            <div className="accent-line mb-3">
              <p className="text-xs font-semibold uppercase tracking-widest text-text-faint">Latest</p>
            </div>
            <h2 className="font-display font-bold text-3xl lg:text-4xl text-text">News & Updates</h2>
          </div>
          <Link
            href="/news"
            className="hidden sm:inline-flex items-center gap-1.5 text-sm font-medium text-text-muted hover:text-primary transition-colors duration-150"
          >
            All articles
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </Link>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {posts.map((post) => (
            <Link
              key={post._id}
              href={`/news/${post.slug.current}`}
              className="group bg-surface rounded-xl border border-divider p-6 hover:border-primary/40 hover:shadow-md transition-all duration-200"
            >
              <div className="flex items-center justify-between mb-3">
                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${CATEGORY_COLORS[post.category ?? ''] ?? 'text-text-faint bg-surface-2'}`}>
                  {CATEGORY_LABELS[post.category ?? ''] ?? post.category}
                </span>
              </div>
              <h3 className="font-display font-bold text-lg text-text group-hover:text-primary transition-colors duration-150 mb-2 line-clamp-2">
                {post.title}
              </h3>
              {post.excerpt && (
                <p className="text-sm text-text-muted leading-relaxed line-clamp-3">{post.excerpt}</p>
              )}
              {post.publishedAt && (
                <div className="mt-4 text-xs text-text-faint">
                  {new Date(post.publishedAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                </div>
              )}
            </Link>
          ))}
        </div>

        <div className="mt-6 sm:hidden text-center">
          <Link href="/news" className="text-sm font-medium text-primary hover:text-primary-hover">
            View all articles →
          </Link>
        </div>
      </div>
    </section>
  )
}
