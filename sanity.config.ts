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
            S.divider(),
            // Crowdfunding — donation verification queue + campaign settings.
            // Pending sits first: it is the queue somebody has to work through,
            // and a donation stays invisible on the site until it is approved.
            S.listItem()
              .title('Crowdfunding')
              .icon(() => '🫱')
              .child(
                S.list()
                  .title('Crowdfunding')
                  .items([
                    S.listItem()
                      .title('Pending Verification')
                      .icon(() => '⏳')
                      .child(
                        S.documentList()
                          .title('Pending Verification')
                          .filter('_type == "donation" && status == "pending"')
                          .defaultOrdering([{ field: 'donatedAt', direction: 'asc' }])
                      ),
                    S.listItem()
                      .title('Approved (rank order)')
                      .icon(() => '✅')
                      .child(
                        S.documentList()
                          .title('Approved — public rank order')
                          .filter('_type == "donation" && status == "approved"')
                          .defaultOrdering([
                            { field: 'amount', direction: 'desc' },
                            { field: 'approvedAt', direction: 'asc' },
                          ])
                      ),
                    S.listItem()
                      .title('Rejected')
                      .icon(() => '⛔')
                      .child(
                        S.documentList()
                          .title('Rejected')
                          .filter('_type == "donation" && status == "rejected"')
                          .defaultOrdering([{ field: 'donatedAt', direction: 'desc' }])
                      ),
                    S.divider(),
                    S.listItem()
                      .title('All Donations')
                      .icon(() => '📋')
                      .child(
                        S.documentTypeList('donation')
                          .title('All Donations')
                          .defaultOrdering([{ field: 'donatedAt', direction: 'desc' }])
                      ),
                    S.divider(),
                    S.listItem()
                      .title('Campaign Settings')
                      .icon(() => '⚙️')
                      .child(
                        S.document()
                          .documentId('crowdfunding-config')
                          .schemaType('crowdfundingConfig')
                          .title('Crowdfunding Configuration')
                      ),
                  ])
              ),
          ]),
    }),
  ],

  schema: {
    types: schemaTypes,
  },
})
