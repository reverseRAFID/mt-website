import Link from 'next/link'
import { CornerTicks } from '@/components/ui/CornerTicks'
import { SUPPORTERS_HREF, socialProofLabel } from '@/lib/support-cta'

interface SupportTrustPanelProps {
  verificationHours: number
  supporterCount: number
  showSupporterCount: boolean
}

function Shield() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden className="mt-0.5 shrink-0 text-primary">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" />
    </svg>
  )
}
function Eye() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden className="mt-0.5 shrink-0 text-primary">
      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" />
      <circle cx="12" cy="12" r="3" />
      <path d="m3 3 18 18" />
    </svg>
  )
}
function Clock() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden className="mt-0.5 shrink-0 text-primary">
      <circle cx="12" cy="12" r="10" />
      <path d="M12 6v6l4 2" />
    </svg>
  )
}
function Users() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden className="mt-0.5 shrink-0 text-primary">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
    </svg>
  )
}

/**
 * Trust signals for the donation page.
 *
 * Hand-transferring money to a student club is a high-anxiety action: the donor
 * leaves the site, pays into a number they cannot verify, and gets no automatic
 * receipt. Each line here answers the specific doubt that stops someone at that
 * moment — is this a scam, will my amount be public, will anything happen after
 * I send it, has anyone else actually done this.
 */
export function SupportTrustPanel({
  verificationHours,
  supporterCount,
  showSupporterCount,
}: SupportTrustPanelProps) {
  const proof = showSupporterCount ? socialProofLabel(supporterCount) : null

  return (
    <div className="relative rounded-card border border-divider bg-surface p-6">
      <CornerTicks className="text-primary/20" />
      <p className="hud-label mb-5 text-text-muted">Before you send</p>

      <ul className="flex flex-col gap-4">
        <li className="flex gap-3">
          <Shield />
          <span className="text-sm leading-relaxed text-text-muted">
            <strong className="font-semibold text-text">We never ask for your PIN or OTP.</strong>{' '}
            You send the money yourself, from your own app. Nobody from Mongol-Tori will call you
            asking for a code — if someone does, it is not us.
          </span>
        </li>
        <li className="flex gap-3">
          <Eye />
          <span className="text-sm leading-relaxed text-text-muted">
            <strong className="font-semibold text-text">Your amount is never published.</strong>{' '}
            Not on the roll, not anywhere on this site. Only the team treasurer sees it. You can
            also choose to appear as Anonymous.
          </span>
        </li>
        <li className="flex gap-3">
          <Clock />
          <span className="text-sm leading-relaxed text-text-muted">
            <strong className="font-semibold text-text">A human checks every transfer</strong>{' '}
            against our statement, usually within {verificationHours} hours. If anything does not
            line up, we contact you rather than quietly dropping it.
          </span>
        </li>
        {proof && (
          <li className="flex gap-3">
            <Users />
            <span className="text-sm leading-relaxed text-text-muted">
              <strong className="font-semibold text-text">{proof}.</strong>{' '}
              <Link href={SUPPORTERS_HREF} className="link-underline text-primary">
                See the roll
              </Link>{' '}
              of everyone who has already backed the team.
            </span>
          </li>
        )}
      </ul>
    </div>
  )
}
