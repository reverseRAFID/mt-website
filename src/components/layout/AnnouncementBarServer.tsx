import { getActiveAnnouncements } from '@/lib/cms/content'

import { AnnouncementBar } from './AnnouncementBar'

export async function AnnouncementBarServer() {
  // Uncached by design — the result depends on the current time, and a cached
  // "no announcements" would outlive the moment one was due to appear.
  const announcements = await getActiveAnnouncements()

  return <AnnouncementBar announcements={announcements} />
}
