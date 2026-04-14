import type { Access, Where } from 'payload'

type OwnerField = 'id' | 'submittedBy' | 'uploadedBy'

export const isOwnerOrAdmin = (ownerField: OwnerField = 'submittedBy'): Access => {
  return ({ req }) => {
    const user = req.user

    if (!user) {
      return false
    }

    if (user.role === 'admin' || user.role === 'reviewer') {
      return true
    }

    const where: Where = {
      [ownerField]: {
        equals: user.id,
      },
    }

    return where
  }
}
