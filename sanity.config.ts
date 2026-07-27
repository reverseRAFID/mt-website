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
            S.divider(),
            // Merch shop — the order queue first, because that is the thing
            // somebody has to work through daily. A customer is waiting at the
            // other end of every row in "New Orders".
            S.listItem()
              .title('Shop')
              .icon(() => '🛍️')
              .child(
                S.list()
                  .title('Shop')
                  .items([
                    S.listItem()
                      .title('New Orders')
                      .icon(() => '🆕')
                      .child(
                        S.documentList()
                          .title('New Orders — confirm these')
                          .filter('_type == "order" && status == "placed"')
                          .defaultOrdering([{ field: 'placedAt', direction: 'asc' }])
                      ),
                    S.listItem()
                      .title('To Fulfil')
                      .icon(() => '📦')
                      .child(
                        S.documentList()
                          .title('To Fulfil — confirmed, packing, or on its way')
                          .filter(
                            '_type == "order" && status in ["confirmed", "processing", "dispatched"]'
                          )
                          .defaultOrdering([{ field: 'placedAt', direction: 'asc' }])
                      ),
                    S.listItem()
                      .title('Awaiting Payment')
                      .icon(() => '💵')
                      .child(
                        S.documentList()
                          .title('Delivered but not yet marked paid')
                          .filter(
                            '_type == "order" && status == "delivered" && paymentStatus != "paid"'
                          )
                          .defaultOrdering([{ field: 'placedAt', direction: 'asc' }])
                      ),
                    S.listItem()
                      .title('Delivered')
                      .icon(() => '✅')
                      .child(
                        S.documentList()
                          .title('Delivered')
                          .filter('_type == "order" && status == "delivered"')
                          .defaultOrdering([{ field: 'placedAt', direction: 'desc' }])
                      ),
                    S.listItem()
                      .title('Cancelled')
                      .icon(() => '⛔')
                      .child(
                        S.documentList()
                          .title('Cancelled — stock returned to inventory')
                          .filter('_type == "order" && status == "cancelled"')
                          .defaultOrdering([{ field: 'placedAt', direction: 'desc' }])
                      ),
                    // Anything whose confirmation email did not go out. Left
                    // unattended these are silent failures: the order is fine,
                    // the customer just never heard about it.
                    S.listItem()
                      .title('Email Problems')
                      .icon(() => '⚠️')
                      .child(
                        S.documentList()
                          .title('Confirmation email failed or was skipped')
                          .filter('_type == "order" && emailStatus in ["failed", "skipped"]')
                          .defaultOrdering([{ field: 'placedAt', direction: 'desc' }])
                      ),
                    S.divider(),
                    S.listItem()
                      .title('All Orders')
                      .icon(() => '📋')
                      .child(
                        S.documentTypeList('order')
                          .title('All Orders')
                          .defaultOrdering([{ field: 'placedAt', direction: 'desc' }])
                      ),
                    S.divider(),
                    S.listItem()
                      .title('Products')
                      .icon(() => '👕')
                      .child(
                        S.documentTypeList('product')
                          .title('Products')
                          .defaultOrdering([{ field: 'order', direction: 'asc' }])
                      ),
                    S.listItem()
                      .title('Categories')
                      .icon(() => '🏷️')
                      .child(
                        S.documentTypeList('productCategory')
                          .title('Categories')
                          .defaultOrdering([{ field: 'order', direction: 'asc' }])
                      ),
                    // Any tracked product with a live variant at or below its
                    // own alert threshold. coalesce() covers rows saved before
                    // the threshold field existed.
                    S.listItem()
                      .title('Low Stock')
                      .icon(() => '🪫')
                      .child(
                        S.documentList()
                          .title('Low Stock — restock or hide')
                          .filter(
                            '_type == "product" && trackInventory != false && count(variants[isActive != false && stock <= coalesce(lowStockThreshold, 3)]) > 0'
                          )
                          .defaultOrdering([{ field: 'title', direction: 'asc' }])
                      ),
                    S.divider(),
                    S.listItem()
                      .title('Shop Settings')
                      .icon(() => '⚙️')
                      .child(
                        S.document()
                          .documentId('shop-config')
                          .schemaType('shopConfig')
                          .title('Shop Configuration')
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
