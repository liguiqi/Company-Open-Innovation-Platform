import type { CollectionAfterChangeHook } from 'payload'

import { sendProposalCreatedNotification } from '@/services/email'

export const sendProposalNotification: CollectionAfterChangeHook = async ({
  doc,
  operation,
  req,
}) => {
  if (operation !== 'create') {
    return doc
  }

  const reviewers = await req.payload.find({
    collection: 'users',
    depth: 0,
    limit: 100,
    overrideAccess: true,
    pagination: false,
    where: {
      role: {
        in: ['admin', 'reviewer'],
      },
    },
  })

  const reviewerEmails = reviewers.docs
    .map((reviewer) => reviewer.email)
    .filter(Boolean) as string[]
  await sendProposalCreatedNotification(doc, reviewerEmails)

  return doc
}
