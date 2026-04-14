import type { CollectionAfterChangeHook } from 'payload'

import { sendProposalStatusNotification } from '@/services/email'

export const onProposalStatusChange: CollectionAfterChangeHook = async ({ doc, previousDoc }) => {
  if (!previousDoc || previousDoc.status === doc.status || !doc.contactEmail) {
    return doc
  }

  await sendProposalStatusNotification(doc, doc.contactEmail)
  return doc
}
