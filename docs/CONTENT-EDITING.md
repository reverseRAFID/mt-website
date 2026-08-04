# Content Editing Guide

For team members who manage the website content — **no coding required.**
You edit everything through the admin, which is part of the website itself.

For the technical field reference, see [CONTENT-MODEL.md](CONTENT-MODEL.md).

---

## Opening the admin

Go to **/admin** on the site:

- Production: https://mt-website-liart.vercel.app/admin
- Local dev: http://localhost:3000/admin

Sign in with your own account. If you do not have one, ask a team lead — they
create accounts under **Settings → Users**. There is no third-party service to
be invited to any more; the accounts live in the site's own database.

Two roles:

- **Editor** — content, plus the order and donation queues. This is what most
  people need.
- **Admin** — everything an editor can do, plus creating users.

---

## How publishing works

- **Save** makes a change live. There is no separate publish step and no draft
  state: what you save is what the site shows.
- The change appears **immediately** — the site clears its cache for that
  collection the moment you save. No waiting, no redeploy.
- Because there is no draft, do not save a half-written post. Write it
  somewhere else and paste it in when it is ready.

---

## The content sections

The left sidebar groups everything:

| Section | What goes here |
|---|---|
| 📢 **Announcements** | The bar at the top of every page |
| 🤖 **Rovers** | Each rover build, with specs, photos, 3D model, diagrams |
| 🏆 **Competitions** | Each competition: result, roster, gallery |
| 👤 **Team Members** | Member & alumni profiles |
| 📄 **Research Papers** | Publications |
| 📰 **News & Blog** | Articles / updates |
| 💼 **Sponsors** | Sponsor logos by tier |
| 🎥 **SAR Videos** | System Acceptance Review videos |
| ⚙️ **Recruitment Config** | Turns the application portal on/off |

To add something: click the section → the **pencil/＋** to create → fill fields → **Publish**.

---

## Common how-tos

### Post an announcement (the top bar)
1. **Announcements → ＋**.
2. Fill **Message** (≤160 chars). Optionally add a **Link** + **Link Label** (e.g. "Apply Now").
3. To schedule it, set **Start/End Date**. Leave blank to show immediately/forever.
4. **Priority**: lower number shows first when multiple are active.
5. Keep **Active** on → **Publish**. Toggle **Active** off to retire it.

### Open or close recruitment
1. **Recruitment Config** (there's only one — you edit it, you don't create new ones).
2. Set **Status**: 🟢 Open / 🟡 Under Review / 🔴 Closed.
3. Add an **Opening/Closing Message** and a **Deadline** if open.
4. Add/edit **FAQ Items** → **Publish**.

> Applications submitted through the form are stored in the team's database, not in
> the admin. Ask a developer to export them.

### Add a team member
1. **Team Members → ＋**.
2. Add **Name**, **Photo**, **Role**, **Sub-Team**, year, socials.
3. For alumni: toggle **Is Alumni** and fill **Current Organization**.
4. **Publish**. Their portfolio page (`/team/<name>`) auto-builds and will list any
   competitions, papers, and rovers they're linked to.

### Add a competition
1. **Competitions → ＋**: Name, Short Name (e.g. URC), Year, Location, Result, Rank.
2. **Roster:** add each member (pick from Team Members) and their role.
3. Link the **Rover** used, add the **SAR Video** URL, **Gallery**, and **Report PDF**.
4. **Publish.**

### Add a rover
1. **Rovers → ＋**: Name, Year, Tagline.
2. Fill **Specifications** (weight, drive system, arm DOF, etc.).
3. Upload the **3D model** (`.glb`), **diagrams**, **technical PDF**, and **gallery** photos.
4. Link the **Competition** it ran in → **Publish**. Gallery photos also feed the site's `/gallery`.

### Write a news post
1. **News & Blog → ＋**: Title, **Category**, Featured Image, **Excerpt** (≤300 chars).
2. Write the **Body** — rich text, images (with captions), and YouTube embeds are supported.
3. Pick an **Author** (a Team Member) → **Publish**.

### Add a sponsor
1. **Sponsors → ＋**: Company Name, **Tier** (Title/Gold/Silver/Bronze/In-Kind), Website.
2. Upload **both** logos: **Logo for Light Theme** (dark mark) and **Logo for Dark Theme** (light mark) so it looks right in both modes.
3. Keep **Active** on → **Publish**.

---

## Tips

- **Slugs** auto-generate from the title/name — leave them unless you have a reason to change them (changing a slug changes that page's URL).
- **Images:** after uploading, drag the crop/hotspot to set the focal point.
- **Required fields** are marked; you can't publish without them.
- **Unpublish vs delete:** to hide something temporarily, toggle its **Active** flag (announcements, sponsors, members) rather than deleting — deletion is permanent.
- Changes not showing on the site? Wait ~1 minute (cache), then hard-refresh. Confirm you clicked **Publish**, not just saved a draft.
