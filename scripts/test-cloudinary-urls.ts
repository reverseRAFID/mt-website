/**
 * Cloudinary URL construction — pure-function checks, no account needed.
 *
 * These are boring assertions about string manipulation, which is exactly why
 * they are worth having: every one of them fails silently in production. A
 * transformation inserted after the version segment rather than before it
 * produces a URL Cloudinary answers with a 404, and nothing in a typecheck, a
 * build or a page render would notice.
 *
 *   npm run test:cloudinary
 */

import { cldParams, cldTransform, resourceTypeFor } from '../src/lib/cms/cloudinary-url'

let fail = 0
const eq = (name: string, got: unknown, want: unknown) => {
  const ok = got === want
  if (!ok) fail++
  console.log(`${ok ? '✓' : '✗'} ${name}`)
  if (!ok) console.log(`    got  ${got}\n    want ${want}`)
}

const CLD = 'https://res.cloudinary.com/demo/image/upload/mongol-tori/media/hero'
const CLD_V = 'https://res.cloudinary.com/demo/image/upload/v1712345678/mongol-tori/media/hero'

eq('resource type: jpg → image', resourceTypeFor('a.jpg'), 'image')
eq('resource type: pdf → raw', resourceTypeFor('report.pdf'), 'raw')
eq('resource type: glb → raw', resourceTypeFor('rover.glb'), 'raw')
eq('resource type: mp4 → video', resourceTypeFor('clip.mp4'), 'video')
eq('resource type: no extension → image', resourceTypeFor('noext'), 'image')

eq('params: width only limits', cldParams({ width: 800 }), 'f_auto,q_auto,w_800,c_limit')
eq('params: box crops with auto gravity', cldParams({ width: 1200, height: 630, crop: 'fill' }),
   'f_auto,q_auto,w_1200,h_630,c_fill,g_auto')
eq('params: explicit quality', cldParams({ width: 400, quality: 60 }), 'f_auto,q_60,w_400,c_limit')

eq('transform: inserted after /upload/',
   cldTransform(CLD, 'f_auto,w_800'),
   'https://res.cloudinary.com/demo/image/upload/f_auto,w_800/mongol-tori/media/hero')
eq('transform: goes BEFORE the version segment',
   cldTransform(CLD_V, 'f_auto,w_800'),
   'https://res.cloudinary.com/demo/image/upload/f_auto,w_800/v1712345678/mongol-tori/media/hero')
eq('transform: non-Cloudinary URL untouched',
   cldTransform('/logo.svg', 'f_auto,w_800'), '/logo.svg')
eq('transform: local Payload URL untouched',
   cldTransform('http://localhost:3000/payload-api/media/file/a.png', 'f_auto,w_800'),
   'http://localhost:3000/payload-api/media/file/a.png')
eq('transform: null in, null out', cldTransform(null, 'f_auto'), null)

console.log(fail === 0 ? '\nall cloudinary URL checks passed\n' : `\n${fail} FAILED\n`)
process.exit(fail ? 1 : 0)
