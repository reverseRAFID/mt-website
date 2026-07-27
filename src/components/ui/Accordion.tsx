'use client'

import { useId, useState } from 'react'
import { cn } from '@/lib/utils'
import { CornerTicks } from '@/components/ui/CornerTicks'

export interface AccordionItem {
  question: string
  answer: string
}

/**
 * Accessible FAQ accordion. Smooth open/close via a CSS grid-rows trick
 * (0fr → 1fr), so there is no JS height measuring and reduced-motion users get
 * the global transition-off treatment automatically. Single-open behaviour;
 * the first item starts open. Keyboard- and screen-reader-friendly
 * (`aria-expanded` / `aria-controls` on a real `<button>`).
 */
export function Accordion({
  items,
  className,
}: {
  items: AccordionItem[]
  className?: string
}) {
  const [open, setOpen] = useState(0)
  const baseId = useId()

  return (
    <div className={cn('flex flex-col gap-3', className)}>
      {items.map((item, i) => {
        const isOpen = open === i
        const headingId = `${baseId}-h-${i}`
        const panelId = `${baseId}-p-${i}`
        return (
          <div
            key={item.question}
            className={cn(
              'group relative rounded-card border bg-surface-raised transition-colors duration-300',
              isOpen ? 'border-primary/40' : 'border-divider hover:border-primary/30'
            )}
          >
            <CornerTicks
              className={cn(
                'transition-colors',
                isOpen ? 'text-primary/40' : 'text-primary/0 group-hover:text-primary/30'
              )}
            />
            <h3>
              <button
                type="button"
                id={headingId}
                aria-expanded={isOpen}
                aria-controls={panelId}
                onClick={() => setOpen(isOpen ? -1 : i)}
                className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left sm:px-6 sm:py-5"
              >
                <span className="font-display text-base font-bold text-text sm:text-lg">
                  {item.question}
                </span>
                <span
                  aria-hidden
                  className={cn(
                    'flex h-8 w-8 shrink-0 items-center justify-center rounded-none border text-primary transition-all duration-300',
                    isOpen ? 'rotate-45 border-primary/40 bg-primary-highlight' : 'border-divider'
                  )}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 5v14M5 12h14" />
                  </svg>
                </span>
              </button>
            </h3>
            <div
              id={panelId}
              role="region"
              aria-labelledby={headingId}
              className={cn(
                'grid transition-[grid-template-rows] duration-300 ease-out',
                isOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
              )}
            >
              <div className="overflow-hidden">
                <p className="whitespace-pre-line px-5 pb-5 text-sm leading-relaxed text-text-muted text-pretty sm:px-6 sm:pb-6 sm:text-base">
                  {item.answer}
                </p>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
