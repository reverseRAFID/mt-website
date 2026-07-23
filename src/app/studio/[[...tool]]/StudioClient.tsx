'use client'

import { NextStudio } from 'next-sanity/studio'
import config from '../../../../sanity.config'

export default function StudioClient() {
  // `.studio-reset` exempts the embedded Sanity admin UI from the site's
  // display-type rules (global uppercase headings); `contents` keeps it out
  // of layout so the Studio's full-height shell is unaffected.
  return (
    <div className="studio-reset contents">
      <NextStudio config={config} />
    </div>
  )
}
