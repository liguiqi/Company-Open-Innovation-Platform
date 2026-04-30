import * as migration_20260429_065141_add_proposal_review_timeline from './20260429_065141_add_proposal_review_timeline'
import * as migration_20260429_181500_add_users_last_access from './20260429_181500_add_users_last_access'

export const migrations = [
  {
    up: migration_20260429_065141_add_proposal_review_timeline.up,
    down: migration_20260429_065141_add_proposal_review_timeline.down,
    name: '20260429_065141_add_proposal_review_timeline',
  },
  {
    up: migration_20260429_181500_add_users_last_access.up,
    down: migration_20260429_181500_add_users_last_access.down,
    name: '20260429_181500_add_users_last_access',
  },
]
