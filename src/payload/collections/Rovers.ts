import type { CollectionConfig } from 'payload'

import { anyone, staff } from '../access'
import { legacySanityId, slugField } from '../fields/slug'
import { SUBTEAM_OPTIONS } from '../fields/subteam'
import { revalidateCollection } from '../hooks/revalidate'

/**
 * A rover.
 *
 * The richest document in the project — /rovers/[slug] is a product-landing
 * page, and nearly every section on it is driven by one of the arrays below.
 * The Sanity field groups become tabs, in the same order, because that order is
 * how the team actually fills a rover in: identity first, then pictures, then
 * numbers, then the engineering story, then who built it.
 */
export const Rovers: CollectionConfig = {
  slug: 'rovers',
  admin: {
    group: 'Rovers & Competitions',
    useAsTitle: 'name',
    defaultColumns: ['name', 'year', 'isFlagship', 'tagline'],
    description: 'The fleet. Mark exactly one as the current flagship.',
  },
  access: { read: anyone, create: staff, update: staff, delete: staff },
  hooks: revalidateCollection('rovers'),
  defaultSort: '-year',
  fields: [
    slugField('name'),
    {
      type: 'tabs',
      tabs: [
        // ── Overview ──────────────────────────────────────────
        {
          label: 'Overview',
          fields: [
            {
              name: 'name',
              type: 'text',
              required: true,
              label: 'Rover Name',
              admin: { description: 'The codename, e.g. "Taurus", "Hypersonic".' },
            },
            {
              type: 'row',
              fields: [
                {
                  name: 'year',
                  type: 'number',
                  required: true,
                  min: 2000,
                  max: 2100,
                  admin: { width: '50%' },
                },
                {
                  name: 'isFlagship',
                  type: 'checkbox',
                  defaultValue: false,
                  label: 'Current Flagship',
                  admin: {
                    width: '50%',
                    description: 'The team’s current rover. Highlighted across the site.',
                  },
                },
              ],
            },
            {
              name: 'tagline',
              type: 'text',
              maxLength: 160,
              admin: {
                description:
                  'A short product-style line, e.g. "The rover that learned to think on Martian terrain."',
              },
            },
            {
              name: 'overview',
              type: 'textarea',
              admin: {
                description:
                  'Two to four sentences on this rover and what made the build notable. Shown in the hero.',
              },
            },
            {
              name: 'teamLead',
              type: 'text',
              admin: { description: 'Lead engineer for this build cycle.' },
            },
            {
              name: 'competition',
              type: 'relationship',
              relationTo: 'competitions',
              admin: { description: 'The competition this rover was built for, e.g. URC 2026.' },
            },
            {
              name: 'sarVideoUrl',
              type: 'text',
              label: 'SAR Video (YouTube URL)',
              admin: {
                description:
                  'System Acceptance Review video. Paste the full watch or youtu.be link — it is embedded on the page.',
              },
            },
          ],
        },

        // ── Media ─────────────────────────────────────────────
        {
          label: 'Media',
          fields: [
            {
              name: 'featuredImage',
              type: 'upload',
              relationTo: 'media',
              admin: {
                description:
                  'The hero shot. Falls back to the first gallery image when empty.',
              },
            },
            {
              name: 'gallery',
              type: 'upload',
              relationTo: 'media',
              hasMany: true,
              label: 'Photo Gallery',
              admin: {
                description:
                  'Captions live on the image itself now (Media → Caption), so fixing one fixes it everywhere it appears.',
              },
            },
            {
              name: 'diagrams',
              type: 'upload',
              relationTo: 'media',
              hasMany: true,
              label: 'Technical Diagrams',
            },
            {
              name: 'diagramAnnotations',
              type: 'array',
              label: 'Diagram Annotations',
              admin: {
                initCollapsed: true,
                description: 'Hotspots overlaid on the first diagram, positioned by percentage.',
              },
              fields: [
                { name: 'label', type: 'text', required: true },
                { name: 'description', type: 'textarea' },
                {
                  type: 'row',
                  fields: [
                    {
                      name: 'xPercent',
                      type: 'number',
                      required: true,
                      min: 0,
                      max: 100,
                      label: 'X Position (%)',
                      admin: { width: '50%' },
                    },
                    {
                      name: 'yPercent',
                      type: 'number',
                      required: true,
                      min: 0,
                      max: 100,
                      label: 'Y Position (%)',
                      admin: { width: '50%' },
                    },
                  ],
                },
              ],
            },
            {
              name: 'cadModel',
              type: 'upload',
              relationTo: 'documents',
              label: '3D Model (.glb)',
            },
            {
              name: 'technicalPdf',
              type: 'upload',
              relationTo: 'documents',
              label: 'Technical / SAR PDF',
            },
          ],
        },

        // ── Specs & tech ──────────────────────────────────────
        {
          label: 'Specs & Tech',
          fields: [
            {
              name: 'specs',
              type: 'group',
              label: 'Headline Specs',
              admin: { description: 'The structured specs shown on the fleet cards.' },
              fields: [
                { name: 'weight', type: 'text', admin: { placeholder: 'e.g. 45 kg' } },
                {
                  name: 'dimensions',
                  type: 'text',
                  admin: { placeholder: 'e.g. 120 × 90 × 60 cm' },
                },
                {
                  name: 'driveSystem',
                  type: 'text',
                  admin: { placeholder: 'e.g. 4-wheel rocker-bogie' },
                },
                { name: 'payload', type: 'text', admin: { placeholder: 'e.g. 5 kg' } },
                { name: 'dof', type: 'number', label: 'Arm DOF' },
                {
                  name: 'autonomy',
                  type: 'text',
                  admin: { placeholder: 'e.g. GNSS RTK + ZED 2i vision' },
                },
              ],
            },
            {
              name: 'keySpecs',
              type: 'array',
              label: 'Spec Readout',
              admin: {
                initCollapsed: true,
                description:
                  'Free-form telemetry for the detail page, e.g. "Comms Range" → "3.3 km NLoS".',
              },
              fields: [
                {
                  type: 'row',
                  fields: [
                    { name: 'label', type: 'text', required: true, admin: { width: '40%' } },
                    { name: 'value', type: 'text', required: true, admin: { width: '60%' } },
                  ],
                },
              ],
            },
            {
              name: 'namedComponents',
              type: 'text',
              hasMany: true,
              label: 'Tech Stack',
              admin: {
                description:
                  'Notable named hardware and software — "Jetson Orin", "ZED 2i", "ROS2 Humble", "YOLO11n".',
              },
            },
          ],
        },

        // ── Engineering ───────────────────────────────────────
        {
          label: 'Engineering',
          fields: [
            {
              name: 'keyInnovations',
              type: 'array',
              label: 'Key Innovations',
              admin: {
                initCollapsed: true,
                description: 'The headline breakthroughs. Drives the feature reel on the page.',
              },
              fields: [
                { name: 'title', type: 'text', required: true },
                { name: 'description', type: 'textarea', required: true },
              ],
            },
            {
              name: 'subsystems',
              type: 'array',
              admin: {
                initCollapsed: true,
                description:
                  'Mechanical, Controls & Software, Electronics, Network & Vision, Autonomy, Science. Each becomes a feature section.',
              },
              fields: [
                { name: 'name', type: 'text', required: true },
                {
                  name: 'subTeam',
                  type: 'select',
                  options: SUBTEAM_OPTIONS,
                  admin: { description: 'Colours the section accent and links it to a sub-team.' },
                },
                { name: 'summary', type: 'textarea', required: true },
                {
                  name: 'highlights',
                  type: 'text',
                  hasMany: true,
                  admin: { description: 'Concrete bullets — named parts, numbers, techniques.' },
                },
                { name: 'image', type: 'upload', relationTo: 'media' },
              ],
            },
            {
              name: 'missions',
              type: 'array',
              label: 'Mission Approaches',
              admin: {
                initCollapsed: true,
                description:
                  'How this rover tackles each competition mission — Delivery, Equipment Servicing, Autonomous Navigation, Science.',
              },
              fields: [
                { name: 'name', type: 'text', required: true, label: 'Mission' },
                { name: 'summary', type: 'textarea', required: true },
              ],
            },
          ],
        },

        // ── Crew ──────────────────────────────────────────────
        {
          label: 'Crew',
          fields: [
            {
              name: 'crew',
              type: 'array',
              admin: {
                initCollapsed: true,
                description:
                  'Who built this rover. Their sub-team drives the tab filter on the page.',
              },
              fields: [
                { name: 'member', type: 'relationship', relationTo: 'members', required: true },
                {
                  name: 'contribution',
                  type: 'text',
                  admin: {
                    description: 'What they worked on here, e.g. "Lead — manipulator & IK".',
                  },
                },
                {
                  name: 'subTeamOverride',
                  type: 'select',
                  options: SUBTEAM_OPTIONS,
                  label: 'Sub-Team (override)',
                  admin: {
                    description:
                      'Only if their contribution to THIS rover differs from their primary sub-team. Otherwise the member’s own sub-team is used.',
                  },
                },
              ],
            },
          ],
        },

        // ── Long-form ─────────────────────────────────────────
        {
          label: 'Long-form',
          fields: [
            {
              name: 'description',
              type: 'richText',
              label: 'Long-form Story',
            },
          ],
        },
      ],
    },
    legacySanityId,
  ],
}
