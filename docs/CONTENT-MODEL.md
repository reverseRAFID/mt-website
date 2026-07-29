# Content Model

Every content type, its fields, and how they relate. Collections live in
`src/payload/collections/` and globals in `src/payload/globals/` (both
registered in `payload.config.ts`). The functions that read them live in
`src/lib/cms/`, and the generated TypeScript shapes in `src/payload-types.ts`.

> Two names changed everywhere in the move from Sanity: a document's `_id` is
> now `id`, and `slug` is a plain string rather than `{ current }`. Array rows
> carry an `id` where Sanity had `_key` — that value is what an order stores as
> its `variantKey`.

For the editor-facing "how do I add content" guide, see [CONTENT-EDITING.md](CONTENT-EDITING.md).

---

## Types at a glance

| Type | Kind | Purpose |
|---|---|---|
| `announcement` | Document | Site-wide announcement bar messages (scheduled, prioritized) |
| `rover` | Document | A rover build — specs, 3D model, diagrams, gallery |
| `competition` | Document | A competition entry — roster, result, gallery, links |
| `member` | Document | Team member / alumni profile |
| `research` | Document | Research paper / publication |
| `post` | Document | News / blog article |
| `sponsor` | Document | Sponsor with tier + theme logos |
| `sarVideo` | Document | System Acceptance Review video (YouTube) |
| `recruitmentConfig` | **Singleton** | Recruitment status + FAQ (single doc, id `recruitment-config`) |

### Relationship map

```
competition ──rover──────────────▶ rover ──competition──▶ competition  (bidirectional ref)
competition ──teamMembers[].member▶ member
sarVideo    ──competition─────────▶ competition
research    ──authors[]───────────▶ member
post        ──author──────────────▶ member

member portfolio (computed in GROQ via references(^._id)):
   member ◀── competitions they appear in
   member ◀── research papers they authored
   member ◀── rovers (through their competitions)
```

`member` is the hub: a member's portfolio page (`team/[member-slug]`) reverse-looks-up every competition, paper, and rover they're linked to — no manual back-references needed.

---

## announcement
Drives the dismissible top-of-site announcement bar. Query `ACTIVE_ANNOUNCEMENTS_QUERY` returns only active items whose date window contains "now", ordered by `priority` ascending.

| Field | Type | Notes |
|---|---|---|
| `title` | string *(required)* | Internal label only (not shown) |
| `message` | text *(required, ≤160)* | The bar text |
| `link` | url | Optional CTA target |
| `linkLabel` | string | e.g. "Apply Now" |
| `startDate` / `endDate` | datetime | Optional scheduling window |
| `isActive` | boolean (default true) | Master on/off |
| `priority` | number (default 10) | Lower shows first |

---

## rover
| Field | Type | Notes |
|---|---|---|
| `name` | string *(required)* | |
| `slug` | slug *(required)* | from `name` → `rovers/[slug]` |
| `year` | number *(required, 2000–2100)* | |
| `tagline` | string | |
| `specs` | object | `weight`, `dimensions`, `driveSystem`, `payload`, `dof` (number), `autonomy` |
| `cadModel` | file (`.glb`) | 3D CAD model |
| `diagrams` | image[] | Technical diagrams (hotspot) |
| `diagramAnnotations` | object[] | Hotspots: `label`*, `description`, `xPercent`*, `yPercent`* (0–100) |
| `technicalPdf` | file (`.pdf`) | |
| `gallery` | image[] | Also feeds the aggregated `/gallery` page |
| `competition` | reference → competition | Which competition it ran in |
| `description` | Portable Text + images | Rich body |

Queried by `ROVERS_QUERY`, `ROVER_BY_SLUG_QUERY`, `FEATURED_ROVER_QUERY` (newest).

---

## competition
| Field | Type | Notes |
|---|---|---|
| `name` | string *(required)* | e.g. "University Rover Challenge" |
| `shortName` | string *(required)* | e.g. "URC" |
| `year` | number *(required)* | |
| `slug` | slug *(required)* | auto from `shortName-year` |
| `location` | string | |
| `result` | string | e.g. "11th Place" |
| `rank` | number | Final rank |
| `totalTeams` | number | |
| `teamMembers` | object[] (roster) | each: `member`* (ref → member) + `competitionRole` (Driver, Science Lead, Systems Integrator, Operator, Arm Operator, Autonomy Lead, Team Lead, Support) |
| `sarVideo` | url | YouTube URL |
| `rover` | reference → rover | |
| `gallery` | image[] | |
| `reportPdf` | file (`.pdf`) | Post-competition report |

Queried by `COMPETITIONS_QUERY`, `COMPETITION_BY_SLUG_QUERY`, `LATEST_COMPETITION_QUERY` (newest with a rank).

---

## member
| Field | Type | Notes |
|---|---|---|
| `name` | string *(required)* | |
| `slug` | slug *(required)* | from `name` → `team/[member-slug]` |
| `photo` | image | |
| `role` | string | e.g. "Team Lead, Software Engineer" |
| `subTeam` | string (enum) | management, controls, mechanical, electronics, science, uav, network, autonomous, rnd (values must match `SUBTEAM_COLORS` in `team/page.tsx`) |
| `yearOfStudy` | string | e.g. "3rd Year" |
| `graduationYear` | number | |
| `isAlumni` | boolean (default false) | |
| `currentOrg` | string | Alumni only |
| `skills` | string[] (tags) | |
| `personalProjects` | Portable Text + images | |
| `linkedin` / `github` | url | |
| `isActive` | boolean (default true) | |

Queried by `MEMBERS_QUERY` and `MEMBER_BY_SLUG_QUERY` (the latter computes competitions, papers, and rovers via reverse references).

---

## research
| Field | Type | Notes |
|---|---|---|
| `title` | string *(required)* | |
| `slug` | slug *(required)* | → `research/[slug]` |
| `authors` | reference[] → member | |
| `year` | number *(required)* | |
| `abstract` | text *(required)* | |
| `doi` | url | DOI / external link |
| `pdfFile` | file (`.pdf`) | |
| `topics` | string[] (tags) | |
| `status` | string (enum) | published, preprint, under-review |
| `conference` | string | e.g. "IEEE ICRAE 2024" |
| `citation` | text | Full citation string |

Queried by `RESEARCH_QUERY`, `RESEARCH_BY_SLUG_QUERY`.

---

## post (News / Blog)
| Field | Type | Notes |
|---|---|---|
| `title` | string *(required)* | |
| `slug` | slug *(required)* | → `news/[slug]` |
| `publishedAt` | datetime (defaults to now) | |
| `category` | string (enum) *(required)* | competition-update, rover-reveal, research-highlight, outreach, team-news |
| `featuredImage` | image | |
| `excerpt` | text *(required, ≤300)* | |
| `body` | Portable Text | blocks + images (with `caption`) + `youtube` embed objects |
| `author` | reference → member | |

Queried by `POSTS_QUERY`, `POST_BY_SLUG_QUERY`, `LATEST_POSTS_QUERY` (newest 3).

---

## sponsor
| Field | Type | Notes |
|---|---|---|
| `name` | string *(required)* | |
| `logoLight` | image | Logo for **light** theme (dark-mark on white) |
| `logoDark` | image | Logo for **dark** theme (light-mark on dark) |
| `logo` | image *(hidden)* | Legacy single-logo fallback |
| `website` | url | |
| `tier` | string (enum) *(required)* | title, gold, silver, bronze, in-kind |
| `isActive` | boolean (default true) | |
| `startYear` | number | |

Queried by `ACTIVE_SPONSORS_QUERY` (active only, ordered by tier). The site picks `logoLight`/`logoDark` per theme, falling back to `logo`.

---

## sarVideo
| Field | Type | Notes |
|---|---|---|
| `title` | string *(required)* | |
| `competition` | reference → competition *(required)* | |
| `year` | number *(required)* | |
| `youtubeUrl` | url *(required, https)* | |
| `thumbnail` | image | Optional custom thumb (else YouTube's) |
| `description` | text | |

Queried by `SAR_VIDEOS_QUERY`, `LATEST_SAR_VIDEO_QUERY`.

---

## recruitmentConfig (Singleton)
A Payload **global** — exactly one, structurally, rather than a convention about
document ids. Edited under Settings → Recruitment. Controls the recruitment
portal state.

| Field | Type | Notes |
|---|---|---|
| `status` | string (enum) *(required, default closed)* | open, under-review, closed |
| `openingMessage` | text | Shown on the Join page |
| `closingDate` | datetime | Application deadline |
| `faqItems` | object[] | each: `question`*, `answer`* |

Queried by `RECRUITMENT_CONFIG_QUERY`.

---

## Application submissions
Recruitment **applications** are documents in the `applications` collection,
written by `POST /api/apply`. They are private: `read: staff`, `create: nobody`,
and nothing on the public site reads them. (They used to live in a separate Neon
Postgres table; that is gone — one database now.)

The historical Postgres shape, for reference when reading old exports:

```sql
CREATE TABLE IF NOT EXISTS applications (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  student_id TEXT NOT NULL,
  department TEXT NOT NULL,
  year TEXT NOT NULL,
  subteam1 TEXT NOT NULL,
  subteam2 TEXT,
  why_join TEXT,
  experience TEXT,
  submitted_at TIMESTAMPTZ DEFAULT now()
);
```

`subteam1` is validated against: mechanical, electrical, software, science, drone, outreach, management.

---

## Aggregated `/gallery`
The gallery page has no schema of its own — `GALLERY_QUERY` aggregates the `gallery` arrays from all rovers that have images.
