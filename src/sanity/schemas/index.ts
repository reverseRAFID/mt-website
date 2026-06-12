import { announcement } from './announcement'
import { rover } from './rover'
import { competition } from './competition'
import { member } from './member'
import { research } from './research'
import { post } from './post'
import { sponsor } from './sponsor'
import { sarVideo } from './sarVideo'
import { recruitmentConfig } from './recruitmentConfig'

export const schemaTypes = [
  // Documents
  announcement,
  member,
  rover,
  competition,
  research,
  post,
  sponsor,
  sarVideo,
  // Singleton
  recruitmentConfig,
]
