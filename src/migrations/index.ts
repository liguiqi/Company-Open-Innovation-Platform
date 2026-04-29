import * as migration_20260429_065141_add_proposal_review_timeline from './20260429_065141_add_proposal_review_timeline'

export const migrations = [
  {
    up: migration_20260429_065141_add_proposal_review_timeline.up,
    down: migration_20260429_065141_add_proposal_review_timeline.down,
    name: '20260429_065141_add_proposal_review_timeline',
  },
]
