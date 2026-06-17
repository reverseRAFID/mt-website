import { PageLayout } from '@/components/layout/PageLayout'
import Link from 'next/link'
import Image from 'next/image'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { sanityFetch, urlFor } from '@/sanity/lib/client'
import { POST_BY_SLUG_QUERY } from '@/sanity/lib/queries'
import type { PostFull } from '@/sanity/lib/types'
import { PortableText } from '@portabletext/react'
import { Reveal } from '@/components/motion/Reveal'
import { CornerTicks } from '@/components/ui/CornerTicks'

interface Props {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const post = await sanityFetch<PostFull | null>(POST_BY_SLUG_QUERY, { slug })
  return {
    title: post?.title ?? 'Post',
    description: post?.excerpt,
  }
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

export default async function PostPage({ params }: Props) {
  const { slug } = await params
  const post = await sanityFetch<PostFull | null>(POST_BY_SLUG_QUERY, { slug })
  if (!post) notFound()

  return (
    <PageLayout>
      <article className="section-container py-14 lg:py-20 max-w-3xl mx-auto">
        {/* Breadcrumb */}
        <nav
          aria-label="Breadcrumb"
          className="flex items-center gap-2 hud-label text-text-faint mb-10"
        >
          <Link href="/news" className="hover:text-primary transition-colors">
            News
          </Link>
          <span className="text-text-faint/60" aria-hidden>
            /
          </span>
          <span className="text-text-muted line-clamp-1 normal-case tracking-normal font-sans text-xs">
            {post.title}
          </span>
        </nav>

        {/* Header */}
        <Reveal as="header" className="mb-10">
          {post.category && (
            <span
              className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold mb-5 ${
                CATEGORY_COLORS[post.category] ?? 'bg-surface-2 text-text-faint'
              }`}
            >
              {CATEGORY_LABELS[post.category] ?? post.category}
            </span>
          )}
          <h1 className="font-display font-bold text-3xl sm:text-4xl lg:text-5xl text-text tracking-tight text-balance leading-[1.08] mb-5">
            {post.title}
          </h1>
          {post.excerpt && (
            <p className="text-lg text-text-muted leading-relaxed text-pretty mb-6">
              {post.excerpt}
            </p>
          )}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-3 pt-6 border-t border-divider">
            {post.author && (
              <Link
                href={`/team/${post.author.slug.current}`}
                className="group inline-flex items-center gap-2.5 text-sm font-medium text-text-muted hover:text-primary transition-colors"
              >
                {post.author.photo && (
                  <span className="relative block w-8 h-8 rounded-full overflow-hidden border border-divider group-hover:border-primary/40 transition-colors">
                    <Image
                      src={urlFor(post.author.photo).width(32).height(32).url()}
                      alt={post.author.name}
                      fill
                      sizes="32px"
                      className="object-cover"
                    />
                  </span>
                )}
                <span>{post.author.name}</span>
              </Link>
            )}
            {post.author && post.publishedAt && (
              <span className="h-1 w-1 rounded-full bg-text-faint/50" aria-hidden />
            )}
            {post.publishedAt && (
              <time
                dateTime={post.publishedAt}
                className="hud-label text-text-faint nums"
              >
                {new Date(post.publishedAt).toLocaleDateString('en-US', {
                  month: 'long',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </time>
            )}
          </div>
        </Reveal>

        {/* Featured image — framed telemetry panel */}
        {post.featuredImage && (
          <Reveal y={32} blur={6}>
            <div className="relative rounded-card border border-divider bg-surface-raised p-2 mb-12 shadow-[0_24px_60px_-32px_rgba(var(--primary-rgb),0.45)]">
              <div className="relative aspect-[16/9] rounded-xl overflow-hidden bg-surface-2">
                <Image
                  src={urlFor(post.featuredImage).width(1200).height(675).url()}
                  alt={post.title}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 768px"
                  priority
                />
                <CornerTicks className="text-primary/40" size="md" />
              </div>
            </div>
          </Reveal>
        )}

        {/* Article body */}
        {post.body && (
          <div className="prose prose-neutral dark:prose-invert max-w-none text-text-muted prose-headings:font-display prose-headings:text-text prose-headings:tracking-tight prose-a:text-primary prose-strong:text-text prose-blockquote:border-l-primary prose-blockquote:text-text-muted prose-code:text-text">
            <PortableText value={post.body} />
          </div>
        )}
      </article>
    </PageLayout>
  )
}
