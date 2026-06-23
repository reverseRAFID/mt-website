# Mongol-Tori — Design System

> The complete frontend design language for the **BRACU Mongol-Tori** Mars-rover team website.
> This document is **self-contained**: an AI or designer with only this file should be able to reproduce the exact look and feel, either inside this repo (Next.js + Tailwind v4) or from scratch in any stack.

**Identity in one line:** a *mission-control HUD for a Mars-rover team* — precise, geometric, technical, and confident. **Dark-first**, a **single hot-orange accent** over restrained neutrals, **sharp 90° corners everywhere**, mono telemetry labels, faint technical grids, and restrained scroll-driven motion. It should feel like engineering software, not a marketing brochure.

---

## 0. How to use this with an AI

Paste the block below at the top of any prompt to an AI design/coding assistant. Then attach the rest of this file.

```text
You are designing/building UI in the "Mongol-Tori" design system — a mission-control HUD
aesthetic for a Mars-rover engineering team. Follow these rules exactly:

1. CORNERS ARE ALWAYS SHARP. Never use rounded corners. radius = 0. No pills, no rounded cards.
2. ONE ACCENT ONLY: hot orange (#ff6b1a in dark, #f05a00 in light). Never introduce a second
   accent hue. Orange = CTAs, active states, focus rings, data figures, hover borders. Use it
   sparingly so it stays loud.
3. DARK-FIRST. Default to the dark palette (near-black #0a0a0a / #050505 backgrounds). The system
   is theme-aware via CSS variables; every color must come from a token, never a raw hardcoded hex
   in components (except deliberate near-black hero backdrops).
4. THREE TYPEFACES, FIXED ROLES: Cabinet Grotesk (display/headings, bold 700–800),
   Satoshi (body & UI), JetBrains Mono (labels, telemetry, specs, numbers).
5. HUD LABELS: small eyebrow/kicker text is ALWAYS mono, UPPERCASE, with wide letter-spacing
   (0.22em), ~11px. Use them for section kickers, status readouts, indices.
6. STRUCTURE WITH 1px LINES, NOT SHADOWS. Thin borders/dividers define cards and sections.
   Depth comes from borders, faint grids, and soft orange glows — not drop shadows. The only
   shadows allowed are soft orange glow shadows on hover/featured surfaces.
7. TEXTURE: faint technical grid overlays, dotted fields, radial orange glow blobs, a moving
   scanline, dimmed oversized watermark text. All very low opacity (3–6%). Subtle, never busy.
8. MOTION IS RESTRAINED + PURPOSEFUL: scroll-reveal (fade + 24px rise), scroll-scrubbed parallax,
   number counters, word-by-word hero reveals. Elegant, never bouncy/playful. ALWAYS provide a
   prefers-reduced-motion fallback and never hide content with CSS-only (content must survive JS-off).
9. GENEROUS VERTICAL RHYTHM: sections breathe (py-20 → py-28). Content max-width ~80rem, centered.
10. VOICE: technical, precise, mission-framed (e.g. "Featured Rover", coordinates, "REC ●").
    No emoji. No exclamation-heavy marketing copy.
```

### Do / Don't

| ✅ DO | ❌ DON'T |
|---|---|
| Sharp 90° corners (`rounded-none` / radius 0) | Rounded or pill-shaped cards, buttons, inputs |
| One orange accent, used sparingly | Multiple accent colors, rainbow gradients |
| Thin 1px dividers/borders to define structure | Heavy/soft drop shadows for "elevation" |
| Solid flat orange buttons | Gradient-filled buttons or glossy effects |
| Mono UPPERCASE HUD labels for kickers | Title-case decorative script/serif eyebrows |
| Faint grid/glow/scanline texture (3–6% opacity) | Busy patterns, loud textures, photographic noise |
| Generous section padding, left-aligned lockups | Cramped spacing, everything center-aligned |
| Scroll-reveal + parallax with reduced-motion guards | Bouncy/elastic/playful motion, motion with no fallback |
| Tabular figures (`nums`) for stats/data | Proportional figures jittering in counters |
| Theme tokens for every color | Hardcoded hex in component markup |

---

# PART A — Portable design language

Everything in Part A is framework-agnostic. Hex codes, scales, and recipes work in plain CSS, React, Vue, or anything else.

## 1. Brand vibe & recurring motifs

The aesthetic is built from a small set of repeating motifs. Use them as a kit:

| Motif | What it is | Where it appears |
|---|---|---|
| **Single orange accent** | One hot orange against neutrals; the only color that "shouts" | CTAs, active nav, focus rings, data figures, hover borders |
| **Boxy geometry** | Zero border-radius everywhere; right angles | Every surface, button, input, image frame |
| **Technical grid** | Faint 1px line grid (48px or 28px) at ~4–6% opacity | Hero, section headers, card backdrops |
| **Corner brackets** | Small L-shaped ticks framing a surface (`CornerTicks`) | Cards, hero, stat boxes — mission-control framing |
| **Orange glow blob** | Large, very soft radial orange glow (blur 100–130px) | Behind heroes, section headers, featured cards |
| **Scanning sweep line** | A thin gradient line that travels top→bottom on a loop | Hero, page headers, scroll cues (CRT feel) |
| **Watermark text** | Oversized, very dim display text behind content | Hero ("MONGOL-TORI"), footer |
| **Mono telemetry readouts** | Coordinates / status with a blinking dot | Nav, hero, page headers ("● Dhaka, Bangladesh 23.7806° N…") |

## 2. Color system

A two-mode (light/dark) system. **Dark is the primary/default experience.** Every value is a token; components reference tokens, never raw hex. There is exactly **one accent** (orange) in both modes.

### Core palette

| Token | Role | Light | Dark |
|---|---|---|---|
| `bg` | Page background | `#ffffff` | `#0a0a0a` |
| `bg-deep` | Deepest background (recessed) | `#f4f4f5` | `#050505` |
| `surface` | Section / panel background | `#f7f7f7` | `#111111` |
| `surface-2` | Secondary surface (hover, insets) | `#f0f0f0` | `#1a1a1a` |
| `surface-offset` | Offset blocks | `#e8e8e8` | `#222222` |
| `surface-raised` | Cards / raised surfaces | `#ffffff` | `#161616` |
| `divider` | Primary 1px border / divider | `#d4d4d4` | `#2e2e2e` |
| `border` | Secondary border | `#cccccc` | `#383838` |
| `text` | Primary text | `#0a0a0a` | `#f0f0f0` |
| `text-muted` | Body / secondary text | `#4a4a4a` | `#a0a0a0` |
| `text-faint` | Tertiary / captions / disabled | `#9a9a9a` | `#555555` |
| `primary` | **The accent** (orange) | `#f05a00` | `#ff6b1a` |
| `primary-hover` | Accent hover | `#d44f00` | `#ff7d33` |
| `primary-active` | Accent pressed | `#b34200` | `#e55a00` |
| `primary-highlight` | Faint accent wash (backgrounds) | `#fde8d8` | `#2a1500` |
| `primary-rgb` | Accent as RGB triplet (for `rgba()`) | `240, 90, 0` | `255, 107, 26` |
| `on-accent` | Text/icon on top of orange | `#ffffff` | `#0a0a0a` |

### Overlay / effect tokens

| Token | Role | Light | Dark |
|---|---|---|---|
| `grid-line` | Technical grid line color | `rgba(10,10,10,0.05)` | `rgba(255,255,255,0.05)` |
| `glow` | Orange glow fill | `rgba(240,90,0,0.14)` | `rgba(255,107,26,0.16)` |
| `hairline` | Ultra-subtle border | `rgba(10,10,10,0.10)` | `rgba(255,255,255,0.10)` |
| `scrim` | Dark overlay for legibility | `rgba(0,0,0,0.5)` | `rgba(0,0,0,0.6)` |

### Color rules
- **`primary` is the only accent.** Use for CTAs, active nav, focus rings (`ring-primary`), data figures, hover borders (`primary/40`), and small status dots. Keep it rare so it reads as important.
- **`on-accent` flips by mode** (`#fff` in light, `#0a0a0a` in dark) — always use it for text/icons sitting on an orange fill.
- **Opacity steps** are used heavily for hierarchy: e.g. `primary/40` (hover borders), `primary/20`–`/30` (corner brackets), `text-white/15`–`/35` (hero overlays), watermark text at `0.025–0.045` opacity.
- **Three.js terrain colors** (hero centerpiece): fog/background `#050505`, wireframe mesh `#ff6b1a` at `0.55` opacity, transparent clear color.

## 3. Typography

Three families, each with a fixed job. Never substitute roles.

| Family | Role | Weights | CSS stack |
|---|---|---|---|
| **Cabinet Grotesk** | Display & all headings (`h1`–`h6`), big stat figures | 400, 500, **700**, **800** | `'Cabinet Grotesk', ui-sans-serif, system-ui, sans-serif` |
| **Satoshi** | Body copy, UI, buttons (default body font) | 400, 500, 700 | `'Satoshi', ui-sans-serif, system-ui, sans-serif` |
| **JetBrains Mono** | HUD labels, telemetry, specs, code, numbers | 400, 500 | `'JetBrains Mono', ui-monospace, monospace` |

Defaults: `body` = Satoshi; `h1`–`h6` = Cabinet Grotesk **700**; `code` / mono utility = JetBrains Mono.

### Type scale (responsive)

| Level | Size ramp | Style |
|---|---|---|
| **Hero H1** | `text-5xl sm:text-6xl lg:text-7xl xl:text-8xl` — or fluid `clamp(2.75rem, 11vw, 8.5rem)` | `font-display font-bold`, `leading-[0.95]` (down to `0.86`), `tracking-tight` / `tracking-[-0.03em]`, often `uppercase` |
| **Section H2** | `text-3xl sm:text-4xl lg:text-5xl` | `font-display font-bold`, `leading-[1.05]`, `tracking-tight`, `text-balance` |
| **Subsection H3** | `text-xl` → `text-2xl lg:text-3xl` | `font-display font-bold` |
| **Lead / tagline** | `text-base sm:text-lg` (up to `text-xl`) | `font-sans`, `leading-relaxed`, `text-text-muted`, `text-pretty` |
| **Body** | `text-base` / `text-sm` | `font-sans`, `leading-relaxed`, `text-text-muted` |
| **Caption / meta** | `text-xs` / `text-sm` | `text-text-faint` |
| **HUD label / kicker** | `~0.6875rem` (11px) | mono, `uppercase`, `letter-spacing: 0.22em`, weight 500 (the `hud-label` convention) |
| **Display figure** (stats) | `text-4xl lg:text-5xl` / up to `text-6xl` | Cabinet Grotesk **800**, `line-height: 0.9`, `letter-spacing: -0.03em`, `text-primary`, tabular `nums` |

### Typography rules
- **Headings are tight**: prefer `tracking-tight`; large display/watermarks use `tracking-tighter`.
- **Kickers/eyebrows are always the HUD label** (mono, uppercase, wide-tracked) — never a styled sans eyebrow.
- Use **`text-balance`** on headings and **`text-pretty`** on body/lead to avoid orphans.
- Stats and any tabular data use **tabular figures** (`font-variant-numeric: tabular-nums`).
- An optional **orange→text gradient** (`text-gradient-primary`) can highlight a word in a heading.

## 4. Spacing, layout & grid

- **Content container:** `max-width: 80rem` (1280px), centered (`margin-inline:auto`), responsive inline padding: **1rem** → **1.5rem** (≥640px) → **2rem** (≥1024px). (This is the `section-container` utility.)
- **Section rhythm:** standard vertical padding `py-20 lg:py-28`. Lighter sections `py-16`; medium `py-24`. Page heroes add top padding (`pt-28`/`pt-32`).
- **Horizontal padding** (when not using the container): `px-4 sm:px-6 lg:px-8`.
- **Gaps:** tight `gap-2`/`gap-3`, default card `gap-4`, looser `gap-6`/`gap-8`. **`gap-px`** is a signature trick — a 1px gap over a `divider`-colored background renders hairline grid lines between cells.
- **Inner text columns:** constrain with `max-w-2xl` / `max-w-3xl` (lead paragraphs), `max-w-md`/`max-w-xl` (cards/sidebars).

### Breakpoints (Tailwind defaults — no customs)

| Name | Min width | Typical use |
|---|---|---|
| `sm` | 640px | phone→tablet; `flex-col`→`flex-row`, type bumps |
| `md` | 768px | rare (occasional show/hide) |
| `lg` | 1024px | **primary desktop breakpoint** (layout shifts, type, padding) |
| `xl` | 1280px | large desktop (`xl:text-8xl`, wider reels) |
| `2xl` | 1536px | unused |

### Grids
- Adaptive card grids: `grid-cols-2 sm:grid-cols-3 lg:grid-cols-4` (stats/metrics), `grid-cols-3`, occasionally `xl:grid-cols-5`.
- Mobile stacks (`flex-col gap-4`) → desktop rows (`lg:flex-row lg:items-end lg:justify-between`).
- **Horizontal scroll reel** card widths: `w-[80vw] sm:w-[54vw] lg:w-[36vw] xl:w-[28vw]` with `gap-5`.

## 5. Shape, borders & elevation

- **Radius = 0, everywhere.** This is the single most defining trait. Cards, buttons, inputs, images, avatars — all sharp. (`--radius-card: 0` → the `rounded-card` utility equals `rounded-none`.) The only circles are `rounded-full` glow blobs, status dots, and a few badges.
- **Borders are structure.** 1px borders in `divider` (default), `border` (secondary), or `primary`/`primary/40` (accent/hover). Directional borders (`border-t`, `border-b`, `border-y`) separate sections.
- **Accent line:** a 3px solid orange `border-left` + `0.75rem` padding-left marks section kickers/headers (`accent-line`).
- **Elevation ≠ shadows.** Depth comes from borders + faint grids + soft orange glows. The only shadows are **soft orange glow shadows**, used on hover or featured surfaces:
  - Card hover: `shadow-[0_18px_40px_-24px_rgba(var(--primary-rgb),0.55)]`
  - Featured: `shadow-[0_24px_60px_-32px_rgba(var(--primary-rgb),0.6)]`
- **Hover affordances:** border tints to `primary/40`, and cards may lift `-translate-y-1` (featured `-translate-y-2`). Transitions are 150–300ms.

## 6. Texture & effects

A library of subtle background/foreground effects. All are low-opacity and theme-aware.

| Effect | Description | Spec |
|---|---|---|
| **tech-grid** | Square line grid backdrop | 48px cells, lines = `grid-line` token |
| **tech-grid-sm** | Tighter grid | 28px cells |
| **tech-dots** | Dotted field | 22px radial dots |
| **glow-orange** | Soft radial orange blob | `radial-gradient(circle, glow 0%, transparent 70%)`, usually blurred 100–130px |
| **horizon-glow** | Orange glow rising from bottom edge | `radial-gradient(120% 60% at 50% 100%, rgba(primary-rgb,0.22), transparent 60%)` |
| **text-gradient-primary** | Orange→text gradient on type | `linear-gradient(120deg, primary, primary-hover 55%, text)`, clipped to text |
| **scanlines** | Faint horizontal CRT lines overlay | `repeating-linear-gradient` w/ `rgba(primary-rgb,0.025)` |
| **mask-radial-fade** | Fades a layer out radially | `radial-gradient(ellipse 70% 60% at 50% 40%, #000 30%, transparent 80%)` mask |
| **vignette** | Inset darkening for hero consoles | `inset 0 0 180px 40px rgba(0,0,0,0.85)` box-shadow |
| **film grain** | Animated grain overlay | `mt-grain` keyframe (10-step translate) |
| **reticle cursor** | Custom targeting cursor (ring + dot) | fine-pointer only; native cursor hidden except on text inputs |

## 7. Motion system

**Libraries:** GSAP + `@gsap/react` (`useGSAP`), GSAP **ScrollTrigger**, **Lenis** smooth scroll, **Three.js** (hero terrain). **No framer-motion.** Motion is present but restrained — depth and choreography, never bounce.

### Easing & duration palette

| Purpose | Ease | Duration |
|---|---|---|
| Entrances (reveal, hero) | `power3.out` | 0.6–0.9s |
| Scroll-scrubbed parallax | `none` (linear, tied to scroll) | n/a (scrub) |
| Number counters | `power2.out` | 1.8s |
| Pointer responses (tilt, magnetic) | `power3.out` | 0.4–0.5s |
| Loading bar | `power1.inOut` | 1.5s |
| Wipes / dramatic exits | `power4.inOut` | 0.8s |
| Lenis scroll | custom `1.001 - 2^(-10t)` | `duration: 1.05` |

### Core patterns
- **Scroll reveal** (the workhorse, used on ~30+ sections): start `opacity:0, y:24` → `opacity:1, y:0`, `duration 0.8`, `ease power3.out`, `stagger 0.08`, `ScrollTrigger { start: 'top 85%', once: true }`. Optional `blur(6px)→blur(0)` focus-in.
- **Parallax layers:** `yPercent` scrubbed against scroll with `ease:'none'`; stack layers at different speeds for depth (e.g. grid 14%, glow 28%, watermark −40%).
- **Pinned horizontal reel:** desktop (≥1024px, fine pointer, motion OK) pins the section and scrubs translate (`scrub:1`, `anticipatePin:1`); touch/mobile **degrades to native `snap-x snap-mandatory`** scroll.
- **Word-by-word hero reveal:** title words rise from `yPercent:120` with `blur(6px)`, `duration 0.9`, `stagger 0.12`, using negative timeline offsets for overlap.
- **Number counters:** tally to value over `1.8s` `power2.out`, triggered at `top 88%`, once; final value is server-rendered (accessible / JS-off safe).
- **Magnetic hover** (`0.5s`, `power3.out`, ~0.35 strength) and **3D tilt** (`±6°`, `0.4s`, `power3.out`) on interactive elements, fine-pointer only.
- **Preloader boot sequence:** brand + status lines fade in, counter ramps to 100 (`1.5s power1.inOut`), then panel wipes up (`yPercent:-100`, `power4.inOut`); dispatches a `mt:booted` event to sync the hero entrance.
- **Text scramble:** decodes through mono glyphs (`!<>-_\/[]{}=+*^?#`), real text always in DOM.

### CSS keyframe utilities (looping ambient motion)

| Class | Keyframe | Timing |
|---|---|---|
| `animate-marquee` | translateX 0 → −50% | 40s linear infinite |
| `animate-pulse-glow` | opacity 0.5 ↔ 1 | 2.4s ease-in-out infinite |
| `animate-float` | translateY 0 → −8px | 6s ease-in-out infinite |
| `animate-blink` | opacity 1 → 0.25 | 1.1s steps(1) infinite (status dots) |
| `mt-scan` | translateY −100% → 100% | ~7–8s linear (scan sweep) |
| `pause-on-hover` | pauses animation on hover | — |

### Accessibility (non-negotiable)
- **Always** honor `prefers-reduced-motion`: globally, transitions/animations drop to 0ms; JS animations degrade to instant static states.
- **Never hide content with CSS alone.** Initial hidden states are set via JS (`gsap.set`) only, so content remains visible if JS fails.
- Theme color transitions are limited to color properties only (`background-color, border-color, color, fill, stroke`), 200ms — never transform/opacity globally.

## 8. Component recipes (portable)

Described in plain terms so they reproduce in any stack. (Exact Tailwind strings are in Part B §14.)

- **Primary button:** solid `primary` fill, `on-accent` text, ~`24px × 12px` padding, **sharp corners**, min-height 44px (touch), bold/semibold, flat (no shadow), hover → `primary-hover`, 150ms color transition. Often a trailing arrow icon.
- **Secondary button:** transparent/translucent with a 1px border; on dark backgrounds use `white/10` fill + `white/15` border; hover tints border + text to orange. Same size/shape as primary.
- **Card:** `surface-raised` background, 1px `divider` border, sharp corners, generous padding (`~28px`), optional `CornerTicks` at `primary/20`. Hover: border → `primary/40` (+ optional lift and orange glow shadow). No built-in drop shadow at rest.
- **Stat / metric card:** centered, `surface-raised` + `divider` border, big orange **display figure** (Cabinet Grotesk 800, tabular nums) over a mono `text-faint` label; hover brightens border + corner ticks.
- **Stat readout grid:** grid with `gap-px` over a `divider`-colored background → hairline dividers between cells; each cell `surface-raised`, hover → `surface-2`; often overlaid with `scanlines`.
- **HUD label / kicker:** mono, uppercase, `0.22em` tracking, ~11px; frequently paired with the `accent-line` left border or a small rotated diamond + a blinking orange status dot.
- **Badge / chip:** tiny (`~px-2.5 py-0.5`, `text-xs`), sharp corners; either solid orange + `on-accent`, or outline with a faint `primary-highlight` wash. Used for status (Published, Pre-print) and categories.
- **Navbar:** sticky, full-width; **transparent over the hero**, transitions to `bg/80` + `backdrop-blur-xl` + bottom `divider` border once scrolled. 64px tall. Links are muted, turn orange when active with an animated left-origin underline bar. A 1px orange scroll-progress bar sits at the bottom edge. Logo swaps for contrast (light over hero → dark when solid).
- **Hero (landing):** full-screen (`min-h-dvh`), near-black (`#050505`) backdrop, layered: faint 48px grid → 3D/WebGL or image centerpiece → `horizon-glow` at the bottom → large soft orange glow blob → oversized dim watermark text → `vignette` → a looping scan line → corner brackets. Foreground: HUD status line, badge, word-by-word title, lead, CTAs, then a stat row with counters. A floating "Scroll" cue at the bottom.
- **Footer:** `surface` background, top `divider` border; a sponsor marquee, a mono telemetry status row (blinking dot + coordinates), link columns, square social icon buttons (hover → orange + `primary-highlight` fill), and a giant dim watermark.

## 9. Imagery

- Use optimized images (`next/image` here) with `object-cover`; frames are sharp-cornered.
- **Full-bleed heroes** sit behind **3-layer legibility scrims**: bottom→top gradient (solid `bg` → ~10% transparent), right→left gradient (~85% `bg` → transparent), plus a `tech-grid` + `mask-radial-fade`. Media gets gentle parallax (drift + scale 1.12→1).
- **Hover zoom:** thumbnails scale to `1.05` on hover with a transform transition.
- **Avatars:** 1:1, sharp-cornered, 1px `divider` border, `surface-2` fallback; a person-glyph SVG fallback when no photo.
- **Blueprint fallback:** when a rover/image is missing, render a technical blueprint grid backdrop with a watermark label instead of an empty box.
- Treatment principle: dark scrims for legibility, orange-tinted glow blobs behind featured media, never light/airy photo collages.

---

# PART B — Implementation appendix (this stack)

This site: **Next.js (App Router)** + **Tailwind CSS v4 (CSS-first, no `tailwind.config.js`)** + **Sanity** CMS + **GSAP/Lenis/Three.js**. Theme via **`next-themes`** (class strategy). Icons are **custom inline SVGs** (no icon library).

## 10. Stack notes
- **Tailwind v4** is configured entirely in CSS (`@import "tailwindcss"` + `@theme`), via `@tailwindcss/postcss`. There is **no `tailwind.config.js`**.
- **Theme switching:** `next-themes` with `attribute="class"`, `defaultTheme="system"`, `enableSystem`. Dark mode = `.dark` class on `<html>`; light = absence of it.
- **Images:** Sanity pipeline `urlFor(img).width(w).height(h).url()` for responsive/hidpi sources.
- **Icons:** inline `<svg>` (`viewBox="0 0 24 24"`, `fill="none" stroke="currentColor" stroke-width="2"`), colored via `currentColor`.

## 11. Token wiring (paste verbatim into `globals.css`)

```css
@import "tailwindcss";

/* DESIGN TOKENS — LIGHT MODE */
:root {
  --bg: #ffffff;
  --bg-deep: #f4f4f5;
  --surface: #f7f7f7;
  --surface-2: #f0f0f0;
  --surface-offset: #e8e8e8;
  --surface-raised: #ffffff;
  --divider: #d4d4d4;
  --border: #cccccc;
  --text: #0a0a0a;
  --text-muted: #4a4a4a;
  --text-faint: #9a9a9a;
  --primary: #f05a00;
  --primary-hover: #d44f00;
  --primary-active: #b34200;
  --primary-highlight: #fde8d8;
  --primary-rgb: 240, 90, 0;
  --grid-line: rgba(10, 10, 10, 0.05);
  --glow: rgba(240, 90, 0, 0.14);
  --hairline: rgba(10, 10, 10, 0.10);
  --scrim: rgba(0, 0, 0, 0.5);
  --on-accent: #ffffff;
}

/* DESIGN TOKENS — DARK MODE */
.dark {
  --bg: #0a0a0a;
  --bg-deep: #050505;
  --surface: #111111;
  --surface-2: #1a1a1a;
  --surface-offset: #222222;
  --surface-raised: #161616;
  --divider: #2e2e2e;
  --border: #383838;
  --text: #f0f0f0;
  --text-muted: #a0a0a0;
  --text-faint: #555555;
  --primary: #ff6b1a;
  --primary-hover: #ff7d33;
  --primary-active: #e55a00;
  --primary-highlight: #2a1500;
  --primary-rgb: 255, 107, 26;
  --grid-line: rgba(255, 255, 255, 0.05);
  --glow: rgba(255, 107, 26, 0.16);
  --hairline: rgba(255, 255, 255, 0.10);
  --scrim: rgba(0, 0, 0, 0.6);
  --on-accent: #0a0a0a;
}

/* TAILWIND V4 REGISTRATION — inline = CSS vars resolved at runtime (theme-aware) */
@theme inline {
  --color-bg: var(--bg);
  --color-bg-deep: var(--bg-deep);
  --color-surface: var(--surface);
  --color-surface-2: var(--surface-2);
  --color-surface-offset: var(--surface-offset);
  --color-surface-raised: var(--surface-raised);
  --color-divider: var(--divider);
  --color-border: var(--border);
  --color-hairline: var(--hairline);
  --color-text: var(--text);
  --color-text-muted: var(--text-muted);
  --color-text-faint: var(--text-faint);
  --color-primary: var(--primary);
  --color-primary-hover: var(--primary-hover);
  --color-primary-active: var(--primary-active);
  --color-primary-highlight: var(--primary-highlight);
  --color-on-accent: var(--on-accent);

  --font-display: 'Cabinet Grotesk', ui-sans-serif, system-ui, sans-serif;
  --font-sans: 'Satoshi', ui-sans-serif, system-ui, sans-serif;
  --font-mono: 'JetBrains Mono', ui-monospace, monospace;

  --radius-card: 0; /* boxy / sharp 90° corners — mission-control HUD aesthetic */
}
```

**The CSS-var → Tailwind-utility bridge** (how tokens become classes):

| Token | Utilities you get |
|---|---|
| `--color-primary` | `bg-primary`, `text-primary`, `border-primary` (+ opacity: `bg-primary/10`, `border-primary/40`) |
| `--color-surface-raised` | `bg-surface-raised` |
| `--color-divider` | `border-divider`, `bg-divider` |
| `--color-text-muted` | `text-text-muted` |
| `--color-on-accent` | `text-on-accent` |
| `--radius-card` | `rounded-card` (= 0) |
| `--font-display` / `--font-sans` / `--font-mono` | `font-display` / `font-sans` / `font-mono` |

> Use `rgba(var(--primary-rgb), <a>)` inside arbitrary values for orange glows/shadows (e.g. `shadow-[0_18px_40px_-24px_rgba(var(--primary-rgb),0.55)]`).

## 12. Font setup

**JetBrains Mono** — loaded via `next/font/google` in `app/layout.tsx`:

```tsx
import { JetBrains_Mono } from 'next/font/google'

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-jetbrains',
  weight: ['400', '500'],
  display: 'swap',
})
// applied: <html className={jetbrainsMono.variable}>
```

**Cabinet Grotesk + Satoshi** — loaded from Fontshare via `<link>` in `<head>`:

```html
<link rel="preconnect" href="https://api.fontshare.com" />
<link
  href="https://api.fontshare.com/v2/css?f[]=cabinet-grotesk@400,500,700,800&f[]=satoshi@400,500,700&display=swap"
  rel="stylesheet"
/>
```

**Applied in `globals.css`:** `body` → Satoshi; `h1–h6` → Cabinet Grotesk weight 700; `code, pre, .font-mono` → JetBrains Mono. `::selection` uses `primary` bg + `on-accent` text.

## 13. Custom utility-class catalog

All defined in `globals.css` (`@layer utilities`). Reuse these instead of re-deriving.

| Class | What it does |
|---|---|
| `section-container` | `max-width:80rem; margin-inline:auto;` + responsive inline padding (1 / 1.5 / 2rem). Wrap every section's content. |
| `accent-line` | 3px orange `border-left` + `0.75rem` left padding. For kickers/headers. |
| `hud-label` | Mono, `0.6875rem`, `line-height:1`, `letter-spacing:0.22em`, uppercase, weight 500. The eyebrow/telemetry style. |
| `tech-grid` / `tech-grid-sm` | 48px / 28px line-grid background using `--grid-line`. |
| `tech-dots` | 22px dotted radial field. |
| `glow-orange` | Radial orange glow blob (`--glow` → transparent). |
| `horizon-glow` | Bottom-anchored orange radial glow. |
| `text-gradient-primary` | Orange→text clipped gradient for a heading word. |
| `mask-radial-fade` | Radial mask that fades a layer out toward edges. |
| `scanlines` | `::after` faint horizontal CRT lines. |
| `vignette` | Inset dark box-shadow for hero consoles. |
| `border-hairline` | Sets border-color to `--hairline`. |
| `nums` | Tabular figures (`tabular-nums`). |
| `display-figure` | Cabinet Grotesk 800, `line-height:0.9`, `letter-spacing:-0.03em`. Big stats. |
| `link-underline` | Animated left-to-right orange underline on hover (`0%→100%` over 0.3s). |
| `text-balance` / `text-pretty` | `text-wrap: balance` / `pretty`. |
| `animate-marquee` / `animate-pulse-glow` / `animate-float` / `animate-blink` | Looping ambient animations (see §7). |
| `pause-on-hover` | Pauses its animation on hover. |

## 14. Copy-paste component snippets (verified Tailwind strings)

**Primary button**
```html
<a class="inline-flex min-h-[44px] items-center gap-2 rounded-none bg-primary px-6 py-3 text-sm font-semibold text-on-accent transition-colors duration-150 hover:bg-primary-hover">
  Explore Our Rovers
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14M13 6l6 6-6 6"/></svg>
</a>
```

**Secondary button — neutral**
```html
<a class="inline-flex min-h-[44px] items-center gap-2 rounded-none border border-border bg-bg/40 px-6 py-3 text-sm font-semibold text-text-muted transition-colors hover:border-primary hover:text-primary">
  Learn more
</a>
```

**Secondary button — on a dark hero**
```html
<a class="inline-flex min-h-[44px] items-center gap-2 rounded-none border border-white/15 bg-white/10 px-6 py-3 text-sm font-semibold text-white transition-colors duration-150 hover:border-primary hover:bg-white/15">
  Join the Team
</a>
```

**Card (with hover lift + orange glow)**
```html
<article class="group relative flex flex-col rounded-card border border-divider bg-surface-raised p-7 transition-all duration-300 hover:border-primary/40 hover:-translate-y-1 hover:shadow-[0_18px_40px_-24px_rgba(var(--primary-rgb),0.55)]">
  <!-- optional: <CornerTicks className="text-primary/20" /> -->
  <!-- content -->
</article>
```

**Stat / metric figure**
```html
<div class="rounded-card border border-divider bg-surface-raised px-4 py-8 text-center transition-colors duration-300 hover:border-primary/40">
  <span class="display-figure nums block text-4xl text-primary lg:text-5xl">98%</span>
  <span class="hud-label mt-3 block text-text-faint">Uptime</span>
</div>
```

**Stat readout grid (hairline cells + scanlines)**
```html
<div class="scanlines relative grid gap-px overflow-hidden rounded-card border border-divider bg-divider sm:grid-cols-2 lg:grid-cols-3">
  <div class="bg-surface-raised px-5 py-6 transition-colors hover:bg-surface-2">
    <span class="hud-label text-text-faint">Mass</span>
    <span class="nums mt-2 block font-display text-2xl font-bold">48 kg</span>
  </div>
  <!-- more cells -->
</div>
```

**HUD label / kicker**
```html
<span class="hud-label text-primary">Featured Rover</span>

<!-- telemetry readout with blinking dot -->
<span class="hud-label text-text-faint">
  <span class="animate-blink text-primary">●</span>&nbsp; Dhaka, Bangladesh — 23.7806° N, 90.4074° E
</span>
```

**Navbar shell + animated underline link**
```html
<header class="sticky left-0 right-0 z-40 h-16 transition-[top,background-color,border-color] duration-300
               [&.scrolled]:border-b [&.scrolled]:border-divider [&.scrolled]:bg-bg/80 [&.scrolled]:backdrop-blur-xl
               border-b border-transparent bg-transparent">
  <a class="relative px-3 py-2 rounded-none text-sm font-semibold transition-colors duration-150 text-text-muted hover:text-text aria-[current=page]:text-primary">
    Rovers
    <span class="pointer-events-none absolute left-3 right-3 -bottom-px h-px origin-left scale-x-0 bg-primary transition-transform duration-300 group-aria-[current=page]:scale-x-100"></span>
  </a>
</header>
```

**Standard section template**
```html
<section class="relative border-y border-divider bg-surface py-20 lg:py-28">
  <div class="section-container">
    <p class="hud-label accent-line text-primary">02 — Capabilities</p>
    <h2 class="mt-4 max-w-3xl text-balance font-display text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">
      Section title goes here
    </h2>
    <p class="mt-4 max-w-2xl text-pretty leading-relaxed text-text-muted sm:text-lg">
      Supporting lead paragraph.
    </p>
    <!-- grid / cards -->
  </div>
</section>
```

## 15. Reusable building blocks (import, don't reinvent)

Located under `src/components/`:

| Component | Use |
|---|---|
| `motion/Reveal` | Scroll-triggered fade+rise (optional stagger/blur/parallax). The default entrance wrapper. |
| `motion/Counter` | Scroll-triggered number tally (server-renders final value). |
| `motion/HorizontalScroll` | Pinned desktop reel → mobile scroll-snap fallback. |
| `motion/Parallax` | Scroll-scrubbed y-drift for background/media layers. |
| `motion/Magnetic`, `motion/TiltCard` | Pointer-driven hover (fine-pointer only). |
| `ui/SectionHeader` | Kicker + title + description lockup (consistent section rhythm). |
| `ui/PageHero` | Inner-page header template (telemetry strip, grid, glow, watermark, word reveal). |
| `ui/CornerTicks` | Decorative mission-control corner brackets. |
| `ui/Marquee` | Looping logo/text strip. |
| `fx/SiteFx`, `fx/Preloader`, `fx/Cursor`, `fx/MarsTerrain`, `fx/SmoothScroll` | Global effects layer (boot, reticle cursor, 3D terrain, Lenis). |

---

# PART C — Cheat sheet

**The 10 rules:** sharp corners (radius 0) · one orange accent · dark-first · 3 fixed typefaces · mono uppercase HUD labels (0.22em) · structure with 1px lines, not shadows · faint grid/glow/scanline texture · restrained purposeful motion (with reduced-motion fallbacks) · generous rhythm (`py-20→28`, container 80rem) · technical, mission-framed voice (no emoji).

**Accent:** `#ff6b1a` (dark) / `#f05a00` (light). On-accent text: `#0a0a0a` (dark) / `#fff` (light).

**Backgrounds (dark):** page `#0a0a0a`, deep `#050505`, surface `#111111`, raised `#161616`, divider `#2e2e2e`.
**Backgrounds (light):** page `#ffffff`, surface `#f7f7f7`, raised `#ffffff`, divider `#d4d4d4`.

**Text (dark):** `#f0f0f0` / muted `#a0a0a0` / faint `#555555`. **(light):** `#0a0a0a` / `#4a4a4a` / `#9a9a9a`.

**Fonts:** Cabinet Grotesk (display/headings 700–800) · Satoshi (body/UI) · JetBrains Mono (labels/specs/numbers).

**Type:** H1 `clamp(2.75rem,11vw,8.5rem)` or `text-5xl→8xl` · H2 `text-3xl→5xl` · body `text-base→lg` · HUD label 11px mono uppercase 0.22em · stat `display-figure` (800, lh 0.9, −0.03em).

**Layout:** container 80rem; padding 1/1.5/2rem; section `py-20 lg:py-28`; breakpoints sm640/md768/lg1024/xl1280; `gap-px` for hairline grids.

**Motion easings:** entrance `power3.out` 0.8s + 24px rise + 0.08 stagger · scrub `none` · counter `power2.out` 1.8s · tilt/magnetic `power3.out` 0.4–0.5s · wipe `power4.inOut` 0.8s. Always honor `prefers-reduced-motion`.

**Shadows:** none at rest. Hover/featured only: `shadow-[0_18px_40px_-24px_rgba(var(--primary-rgb),0.55)]`.
