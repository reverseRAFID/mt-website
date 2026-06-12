import { PageLayout } from '@/components/layout/PageLayout'
import Link from 'next/link'
import Image from 'next/image'
import type { Metadata } from 'next'
import { sanityFetch, urlFor } from '@/sanity/lib/client'
import { POSTS_QUERY } from '@/sanity/lib/queries'
import type { PostCard } from '@/sanity/lib/types'

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
      <div className="bg-surface border-b border-divider">
        <div className="section-container py-14">
          <div className="accent-line mb-4">
            <p className="text-xs font-semibold uppercase tracking-widest text-text-faint">Updates</p>
          </div>
          <h1 className="font-display font-bold text-5xl text-text mb-3">News & Blog</h1>
          <p className="text-text-muted text-lg max-w-xl">
            Competition recaps, rover reveals, research updates, and team announcements.
          </p>
        </div>
      </div>

      <div className="section-container py-14">
        {!posts?.length ? (
          <div className="py-20 text-center text-text-muted">
            No posts yet — add them in Sanity CMS → News & Blog.
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {posts.map((post) => (
              <Link
                key={post._id}
                href={`/news/${post.slug.current}`}
                className="group bg-surface rounded-xl border border-divider overflow-hidden hover:border-primary/40 hover:shadow-md transition-all duration-200"
              >
                {post.featuredImage && (
                  <div className="aspect-[16/9] relative overflow-hidden bg-surface-2">
                    <Image
                      src={urlFor(post.featuredImage).width(600).height(338).url()}
                      alt={post.title}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    />
                  </div>
                )}
                <div className="p-6">
                  <div className="flex items-center justify-between mb-3">
                    {post.category && (
                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${CATEGORY_COLORS[post.category] ?? 'bg-surface-2 text-text-faint'}`}>
                        {CATEGORY_LABELS[post.category] ?? post.category}
                      </span>
                    )}
                  </div>
                  <h2 className="font-display font-bold text-lg text-text group-hover:text-primary transition-colors mb-2 line-clamp-2">
                    {post.title}
                  </h2>
                  {post.excerpt && (
                    <p className="text-sm text-text-muted leading-relaxed line-clamp-3 mb-4">{post.excerpt}</p>
                  )}
                  {post.publishedAt && (
                    <p className="text-xs text-text-faint">
                      {new Date(post.publishedAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                    </p>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </PageLayout>
  )
}
