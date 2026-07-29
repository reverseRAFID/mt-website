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
import { SupportCTA } from '@/components/support/SupportCTA'

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

export default async function PostPage({ params }: Props) {
  const { slug } = await params
  const post = await sanityFetch<PostFull | null>(POST_BY_SLUG_QUERY, { slug })
  if (!post) notFound()

  const publishedLabel = post.publishedAt
    ? new Date(post.publishedAt).toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      })
    : null

  return (
    <PageLayout>
      <article className="section-container py-14 lg:py-20 max-w-3xl mx-auto">
        {/* Breadcrumb */}
        <nav
          aria-label="Breadcrumb"
          className="mb-10 flex items-center gap-2 hud-label text-text-faint"
        >
          <Link
            href="/news"
            className="link-underline transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            News
          </Link>
          <span className="text-text-faint/60" aria-hidden>
            /
          </span>
          <span className="line-clamp-1 font-sans text-xs normal-case tracking-normal text-text-muted">
            {post.title}
          </span>
        </nav>

        {/* Header */}
        <Reveal as="header" className="mb-10">
          {post.category && (
            <span className="mb-5 inline-flex items-center gap-1.5 rounded-none border border-divider bg-surface-2/60 px-2.5 py-1 hud-label text-text-muted">
              <span className="h-1 w-1 rotate-45 bg-primary" aria-hidden />
              {CATEGORY_LABELS[post.category] ?? post.category}
            </span>
          )}
          <h1 className="mb-5 text-balance font-display text-3xl font-bold leading-[1.08] tracking-tight text-text sm:text-4xl lg:text-5xl">
            {post.title}
          </h1>
          {post.excerpt && (
            <p className="mb-6 text-pretty text-lg leading-relaxed text-text-muted">
              {post.excerpt}
            </p>
          )}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-3 border-t border-divider pt-6">
            {post.author && (
              <Link
                href={`/team/${post.author.slug.current}`}
                className="group inline-flex items-center gap-2.5 text-sm font-medium text-text-muted transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              >
                {post.author.photo && (
                  <span className="relative block h-8 w-8 overflow-hidden rounded-none border border-divider transition-colors group-hover:border-primary/40">
                    <Image
                      src={urlFor(post.author.photo).width(32).height(32).url()}
                      alt={post.author.name}
                      fill
                      sizes="32px"
                      className="object-cover"
                    />
                  </span>
                )}
                <span className="inline-flex flex-col leading-tight">
                  <span className="hud-label text-text-faint">Filed by</span>
                  <span>{post.author.name}</span>
                </span>
              </Link>
            )}
            {post.author && publishedLabel && (
              <span className="h-1 w-1 rotate-45 bg-text-faint/50" aria-hidden />
            )}
            {publishedLabel && (
              <time
                dateTime={post.publishedAt}
                className="hud-label nums text-text-faint"
              >
                {publishedLabel}
              </time>
            )}
          </div>
        </Reveal>

        {/* Featured image — framed telemetry panel */}
        {post.featuredImage && (
          <Reveal y={32} blur={6}>
            <figure className="relative mb-12 inset-glow rounded-card border border-divider bg-surface-raised p-2">
              <div className="relative aspect-[16/9] overflow-hidden rounded-none bg-surface-2">
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
            </figure>
          </Reveal>
        )}

        {/* Article body */}
        {post.body && (
          <Reveal
            as="div"
            className="max-w-none text-pretty text-base leading-relaxed text-text-muted sm:text-lg [&_p]:my-5 [&_p]:leading-relaxed [&_h2]:mt-12 [&_h2]:mb-4 [&_h2]:text-balance [&_h2]:font-display [&_h2]:text-2xl [&_h2]:font-bold [&_h2]:tracking-tight [&_h2]:text-text [&_h3]:mt-10 [&_h3]:mb-3 [&_h3]:font-display [&_h3]:text-xl [&_h3]:font-bold [&_h3]:tracking-tight [&_h3]:text-text [&_h4]:mt-8 [&_h4]:mb-2 [&_h4]:font-display [&_h4]:text-lg [&_h4]:font-bold [&_h4]:text-text [&_a]:text-primary [&_a]:underline [&_a]:decoration-primary/40 [&_a]:underline-offset-4 [&_a:hover]:decoration-primary [&_strong]:font-bold [&_strong]:text-text [&_ul]:my-5 [&_ul]:list-disc [&_ul]:space-y-2 [&_ul]:pl-6 [&_ol]:my-5 [&_ol]:list-decimal [&_ol]:space-y-2 [&_ol]:pl-6 [&_li]:pl-1.5 [&_li]:marker:text-primary [&_blockquote]:my-7 [&_blockquote]:border-l-2 [&_blockquote]:border-l-primary [&_blockquote]:pl-5 [&_blockquote]:font-display [&_blockquote]:text-lg [&_blockquote]:font-medium [&_blockquote]:text-text [&_code]:bg-surface-2 [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:font-mono [&_code]:text-sm [&_code]:text-primary [&_pre]:my-6 [&_pre]:overflow-x-auto [&_pre]:border [&_pre]:border-divider [&_pre]:bg-surface-2 [&_pre]:p-4 [&_pre]:text-sm [&_pre_code]:bg-transparent [&_pre_code]:p-0 [&_pre_code]:text-text [&_hr]:my-10 [&_hr]:border-divider [&_img]:my-7 [&_img]:rounded-none [&_img]:border [&_img]:border-divider [&>p:first-of-type]:first-letter:float-left [&>p:first-of-type]:first-letter:mr-3 [&>p:first-of-type]:first-letter:mt-1 [&>p:first-of-type]:first-letter:font-display [&>p:first-of-type]:first-letter:text-6xl [&>p:first-of-type]:first-letter:font-bold [&>p:first-of-type]:first-letter:leading-[0.7] [&>p:first-of-type]:first-letter:text-primary"
          >
            <PortableText value={post.body} />
          </Reveal>
        )}

        {/* Footer nav — return to the dispatch log */}
        <div className="mt-14 border-t border-divider pt-8">
          <Link
            href="/news"
            className="group inline-flex items-center gap-2 hud-label text-text-muted transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              aria-hidden
              className="transition-transform duration-300 group-hover:-translate-x-1"
            >
              <path d="M19 12H5M11 18l-6-6 6-6" />
            </svg>
            All Dispatches
          </Link>
        </div>
      </article>
      <SupportCTA copy="newsDetail" />
    </PageLayout>
  )
}
