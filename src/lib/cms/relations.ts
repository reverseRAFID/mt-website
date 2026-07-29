/**
 * Relationship resolution.
 *
 * A Payload relationship field is typed `string | Doc` — an id when the query
 * ran below the depth that would populate it, the document when it did not.
 * Components should not each invent their own way of narrowing that, and they
 * definitely should not assume it is populated: a query run at the wrong depth
 * would then throw at render time rather than degrading.
 *
 * `rel()` returns the document or null, so a component can decide what an
 * unpopulated relationship should look like — usually "do not render this row".
 */
export function rel<T extends object>(ref: string | number | T | null | undefined): T | null {
  return ref !== null && ref !== undefined && typeof ref === 'object' ? (ref as T) : null
}

/** The same for a hasMany relationship, dropping anything unpopulated. */
export function rels<T extends object>(
  refs: (string | number | T)[] | null | undefined
): T[] {
  return (refs ?? []).map((r) => rel<T>(r)).filter((r): r is T => r !== null)
}

/**
 * Author names off a research paper.
 *
 * GROQ projected this as a field — `"authorNames": authors[]->name` — so
 * components received a plain string[]. Payload returns the populated author
 * documents instead, so the projection happens here, in one place, rather than
 * in each of the three components that render a byline.
 *
 * Unpopulated authors are dropped rather than rendered as an id.
 */
export function authorNames(paper: {
  authors?: (string | number | { name?: string | null })[] | null
}): string[] {
  return rels<{ name?: string | null }>(paper.authors)
    .map((a) => a.name)
    .filter((n): n is string => Boolean(n))
}
