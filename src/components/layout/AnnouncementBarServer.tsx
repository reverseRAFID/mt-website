import { sanityFetch } from '@/sanity/lib/client'
import { ACTIVE_ANNOUNCEMENTS_QUERY } from '@/sanity/lib/queries'
import type { Announcement } from '@/sanity/lib/types'
import { AnnouncementBar } from './AnnouncementBar'

export async function AnnouncementBarServer() {
  const announcements = await sanityFetch<Announcement[]>(
    ACTIVE_ANNOUNCEMENTS_QUERY,
    {},
    30 // revalidate every 30s — announcements change frequently
  )

  return <AnnouncementBar announcements={announcements ?? []} />
}
