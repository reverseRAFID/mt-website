import { defineConfig } from 'sanity'
import { structureTool } from 'sanity/structure'
import { schemaTypes } from './src/sanity/schemas'

export default defineConfig({
  basePath: '/studio',
  name: 'mongol-tori',
  title: 'BRACU Mongol-Tori CMS',

  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID ?? 'replace-with-your-project-id',
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET ?? 'production',

  plugins: [
    structureTool({
      structure: (S) =>
        S.list()
          .title('Content')
          .items([
            S.listItem()
              .title('Announcements')
              .icon(() => '📢')
              .child(S.documentTypeList('announcement').title('Announcements')),
            S.divider(),
            S.listItem()
              .title('Rovers')
              .icon(() => '🤖')
              .child(S.documentTypeList('rover').title('Rovers')),
            S.listItem()
              .title('Competitions')
              .icon(() => '🏆')
              .child(S.documentTypeList('competition').title('Competitions')),
            S.divider(),
            S.listItem()
              .title('Team Members')
              .icon(() => '👤')
              .child(S.documentTypeList('member').title('Team Members')),
            S.listItem()
              .title('Advisor Testimonials')
              .icon(() => '💬')
              .child(
                S.documentTypeList('testimonial')
                  .title('Advisor Testimonials')
                  .defaultOrdering([{ field: 'order', direction: 'asc' }])
              ),
            S.listItem()
              .title('Research Papers')
              .icon(() => '📄')
              .child(S.documentTypeList('research').title('Research Papers')),
            S.listItem()
              .title('News & Blog')
              .icon(() => '📰')
              .child(S.documentTypeList('post').title('Posts')),
            S.divider(),
            S.listItem()
              .title('Sponsors')
              .icon(() => '💼')
              .child(S.documentTypeList('sponsor').title('Sponsors')),
            S.listItem()
              .title('SAR Videos')
              .icon(() => '🎥')
              .child(S.documentTypeList('sarVideo').title('SAR Videos')),
            S.divider(),
            // Recruitment
            S.listItem()
              .title('Applications')
              .icon(() => '📥')
              .child(
                S.documentTypeList('application')
                  .title('Applications')
                  .defaultOrdering([{ field: 'submittedAt', direction: 'desc' }])
              ),
            // Singleton document
            S.listItem()
              .title('Recruitment Config')
              .icon(() => '⚙️')
              .child(
                S.document()
                  .documentId('recruitment-config')
                  .schemaType('recruitmentConfig')
                  .title('Recruitment Configuration')
              ),
          ]),
    }),
  ],

  schema: {
    types: schemaTypes,
  },
})
