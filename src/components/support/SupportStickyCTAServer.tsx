import { SupportStickyCTA } from '@/components/support/SupportStickyCTA'
import { getSupportCtaData } from '@/lib/cms/donations'
import { urgencyLabel } from '@/lib/support-cta'

/**
 * Server wrapper for the floating support prompt.
 *
 * Keeps the campaign-state fetch on the server so the client island ships no
 * Sanity logic, and returns null outright when the campaign is not open — the
 * banner is then absent from the HTML entirely rather than hidden with CSS.
 */
export async function SupportStickyCTAServer() {
  const { isOpen, deadline } = await getSupportCtaData()
  if (!isOpen) return null
  return <SupportStickyCTA urgency={urgencyLabel(deadline)} />
}
