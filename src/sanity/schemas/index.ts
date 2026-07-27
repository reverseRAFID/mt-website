import { announcement } from './announcement'
import { rover } from './rover'
import { competition } from './competition'
import { member } from './member'
import { research } from './research'
import { post } from './post'
import { sponsor } from './sponsor'
import { testimonial } from './testimonial'
import { sarVideo } from './sarVideo'
import { recruitmentConfig } from './recruitmentConfig'
import { application } from './application'
import { crowdfundingConfig } from './crowdfundingConfig'
import { donation } from './donation'
import { productCategory } from './productCategory'
import { product } from './product'
import { shopConfig } from './shopConfig'
import { order } from './order'

export const schemaTypes = [
  // Documents
  announcement,
  member,
  rover,
  competition,
  research,
  post,
  sponsor,
  testimonial,
  sarVideo,
  // Shop catalogue
  productCategory,
  product,
  // Singletons
  recruitmentConfig,
  crowdfundingConfig,
  shopConfig,
  // Form submissions
  application,
  donation,
  order,
]
