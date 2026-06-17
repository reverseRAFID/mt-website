# Mongol-Tori Redesign — Design System Contract

"Mission Control" aesthetic: restrained neutrals + a single hot **orange** accent,
mono "telemetry" labels, technical grids, hairline borders, corner crosshairs, and
GSAP motion. Clear tech vibe for a Mars-rover team. **Both light and dark must work.**

> The shell (Navbar, Footer, AnnouncementBar, PageLayout background, page-enter
> transition) is already redesigned. Do **not** rebuild it. Inner pages must keep
> using `<PageLayout>`. The home page composes the shell directly.

---

## Hard rules (do not break)

1. **Content & data are frozen.** Keep every Sanity field, prop, query, link, label,
   conditional, and `.map()` exactly as-is. You are restyling/restructuring **markup
   only** — never change data fetching, query shapes, types, or business logic.
2. Preserve `'use client'` / server-component boundaries. If a file is a server
   component and you need scroll animation, wrap blocks in `<Reveal>` (a client
   component) — do **not** add `'use client'` to a data-fetching page.
3. **Tokens only** for color. Use the Tailwind token classes below — never raw hex
   in components (exception: an intentionally dark hero band may use `#0a0a0a`-style
   values, mirroring the existing Hero). Everything must look right in **both themes**.
4. **Responsive, never breaks.** Mobile-first. No horizontal scroll at 375px. Test
   375 / 768 / 1024 / 1440. Touch targets ≥ 44px. Use `min-h-dvh` not `100vh`.
5. **Accessibility.** Keep/῍add `alt` text, `aria-label` on icon-only buttons, label
   inputs, visible focus. Don't convey meaning by color alone.
6. Keep imports valid and remove ones you stop using. Must pass `tsc --noEmit`.
7. Motion respects reduced-motion automatically **only** if you use the provided
   primitives (they guard internally). Don't hand-roll always-on animation.

---

## Color tokens (Tailwind classes)

Backgrounds: `bg-bg` (page), `bg-bg-deep`, `bg-surface`, `bg-surface-2`,
`bg-surface-offset`, `bg-surface-raised` (cards), `bg-primary`, `bg-primary-highlight`
(soft orange tint).
Text: `text-text`, `text-text-muted`, `text-text-faint`, `text-primary`,
`text-on-accent` (text on orange fills).
Borders: `border-divider` (default hairline), `border-border` (stronger),
`border-primary/40`.
Accent ramp: `bg-primary` → hover `bg-primary-hover`; `text-primary`.

The existing category/status color maps in NewsStrip / ResearchHighlights / Join
(blue/emerald/purple/amber with dark variants) are intentional — **keep them**.

## Typography

- Headings: `font-display` (Cabinet Grotesk), bold, `tracking-tight`, `text-balance`.
- Body: default `font-sans` (Satoshi). Body copy `text-text-muted leading-relaxed`.
- **Telemetry labels / kickers / data**: `font-mono` or the `.hud-label` utility
  (mono, uppercase, `0.22em` tracking, 11px). Use for section kickers, stat labels,
  spec keys, tags, timestamps. Add `.nums` for numeric readouts (tabular figures).
- Type scale for headings: hero `text-5xl→text-8xl`; section `text-3xl→text-5xl`;
  card titles `text-lg→text-xl`.

## Signature motifs (use tastefully — 1–2 per section)

- **Kicker lockup**: small rotated orange square + `.hud-label`, optionally a
  zero-padded index (`01 /`). Prefer the `<SectionHeader>` component.
- **Corner crosshairs** on feature cards / media frames: `<CornerTicks />` inside a
  `relative` box.
- **Technical grid / glow**: `.tech-grid`, `.tech-dots`, `.glow-orange`,
  `.mask-radial-fade` for section backdrops (PageLayout already covers inner pages;
  add locally only for hero-like bands).
- **Hairline + numbered** sections, mono timestamps, `.scanlines` overlay (sparingly).
- **Animated underline** links: `.link-underline`.

## Utilities available

`.hud-label`, `.tech-grid`, `.tech-grid-sm`, `.tech-dots`, `.glow-orange`,
`.mask-radial-fade`, `.text-gradient-primary`, `.link-underline`, `.scanlines`,
`.nums`, `.border-hairline`, `.text-balance`, `.text-pretty`, `.section-container`,
`.accent-line`. Animations: `.animate-marquee` (+`.pause-on-hover`),
`.animate-pulse-glow`, `.animate-float`, `.animate-blink`. Radius token: `rounded-card`.

---

## Motion primitives (import & use these — they handle reduced-motion)

```tsx
import { Reveal } from '@/components/motion/Reveal'
import { Counter } from '@/components/motion/Counter'
import { Magnetic } from '@/components/motion/Magnetic'
import { SectionHeader } from '@/components/ui/SectionHeader'
import { CornerTicks } from '@/components/ui/CornerTicks'
```

- `<Reveal>` — scroll-in fade+rise. Wrap a block, or stagger its children:
  ```tsx
  <Reveal>…single block rises in…</Reveal>
  <Reveal stagger className="grid gap-6 sm:grid-cols-3">{cards}</Reveal>  // children stagger
  <Reveal y={32} blur={6} delay={0.1}>…</Reveal>
  ```
  Props: `as`, `className`, `y`, `blur`, `delay`, `duration`, `stagger`(bool|number),
  `start`, `repeat`. Safe in **server components** (it's a client boundary that
  accepts server-rendered children). For a staggered grid, put the grid classes on
  `<Reveal stagger>` itself so its direct children are the cards.
- `<Counter to={70} suffix="+" />` — counts up in view. Use for stat numbers.
- `<Magnetic>` wraps a CTA for cursor-follow on desktop (decorative, optional).
- `<SectionHeader index="02" kicker="Featured Rover" title="…" description="…"
   action={<ViewAllLink/>} align="left|center" />`.
- `<CornerTicks className="text-primary/40" />` inside a `relative` card.

GSAP is registered in `@/lib/gsap` (`gsap`, `ScrollTrigger`, `prefersReducedMotion`,
`isFinePointer`) for bespoke animation in files already marked `'use client'`
(e.g. Hero). Always guard custom animation with `prefersReducedMotion()`.

---

## Component patterns (copy these classes for consistency)

**Section wrapper**
```tsx
<section className="relative py-20 lg:py-28">
  <div className="section-container"> … </div>
</section>
```
Alternate section backgrounds between `bg-bg` and `bg-surface` for rhythm (matches
existing pages). Inner pages already sit on the PageLayout backdrop.

**Card (default)**
```tsx
<div className="group relative rounded-card border border-divider bg-surface-raised p-6
                transition-all duration-300 hover:border-primary/40 hover:-translate-y-1
                hover:shadow-[0_18px_40px_-24px_rgba(var(--primary-rgb),0.55)]">
  …
</div>
```
Add `<CornerTicks className="text-primary/0 group-hover:text-primary/40 transition-colors" />`
for a hover crosshair reveal on feature cards.

**Primary button**
```tsx
className="inline-flex items-center gap-2 rounded-md bg-primary px-5 py-2.5 text-sm
           font-semibold text-on-accent transition-colors hover:bg-primary-hover"
```
**Secondary / ghost button**
```tsx
className="inline-flex items-center gap-2 rounded-md border border-border px-5 py-2.5
           text-sm font-semibold text-text-muted transition-colors
           hover:border-primary hover:text-primary"
```
Append a right-arrow svg (the `M5 12h14M12 5l7 7-7 7` path) on CTAs, as the codebase does.

**Chip / tag**
```tsx
className="inline-flex items-center rounded-full bg-primary-highlight px-2.5 py-0.5
           text-xs font-semibold text-primary"
```
**Spec / data tile**
```tsx
<div className="rounded-lg border border-divider bg-surface p-3">
  <div className="hud-label text-text-faint mb-1">Drive System</div>
  <div className="font-mono text-sm font-medium text-text nums">{value}</div>
</div>
```
**"View all" link**
```tsx
<Link className="group inline-flex items-center gap-1.5 text-sm font-semibold
                 text-text-muted hover:text-primary transition-colors">
  All papers
  <svg …arrow… className="transition-transform group-hover:translate-x-0.5" />
</Link>
```

**Page hero band** (inner pages, replaces the old `bg-surface border-b` header):
```tsx
<section className="relative overflow-hidden border-b border-divider py-16 lg:py-24">
  <div className="pointer-events-none absolute inset-0 tech-grid-sm mask-radial-fade opacity-60" />
  <div className="section-container relative">
    <SectionHeader kicker="Who We Are" title="About Us" description="…" />
  </div>
</section>
```

## Icons
SVG only (no emoji as structural icons). The Join page currently uses emoji for
sub-teams — replace each with an inline stroke SVG (Lucide-style, `stroke-width=1.5`,
24×24) that fits the topic. Keep stroke width consistent.

## Spacing & layout
- Vertical rhythm: sections `py-20 lg:py-28`; hero bands `py-16 lg:py-24`.
- Grid gaps `gap-6`; card padding `p-6`/`p-7`.
- Container is `.section-container` (max-w 80rem, responsive padding) — keep using it.
- Bento/feature grids welcome (`grid` + `sm:grid-cols-2 lg:grid-cols-3`, occasional
  `lg:col-span-2`/`row-span-2` for emphasis).

## Award-layer primitives (ELEVATION PASS — use these to lift pages)

The home + Team pages set the bar. Bring other pages up with these:

```tsx
import { PageHero } from '@/components/ui/PageHero'       // cinematic page header
import { Parallax } from '@/components/motion/Parallax'   // scroll-scrubbed depth
import { TiltCard } from '@/components/motion/TiltCard'   // pointer 3D tilt on cards
import { Marquee } from '@/components/ui/Marquee'         // kinetic text band
```

- **`<PageHero>`** — REPLACE each page's old flat "header band + SectionHeader" with this.
  It renders a kinetic word-by-word title reveal over a grid/glow backdrop + faded
  watermark + optional corner ticks + optional stat counter. Props:
  `index?`, `kicker`, `title` (string), `description?`, `stat?={value,suffix?,label}`,
  `watermark?` (big faded word), `children?` (e.g. filter chips / actions).
  Example:
  ```tsx
  <PageHero index="02" kicker="Fleet" title="Our Rovers"
    description="…" watermark="FLEET"
    stat={{ value: rovers.length, label: 'Built' }} />
  ```
  It's a client island; safe inside server pages. Map the page's existing
  kicker/title/description into it — content stays identical.
- **`<Parallax speed={0.15}>`** — wrap hero/detail/gallery media (put an over-sized
  child inside an `overflow-hidden` frame) for scroll depth. No-ops on reduced-motion.
- **`<TiltCard>`** — wrap grid cards (rovers, news, sponsors, sar-videos, gallery,
  members) for a subtle hover tilt. Fine-pointer only; never changes layout.
- **`<Marquee items={[…]} />`** — optional kinetic band between sections.
- Pair with `<Reveal stagger>` for entrance and `hover:-translate-y-1` + hover
  corner-tick reveal on cards. Add `<Counter>` for any stat figures.

Elevation rules: ADD these on top of the existing redesign; do NOT change content,
data, queries, links, `notFound`, `generateMetadata`, or PortableText. Keep
`<PageLayout>`. The `Reveal`/`Parallax`/`TiltCard`/`PageHero` primitives all guard
reduced-motion internally.

## Pre-delivery checklist (per file)
- [ ] Same content/links/data as before; nothing dropped.
- [ ] Looks correct in **light and dark** (tokens only).
- [ ] No horizontal scroll at 375px; works to 1440px.
- [ ] Uses `<Reveal>` for scroll-in; no unguarded animation.
- [ ] Icon-only controls have `aria-label`; images have `alt`.
- [ ] `tsc` clean; no unused imports; correct client/server boundary.
