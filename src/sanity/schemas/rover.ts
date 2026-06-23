import { defineField, defineType, defineArrayMember } from 'sanity'

const portableTextBlock = defineArrayMember({
  type: 'block',
  styles: [
    { title: 'Normal', value: 'normal' },
    { title: 'Heading 2', value: 'h2' },
    { title: 'Heading 3', value: 'h3' },
    { title: 'Quote', value: 'blockquote' },
  ],
  marks: {
    decorators: [
      { title: 'Bold', value: 'strong' },
      { title: 'Italic', value: 'em' },
      { title: 'Code', value: 'code' },
    ],
    annotations: [
      {
        name: 'link',
        type: 'object',
        title: 'Link',
        fields: [{ name: 'href', type: 'url', title: 'URL' }],
      },
    ],
  },
})

// Sub-team keys — kept in sync with src/lib/subteam-style.ts (SUBTEAM_COLORS).
// Used to colour subsystem sections and tag crew contributions.
const SUBTEAM_OPTIONS = [
  { title: 'Mechanical', value: 'mechanical' },
  { title: 'Controls & Software', value: 'controls' },
  { title: 'Electronics', value: 'electronics' },
  { title: 'Network & Vision', value: 'network' },
  { title: 'Autonomous', value: 'autonomous' },
  { title: 'Science', value: 'science' },
  { title: 'UAV', value: 'uav' },
  { title: 'Management', value: 'management' },
  { title: 'R&D', value: 'rnd' },
]

export const rover = defineType({
  name: 'rover',
  title: 'Rover',
  type: 'document',
  groups: [
    { name: 'overview', title: 'Overview', default: true },
    { name: 'media', title: 'Media' },
    { name: 'specs', title: 'Specs & Tech' },
    { name: 'engineering', title: 'Engineering' },
    { name: 'crew', title: 'Crew' },
    { name: 'story', title: 'Long-form' },
  ],
  fields: [
    // ── Overview ─────────────────────────────────────────────
    defineField({ name: 'name', title: 'Rover Name', type: 'string', group: 'overview', description: 'The rover codename, e.g. "Taurus", "Hypersonic".', validation: (R) => R.required() }),
    defineField({ name: 'slug', title: 'Slug', type: 'slug', options: { source: 'name' }, group: 'overview', validation: (R) => R.required() }),
    defineField({ name: 'year', title: 'Year', type: 'number', group: 'overview', validation: (R) => R.required().min(2000).max(2100) }),
    defineField({
      name: 'isFlagship',
      title: 'Current Flagship',
      type: 'boolean',
      initialValue: false,
      group: 'overview',
      description: 'Mark the team\'s current/most-recent rover. Used to highlight it across the site.',
    }),
    defineField({ name: 'tagline', title: 'Tagline', type: 'string', group: 'overview', description: 'A short product-style line, e.g. "The rover that learned to think on Martian terrain."', validation: (R) => R.max(160) }),
    defineField({
      name: 'overview',
      title: 'Overview',
      type: 'text',
      rows: 4,
      group: 'overview',
      description: 'Two to four sentences introducing this rover and what made the build notable. Shown in the hero.',
    }),
    defineField({ name: 'teamLead', title: 'Team Lead', type: 'string', group: 'overview', description: 'Lead engineer / team lead for this build cycle.' }),
    defineField({ name: 'competition', title: 'Competition', type: 'reference', to: [{ type: 'competition' }], group: 'overview', description: 'The competition this rover was built for (e.g. URC 2026).' }),
    defineField({
      name: 'sarVideoUrl',
      title: 'SAR Video (YouTube URL)',
      type: 'url',
      group: 'overview',
      description: 'System Acceptance Review video. Paste the full YouTube watch or youtu.be link — it is embedded on the page.',
      validation: (R) => R.uri({ scheme: ['http', 'https'] }),
    }),

    // ── Media ────────────────────────────────────────────────
    defineField({
      name: 'featuredImage',
      title: 'Featured Image',
      type: 'image',
      options: { hotspot: true },
      group: 'media',
      description: 'The hero / product shot of the rover. Falls back to the first gallery image if empty.',
      fields: [defineField({ name: 'caption', title: 'Caption', type: 'string' })],
    }),
    defineField({
      name: 'gallery',
      title: 'Photo Gallery',
      type: 'array',
      group: 'media',
      of: [
        defineArrayMember({
          type: 'image',
          options: { hotspot: true },
          fields: [defineField({ name: 'caption', title: 'Caption', type: 'string' })],
        }),
      ],
      options: { layout: 'grid' },
    }),
    defineField({
      name: 'diagrams',
      title: 'Technical Diagrams',
      type: 'array',
      group: 'media',
      of: [defineArrayMember({ type: 'image', options: { hotspot: true }, fields: [defineField({ name: 'caption', title: 'Caption', type: 'string' })] })],
    }),
    defineField({
      name: 'diagramAnnotations',
      title: 'Diagram Annotations',
      type: 'array',
      group: 'media',
      of: [
        defineArrayMember({
          type: 'object',
          name: 'annotation',
          fields: [
            defineField({ name: 'label', title: 'Label', type: 'string', validation: (R) => R.required() }),
            defineField({ name: 'description', title: 'Description', type: 'text', rows: 2 }),
            defineField({ name: 'xPercent', title: 'X Position (%)', type: 'number', validation: (R) => R.required().min(0).max(100) }),
            defineField({ name: 'yPercent', title: 'Y Position (%)', type: 'number', validation: (R) => R.required().min(0).max(100) }),
          ],
          preview: { select: { title: 'label', subtitle: 'description' } },
        }),
      ],
    }),
    defineField({ name: 'cadModel', title: '3D Model (.glb)', type: 'file', options: { accept: '.glb' }, group: 'media' }),
    defineField({ name: 'technicalPdf', title: 'Technical / SAR PDF', type: 'file', options: { accept: '.pdf' }, group: 'media' }),

    // ── Specs & Tech ─────────────────────────────────────────
    defineField({
      name: 'specs',
      title: 'Headline Specs',
      type: 'object',
      group: 'specs',
      description: 'Structured specs shown on the fleet cards.',
      fields: [
        defineField({ name: 'weight', title: 'Weight', type: 'string', placeholder: 'e.g. 45 kg' }),
        defineField({ name: 'dimensions', title: 'Dimensions', type: 'string', placeholder: 'e.g. 120 × 90 × 60 cm' }),
        defineField({ name: 'driveSystem', title: 'Drive System', type: 'string', placeholder: 'e.g. 4-wheel rocker-bogie' }),
        defineField({ name: 'payload', title: 'Payload', type: 'string', placeholder: 'e.g. 5 kg' }),
        defineField({ name: 'dof', title: 'Arm DOF', type: 'number' }),
        defineField({ name: 'autonomy', title: 'Autonomy', type: 'string', placeholder: 'e.g. GNSS RTK + ZED 2i vision' }),
      ],
    }),
    defineField({
      name: 'keySpecs',
      title: 'Spec Readout',
      type: 'array',
      group: 'specs',
      description: 'Flexible label/value telemetry shown in the spec readout on the detail page. e.g. "Comms Range" → "3.3 km NLoS".',
      of: [
        defineArrayMember({
          type: 'object',
          name: 'spec',
          fields: [
            defineField({ name: 'label', title: 'Label', type: 'string', validation: (R) => R.required() }),
            defineField({ name: 'value', title: 'Value', type: 'string', validation: (R) => R.required() }),
          ],
          preview: { select: { title: 'label', subtitle: 'value' } },
        }),
      ],
    }),
    defineField({
      name: 'namedComponents',
      title: 'Tech Stack',
      type: 'array',
      group: 'specs',
      of: [defineArrayMember({ type: 'string' })],
      options: { layout: 'tags' },
      description: 'Notable named hardware/software, e.g. "Jetson Orin", "ZED 2i", "ROS2 Humble", "YOLO11n".',
    }),

    // ── Engineering ──────────────────────────────────────────
    defineField({
      name: 'keyInnovations',
      title: 'Key Innovations',
      type: 'array',
      group: 'engineering',
      description: 'The headline breakthroughs that define this build. Drives the feature reel on the page.',
      of: [
        defineArrayMember({
          type: 'object',
          name: 'innovation',
          fields: [
            defineField({ name: 'title', title: 'Title', type: 'string', validation: (R) => R.required() }),
            defineField({ name: 'description', title: 'Description', type: 'text', rows: 2, validation: (R) => R.required() }),
          ],
          preview: { select: { title: 'title', subtitle: 'description' } },
        }),
      ],
    }),
    defineField({
      name: 'subsystems',
      title: 'Subsystems',
      type: 'array',
      group: 'engineering',
      description: 'The engineering subsystems — Mechanical, Controls & Software, Electronics, Network & Vision, Autonomy, Science. Each becomes a feature section.',
      of: [
        defineArrayMember({
          type: 'object',
          name: 'subsystem',
          fields: [
            defineField({ name: 'name', title: 'Name', type: 'string', validation: (R) => R.required() }),
            defineField({ name: 'subTeam', title: 'Sub-Team', type: 'string', options: { list: SUBTEAM_OPTIONS }, description: 'Colours the section accent and links it to a sub-team.' }),
            defineField({ name: 'summary', title: 'Summary', type: 'text', rows: 4, validation: (R) => R.required() }),
            defineField({
              name: 'highlights',
              title: 'Highlights',
              type: 'array',
              of: [defineArrayMember({ type: 'string' })],
              description: 'Concrete bullet points — named parts, numbers, techniques.',
            }),
            defineField({ name: 'image', title: 'Image', type: 'image', options: { hotspot: true }, description: 'Optional subsystem photo/diagram.' }),
          ],
          preview: { select: { title: 'name', subtitle: 'summary' } },
        }),
      ],
    }),
    defineField({
      name: 'missions',
      title: 'Mission Approaches',
      type: 'array',
      group: 'engineering',
      description: 'How this rover tackles each competition mission (Delivery, Equipment Servicing, Autonomous Navigation, Science).',
      of: [
        defineArrayMember({
          type: 'object',
          name: 'mission',
          fields: [
            defineField({ name: 'name', title: 'Mission', type: 'string', validation: (R) => R.required() }),
            defineField({ name: 'summary', title: 'Summary', type: 'text', rows: 3, validation: (R) => R.required() }),
          ],
          preview: { select: { title: 'name', subtitle: 'summary' } },
        }),
      ],
    }),

    // ── Crew ─────────────────────────────────────────────────
    defineField({
      name: 'crew',
      title: 'Crew',
      type: 'array',
      group: 'crew',
      description: 'The members who built this rover. Their sub-team drives the tab filter on the page.',
      of: [
        defineArrayMember({
          type: 'object',
          name: 'crewMember',
          fields: [
            defineField({ name: 'member', title: 'Member', type: 'reference', to: [{ type: 'member' }], validation: (R) => R.required() }),
            defineField({ name: 'contribution', title: 'Contribution', type: 'string', description: 'What they worked on for this rover, e.g. "Lead — manipulator & IK".' }),
            defineField({
              name: 'subTeamOverride',
              title: 'Sub-Team (override)',
              type: 'string',
              options: { list: SUBTEAM_OPTIONS },
              description: 'Only set if their contribution to THIS rover differs from their primary sub-team. Otherwise the member\'s own sub-team is used.',
            }),
          ],
          preview: {
            select: { title: 'member.name', subtitle: 'contribution', media: 'member.photo' },
          },
        }),
      ],
    }),

    // ── Long-form ────────────────────────────────────────────
    defineField({
      name: 'description',
      title: 'Long-form Story',
      type: 'array',
      group: 'story',
      of: [portableTextBlock, defineArrayMember({ type: 'image', options: { hotspot: true } })],
    }),
  ],
  preview: {
    select: { title: 'name', subtitle: 'year', media: 'featuredImage', flagship: 'isFlagship' },
    prepare({ title, subtitle, media, flagship }) {
      return { title: flagship ? `${title} ★` : title, subtitle: String(subtitle), media }
    },
  },
  orderings: [{ title: 'Year (newest)', name: 'yearDesc', by: [{ field: 'year', direction: 'desc' }] }],
})
