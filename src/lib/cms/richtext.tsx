// ============================================================
// Rich text rendering — replaces <PortableText>.
//
// Payload stores Lexical's serialised editor state rather than Portable Text's
// array of blocks, so the renderer changes even though the output should not.
// Everything the old Portable Text config could express is handled here:
// h2/h3, blockquote, bold/italic/code, links (including the openInNewTab
// annotation), inline images, and the YouTube embed.
// ============================================================

import type { SerializedEditorState } from '@payloadcms/richtext-lexical/lexical'
import type { JSXConvertersFunction } from '@payloadcms/richtext-lexical/react'

import { RichText, defaultJSXConverters } from '@payloadcms/richtext-lexical/react'
import Image from 'next/image'

import type { Media } from '@/payload-types'

import { getYouTubeID } from './media'

/** What a `richText` field holds. Null when the editor was never opened. */
export type RichTextValue = SerializedEditorState | null | undefined

type UploadNode = {
  value?: string | Media
  fields?: { caption?: string | null } | null
}

type YouTubeBlockFields = {
  blockType: 'youtubeEmbed'
  url?: string | null
  caption?: string | null
}

const converters: JSXConvertersFunction = ({ defaultConverters }) => ({
  ...defaultConverters,

  /**
   * Inline images.
   *
   * `sizes` says the image is at most as wide as the prose column, so the
   * browser does not download a 1920px file to render it at 700.
   */
  upload: ({ node }) => {
    const { value, fields } = node as UploadNode
    const doc = value && typeof value === 'object' ? value : null
    if (!doc?.url) return null

    const text = fields?.caption ?? doc.caption ?? null

    return (
      <figure className="my-8">
        <Image
          src={doc.url}
          width={doc.width ?? 1600}
          height={doc.height ?? 900}
          alt={doc.alt ?? ''}
          sizes="(min-width: 768px) 720px, 100vw"
          className="w-full rounded-lg"
        />
        {text ? (
          <figcaption className="mt-2 text-sm opacity-70">{text}</figcaption>
        ) : null}
      </figure>
    )
  },

  blocks: {
    ...defaultConverters.blocks,

    /**
     * YouTube embed.
     *
     * A block rather than a bare URL so the renderer can tell an embed from a
     * link to youtube.com in the middle of a sentence. An unparseable URL
     * renders nothing rather than an empty 16:9 hole.
     */
    youtubeEmbed: ({ node }: { node: { fields: YouTubeBlockFields } }) => {
      const { url, caption } = node.fields
      const id = url ? getYouTubeID(url) : null
      if (!id) return null

      return (
        <figure className="my-8">
          <div className="relative aspect-video overflow-hidden rounded-lg">
            <iframe
              src={`https://www.youtube.com/embed/${id}`}
              title={caption ?? 'YouTube video'}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              loading="lazy"
              className="absolute inset-0 h-full w-full border-0"
            />
          </div>
          {caption ? (
            <figcaption className="mt-2 text-sm opacity-70">{caption}</figcaption>
          ) : null}
        </figure>
      )
    },
  },
})

/**
 * Render a `richText` field.
 *
 * Renders nothing at all for an empty field, so callers can drop it in without
 * guarding — an empty <div> in the middle of a layout is its own bug.
 */
export function RichTextBody({
  value,
  className,
}: {
  value: RichTextValue
  className?: string
}) {
  if (!value || !hasContent(value)) return null
  return <RichText data={value} converters={converters} className={className} />
}

/** True when the editor state holds anything other than one empty paragraph. */
export function hasContent(value: RichTextValue): boolean {
  const children = value?.root?.children
  if (!Array.isArray(children) || children.length === 0) return false
  return children.some((node) => {
    if (node.type !== 'paragraph') return true
    const inner = (node as { children?: unknown[] }).children
    return Array.isArray(inner) && inner.length > 0
  })
}

/**
 * Flatten rich text to plain text.
 *
 * For meta descriptions and card excerpts, where markup would be noise. Walks
 * the tree rather than regexing serialised JSON, so it cannot accidentally pick
 * up a field name or a URL.
 */
export function toPlainText(value: RichTextValue, limit = 300): string {
  if (!value?.root) return ''
  const parts: string[] = []

  const walk = (node: unknown): void => {
    if (!node || typeof node !== 'object') return
    const n = node as { type?: string; text?: string; children?: unknown[] }
    if (typeof n.text === 'string') parts.push(n.text)
    if (Array.isArray(n.children)) n.children.forEach(walk)
  }

  walk(value.root)
  const text = parts.join(' ').replace(/\s+/g, ' ').trim()
  return text.length > limit ? `${text.slice(0, limit - 1).trimEnd()}…` : text
}

export { defaultJSXConverters }
