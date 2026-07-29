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
