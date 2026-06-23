# Rover seed

Seeds 8 rovers (2018–2026) + their URC competitions into Sanity, extracted and
fact-checked from the SAR PDFs in `rover_pdf/`.

## Run

1. Put a Sanity **Editor** token in `.env.local`:
   ```
   SANITY_API_TOKEN=sk...
   ```
   Create one at https://www.sanity.io/manage → API → Tokens.

2. Seed:
   ```bash
   node scripts/seed-rovers.mjs          # write everything
   node scripts/seed-rovers.mjs --dry    # preview docs → scripts/seed/preview.json (no token needed)
   node scripts/seed-rovers.mjs --no-images
   node scripts/seed-rovers.mjs --no-crew
   ```

Idempotent — documents use deterministic `_id`s (`rover.<slug>`,
`competition.urc.<year>`) and images de-dupe by content hash, so re-running just
updates in place.

## What it writes

- **Rovers**: name, tagline, overview, team lead, key specs, tech stack,
  key innovations, subsystems (with sub-team), mission approaches, and a curated
  featured image (+ small gallery for some years). `2026 Taurus` is the flagship.
- **Competitions**: `URC <year>` linked to each rover. Results/ranks are left
  blank — SAR docs are pre-competition, so add final placements in Sanity.
- **Crew**: existing team members are linked to the **flagship** rover as a
  starter roster so the sub-team tab filter is populated. Re-assign the real
  per-rover crew in Sanity → Rovers → Crew.

## Files

- `rovers.json` — extracted, fact-checked rover data (source of truth for the seed).
- `images/<slug>/` — curated featured/gallery images pulled from the SAR PDFs.

## Add later in Sanity (not in the PDFs)

- **SAR video** YouTube URL per rover.
- Higher-res photos / 3D `.glb` model / annotated diagrams.
- Real per-rover crew rosters.
