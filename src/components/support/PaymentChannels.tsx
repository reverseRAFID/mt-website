import type { PaymentChannel } from '@/lib/cms/types'
import { CopyButton } from '@/components/ui/CopyButton'
import { CornerTicks } from '@/components/ui/CornerTicks'
import { Reveal } from '@/components/motion/Reveal'

/**
 * The receiving accounts a donor copies before paying.
 *
 * These numbers are public by design — they are the whole point of the page.
 * The security note is aimed the other way: we state plainly that nobody from
 * the team will ever ask for a PIN or OTP, because a page that hands out
 * wallet numbers is exactly the shape a phishing page takes, and donors should
 * have the counter-signal in front of them.
 */
export function PaymentChannels({ channels }: { channels: PaymentChannel[] }) {
  if (channels.length === 0) {
    return (
      <div className="rounded-card border border-dashed border-divider bg-surface p-6 text-center">
        <p className="hud-label mb-2 text-text-faint">No channels configured</p>
        <p className="text-sm text-text-muted">
          Payment details are being set up. Please check back shortly, or contact the team
          directly.
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-5">
      <Reveal stagger className="grid gap-4 sm:grid-cols-2">
        {channels.map((c) => (
          <div
            key={c.id}
            className="group relative flex flex-col gap-4 rounded-card border border-divider bg-surface-raised p-5 transition-colors hover:border-primary/40"
          >
            <CornerTicks className="text-primary/0 transition-colors group-hover:text-primary/30" />

            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="font-display text-lg font-bold text-text">{c.method}</h3>
                {c.accountName && (
                  <p className="mt-0.5 text-xs text-text-muted">{c.accountName}</p>
                )}
              </div>
              {c.accountType && (
                <span className="hud-label shrink-0 border border-divider px-2 py-1 text-text-muted">
                  {c.accountType}
                </span>
              )}
            </div>

            <div className="flex items-center justify-between gap-3 border-y border-divider/70 py-3">
              {/* select-all makes the number easy to grab by hand if the
                  clipboard API is unavailable. */}
              <span className="nums select-all font-mono text-base font-semibold tracking-wide text-text sm:text-lg">
                {c.accountNumber}
              </span>
              <CopyButton value={c.accountNumber} label={`Copy ${c.method} number`} />
            </div>

            {(c.bankName || c.branch || c.routingNumber) && (
              <dl className="grid gap-1.5 text-xs">
                {c.bankName && (
                  <div className="flex gap-2">
                    <dt className="hud-label w-20 shrink-0 text-text-faint">Bank</dt>
                    <dd className="text-text-muted">{c.bankName}</dd>
                  </div>
                )}
                {c.branch && (
                  <div className="flex gap-2">
                    <dt className="hud-label w-20 shrink-0 text-text-faint">Branch</dt>
                    <dd className="text-text-muted">{c.branch}</dd>
                  </div>
                )}
                {c.routingNumber && (
                  <div className="flex gap-2">
                    <dt className="hud-label w-20 shrink-0 text-text-faint">Routing</dt>
                    <dd className="nums text-text-muted">{c.routingNumber}</dd>
                  </div>
                )}
              </dl>
            )}

            {c.note && (
              <p className="flex items-start gap-2 text-xs leading-relaxed text-text-muted">
                <svg
                  aria-hidden
                  width="13"
                  height="13"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  className="mt-0.5 shrink-0 text-primary"
                >
                  <circle cx="12" cy="12" r="10" />
                  <path d="M12 16v-4M12 8h.01" />
                </svg>
                {c.note}
              </p>
            )}
          </div>
        ))}
      </Reveal>

      <p className="flex items-start gap-2.5 border border-divider bg-surface px-4 py-3 text-xs leading-relaxed text-text-muted">
        <svg
          aria-hidden
          width="15"
          height="15"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="mt-0.5 shrink-0 text-primary"
        >
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" />
        </svg>
        <span>
          <strong className="font-semibold text-text">We will never ask for your PIN or OTP.</strong>{' '}
          Send the money yourself from your own app, then come back and tell us about it below.
          Nobody from Mongol-Tori will call you asking for a code.
        </span>
      </p>
    </div>
  )
}
