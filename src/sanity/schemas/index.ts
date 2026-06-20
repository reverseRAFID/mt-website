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
  // Singleton
  recruitmentConfig,
  // Form submissions
  application,
]
