import {
  BlockquoteFeature,
  BlocksFeature,
  BoldFeature,
  FixedToolbarFeature,
  HeadingFeature,
  HorizontalRuleFeature,
  InlineCodeFeature,
  InlineToolbarFeature,
  ItalicFeature,
  LinkFeature,
  OrderedListFeature,
  ParagraphFeature,
  UnorderedListFeature,
  UploadFeature,
  lexicalEditor,
} from '@payloadcms/richtext-lexical'

/**
 * Rich text, ported from the Portable Text configs.
 *
 * The feature list is written out rather than spread from `defaultFeatures`
 * on purpose. Sanity's block config was deliberately narrow — normal / h2 / h3
 * / quote, bold / italic / code, and links — because a body field that offers
 * h1, six list types, tables and coloured text is a body field that eventually
 * contains all of them, and the page design does not have a place for any of it.
 * Taking the defaults would have quietly widened that.
 */

/** Links, restricted to what the site can actually render. */
const link = LinkFeature({
  enabledCollections: [],
  fields: ({ defaultFields }) => [
    ...defaultFields.filter((f) => !('name' in f) || f.name !== 'rel'),
    {
      name: 'openInNewTab',
      type: 'checkbox',
      label: 'Open in a new tab',
      defaultValue: false,
    },
  ],
})

/** Shared base — everything except embeds. */
const baseFeatures = [
  ParagraphFeature(),
  HeadingFeature({ enabledHeadingSizes: ['h2', 'h3'] }),
  BoldFeature(),
  ItalicFeature(),
  InlineCodeFeature(),
  BlockquoteFeature(),
  UnorderedListFeature(),
  OrderedListFeature(),
  HorizontalRuleFeature(),
  link,
  FixedToolbarFeature(),
  InlineToolbarFeature(),
]

/**
 * Long-form body copy: news posts and the rover story.
 *
 * Adds inline images and the YouTube embed the old `youtube` Portable Text
 * object provided. The embed is a block rather than a bare URL because the
 * renderer needs to know it is an embed — a link to youtube.com in the middle
 * of a paragraph should stay a link.
 */
export const bodyEditor = lexicalEditor({
  features: [
    ...baseFeatures,
    UploadFeature({
      collections: {
        media: {
          fields: [
            {
              name: 'caption',
              type: 'text',
              admin: { description: 'Overrides the caption stored on the image itself.' },
            },
          ],
        },
      },
    }),
    BlocksFeature({
      blocks: [
        {
          slug: 'youtubeEmbed',
          labels: { singular: 'YouTube Embed', plural: 'YouTube Embeds' },
          fields: [
            {
              name: 'url',
              type: 'text',
              required: true,
              admin: { description: 'A full YouTube watch or youtu.be link.' },
            },
            {
              name: 'caption',
              type: 'text',
              admin: { description: 'Optional line under the player.' },
            },
          ],
        },
      ],
    }),
  ],
})

/**
 * Short-form copy: product descriptions.
 *
 * No images and no embeds — a product page has a dedicated gallery, and a photo
 * dropped into the description would sit outside it and break the layout.
 */
export const proseEditor = lexicalEditor({ features: baseFeatures })
