import type { FaqItem } from '@/sanity/lib/types'
import { GhostText } from '@/components/motion/GhostText'
import { SectionHeader } from '@/components/ui/SectionHeader'
import { Accordion } from '@/components/ui/Accordion'

export function SupportFaq({ items }: { items: FaqItem[] }) {
  if (items.length === 0) return null

  return (
    <section className="relative border-t border-divider py-20 lg:py-28">
      <GhostText text="ANSWERS" drift="left" outline />
      <div className="section-container relative">
        <SectionHeader
          index="04"
          kicker="Questions"
          title="What supporters ask"
          description="Mostly about privacy — so here it is in plain terms."
          className="mb-12"
        />
        <Accordion items={items} className="mx-auto max-w-3xl" />
      </div>
    </section>
  )
}
