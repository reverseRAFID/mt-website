// ============================================================
// Portable Text → Lexical.
//
// Sanity stored rich text as an array of blocks with `_type`, `style`, `marks`
// and `markDefs`. Payload stores Lexical's serialised editor state. This
// converts one to the other for the handful of shapes the old schemas actually
// allowed: paragraphs, h2/h3, blockquote, bullet and numbered lists, bold /
// italic / code, links, inline images, and the `youtube` embed object.
//
// Written by hand rather than routed through Markdown because Markdown has no
// representation for the image and embed objects — they would have been dropped
// silently, which is the worst possible outcome for a one-way migration.
//
// The `version` numbers are not decorative. Payload's renderer dispatches on
// them, and a node carrying the wrong one renders as nothing at all. They are
// taken from the node classes in @payloadcms/richtext-lexical.
// ============================================================

/** Lexical text-format bitmask. */
const FORMAT = { bold: 1, italic: 2, strikethrough: 4, underline: 8, code: 16 }

/** Sanity decorator name → Lexical format bit. */
const DECORATOR_BITS = {
  strong: FORMAT.bold,
  em: FORMAT.italic,
  code: FORMAT.code,
  underline: FORMAT.underline,
  'strike-through': FORMAT.strikethrough,
}

const EMPTY_ROOT = {
  root: {
    type: 'root',
    format: '',
    indent: 0,
    version: 1,
    direction: 'ltr',
    children: [],
  },
}

function textNode(text, format = 0) {
  return {
    type: 'text',
    detail: 0,
    format,
    mode: 'normal',
    style: '',
    text,
    version: 1,
  }
}

function paragraph(children) {
  return {
    type: 'paragraph',
    format: '',
    indent: 0,
    version: 1,
    direction: 'ltr',
    textFormat: 0,
    textStyle: '',
    children: children.length ? children : [textNode('')],
  }
}

/**
 * Turn one Portable Text span run into Lexical inline nodes.
 *
 * `markDefs` holds the annotations (links); `marks` on a span is a mix of
 * decorator names and markDef keys, which is why each mark has to be looked up
 * before it can be classified.
 */
function spansToInline(block) {
  const markDefs = new Map((block.markDefs ?? []).map((d) => [d._key, d]))
  const out = []

  for (const span of block.children ?? []) {
    if (span._type !== 'span' || typeof span.text !== 'string') continue

    let format = 0
    let link = null
    for (const mark of span.marks ?? []) {
      if (DECORATOR_BITS[mark]) {
        format |= DECORATOR_BITS[mark]
      } else if (markDefs.has(mark)) {
        const def = markDefs.get(mark)
        if (def._type === 'link' && def.href) link = def
      }
    }

    if (span.text === '') continue

    const node = textNode(span.text, format)

    if (link) {
      out.push({
        type: 'link',
        format: '',
        indent: 0,
        version: 3,
        direction: 'ltr',
        fields: {
          linkType: 'custom',
          url: link.href,
          newTab: link.openInNewTab === true,
        },
        children: [node],
      })
    } else {
      out.push(node)
    }
  }

  return out
}

function headingTag(style) {
  return style === 'h2' || style === 'h3' || style === 'h4' ? style : null
}

/**
 * Group consecutive list items into one Lexical list node.
 *
 * Portable Text marks each item individually with `listItem`; Lexical wants a
 * single list containing listitem children. Runs are broken by any block that
 * is not a list item of the same kind.
 */
function flushList(items, listType) {
  if (!items.length) return null
  return {
    type: 'list',
    format: '',
    indent: 0,
    version: 1,
    direction: 'ltr',
    listType,
    start: 1,
    tag: listType === 'number' ? 'ol' : 'ul',
    children: items.map((children, i) => ({
      type: 'listitem',
      format: '',
      indent: 0,
      version: 1,
      direction: 'ltr',
      value: i + 1,
      checked: undefined,
      children: children.length ? children : [textNode('')],
    })),
  }
}

/**
 * @param blocks       the Portable Text array
 * @param resolveAsset (sanityAssetRef) => payload media id, or null
 */
export function portableTextToLexical(blocks, resolveAsset = () => null) {
  if (!Array.isArray(blocks) || blocks.length === 0) return EMPTY_ROOT

  const children = []
  let listBuffer = []
  let listKind = null

  const flush = () => {
    const node = flushList(listBuffer, listKind)
    if (node) children.push(node)
    listBuffer = []
    listKind = null
  }

  for (const block of blocks) {
    if (!block || typeof block !== 'object') continue

    // ── Inline image ──────────────────────────────────────────
    if (block._type === 'image') {
      flush()
      const mediaId = resolveAsset(block.asset?._ref)
      if (mediaId) {
        children.push({
          type: 'upload',
          format: '',
          version: 3,
          relationTo: 'media',
          value: mediaId,
          fields: block.caption ? { caption: block.caption } : null,
        })
      }
      continue
    }

    // ── YouTube embed ─────────────────────────────────────────
    if (block._type === 'youtube') {
      flush()
      if (block.url) {
        children.push({
          type: 'block',
          format: '',
          version: 2,
          fields: {
            blockType: 'youtubeEmbed',
            url: block.url,
            caption: block.caption ?? undefined,
          },
        })
      }
      continue
    }

    if (block._type !== 'block') continue

    const inline = spansToInline(block)

    // ── List item ─────────────────────────────────────────────
    if (block.listItem) {
      const kind = block.listItem === 'number' ? 'number' : 'bullet'
      if (listKind && listKind !== kind) flush()
      listKind = kind
      listBuffer.push(inline)
      continue
    }

    flush()

    // ── Blockquote ────────────────────────────────────────────
    if (block.style === 'blockquote') {
      children.push({
        type: 'quote',
        format: '',
        indent: 0,
        version: 1,
        direction: 'ltr',
        children: inline.length ? inline : [textNode('')],
      })
      continue
    }

    // ── Heading ───────────────────────────────────────────────
    const tag = headingTag(block.style)
    if (tag) {
      children.push({
        type: 'heading',
        format: '',
        indent: 0,
        version: 1,
        direction: 'ltr',
        tag,
        children: inline.length ? inline : [textNode('')],
      })
      continue
    }

    // ── Paragraph ─────────────────────────────────────────────
    children.push(paragraph(inline))
  }

  flush()

  return {
    root: { ...EMPTY_ROOT.root, children: children.length ? children : [paragraph([])] },
  }
}

export { EMPTY_ROOT }
