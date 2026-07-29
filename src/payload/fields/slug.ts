import type { Field } from 'payload'

/**
 * URL-safe slug from arbitrary text.
 *
 * Matches what Sanity's slug input produced, so slugs migrated from the old
 * dataset round-trip unchanged and every link already shared keeps working.
 */
export function slugify(input: unknown): string {
  return String(input ?? '')
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '') // strip combining accents
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 96)
}

/**
 * The `slug` field.
 *
 * Payload has no slug type, so this is the shared implementation: a unique,
 * indexed text field that fills itself in from `source` when left empty, and
 * normalises whatever an editor types by hand.
 *
 * `unique: true` is load-bearing. Every `/rovers/[slug]`-style page looks a
 * document up by slug and takes the first result; two documents sharing one
 * would make which page you get depend on collation order.
 */
export function slugField(source = 'title', overrides: Partial<Field> = {}): Field {
  return {
    name: 'slug',
    type: 'text',
    required: true,
    unique: true,
    index: true,
    admin: {
      position: 'sidebar',
      description:
        'The URL for this page. Generated from the name if left empty. Changing it breaks any link already shared.',
    },
    hooks: {
      beforeValidate: [
        ({ data, value }) => {
          const typed = typeof value === 'string' ? value.trim() : ''
          return slugify(typed || (data as Record<string, unknown> | undefined)?.[source])
        },
      ],
    },
    ...overrides,
  } as Field
}

/**
 * Provenance for documents brought over from Sanity.
 *
 * Hidden, but present on every migrated collection, because the migration
 * script has to be re-runnable: it matches on this to decide between "update
 * the document I already imported" and "import a second copy of everything".
 * Also the only way to answer "where did this row come from" a year from now.
 */
export const legacySanityId: Field = {
  name: 'legacySanityId',
  type: 'text',
  index: true,
  // Indexed but NOT unique. A unique index in MongoDB rejects a second null, so
  // marking this unique would mean only one document per collection could ever
  // be created by hand. The migration script enforces its own uniqueness.
  admin: { hidden: true, readOnly: true },
}
