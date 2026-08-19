import { isShopPublic } from '@/lib/cms/shop'

import { Navbar } from './Navbar'

/**
 * Server wrapper for the site navigation.
 *
 * Exists for one reason: the Shop link and the cart button must not be in the
 * markup at all while the shop is disabled. The bar itself is a client island
 * — it tracks scroll, theme and the mobile menu — so the switch has to be read
 * here and handed down, the same shape as AnnouncementBarServer and
 * SupportStickyCTAServer.
 *
 * The read is cached and tag-busted on save, so putting it in front of every
 * page costs a cache lookup rather than a query.
 */
export async function NavbarServer() {
  const shopEnabled = await isShopPublic()

  return <Navbar shopEnabled={shopEnabled} />
}
