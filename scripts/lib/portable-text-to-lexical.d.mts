/** Types for the hand-written Portable Text → Lexical converter. */
export declare function portableTextToLexical(
  blocks: unknown,
  resolveAsset?: (assetRef: string) => string | null
): { root: { type: string; children: unknown[]; [k: string]: unknown } }

export declare const EMPTY_ROOT: { root: { type: string; children: unknown[] } }
