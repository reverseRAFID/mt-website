import { PageLayout } from '@/components/layout/PageLayout'
import Link from 'next/link'
import Image from 'next/image'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { sanityFetch, urlFor } from '@/sanity/lib/client'
import { POST_BY_SLUG_QUERY } from '@/sanity/lib/queries'
import type { PostFull } from '@/sanity/lib/types'
import { PortableText } from '@portabletext/react'

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
      <div className="section-container py-14 max-w-3xl mx-auto">
        <nav className="flex items-center gap-2 text-sm text-text-faint mb-8">
          <Link href="/news" className="hover:text-primary transition-colors">News</Link>
          <span>/</span>
          <span className="text-text line-clamp-1">{post.title}</span>
        </nav>

        <header className="mb-10">
          {post.category && (
            <span className={`text-xs font-semibold px-2.5 py-1 rounded-full mb-4 inline-block ${CATEGORY_COLORS[post.category] ?? 'bg-surface-2 text-text-faint'}`}>
              {CATEGORY_LABELS[post.category] ?? post.category}
            </span>
          )}
          <h1 className="font-display font-bold text-4xl lg:text-5xl text-text mb-4 leading-tight">{post.title}</h1>
          {post.excerpt && <p className="text-lg text-text-muted leading-relaxed mb-6">{post.excerpt}</p>}
          <div className="flex items-center gap-4 text-sm text-text-faint">
            {post.author && (
              <Link href={`/team/${post.author.slug.current}`} className="flex items-center gap-2 hover:text-primary transition-colors">
                {post.author.photo && (
                  <div className="w-7 h-7 rounded-full overflow-hidden relative border border-divider">
                    <Image
                      src={urlFor(post.author.photo).width(28).height(28).url()}
                      alt={post.author.name}
                      fill
                      className="object-cover"
                    />
                  </div>
                )}
                <span>{post.author.name}</span>
              </Link>
            )}
            {post.publishedAt && (
              <span>
                {new Date(post.publishedAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
              </span>
            )}
          </div>
        </header>

        {post.featuredImage && (
          <div className="aspect-[16/9] relative rounded-xl overflow-hidden mb-10 border border-divider">
            <Image
              src={urlFor(post.featuredImage).width(1200).height(675).url()}
              alt={post.title}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 768px"
              priority
            />
          </div>
        )}

        {post.body && (
          <article className="prose prose-neutral dark:prose-invert max-w-none text-text-muted [&_h2]:font-display [&_h2]:text-text [&_h3]:font-display [&_h3]:text-text">
            <PortableText value={post.body} />
          </article>
        )}
      </div>
    </PageLayout>
  )
}
