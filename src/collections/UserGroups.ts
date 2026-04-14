import type { CollectionConfig } from 'payload'

import { isAdmin } from '@/access/isAdmin'

export const UserGroups: CollectionConfig = {
  slug: 'user-groups',
  access: {
    create: isAdmin,
    read: isAdmin,
    update: isAdmin,
    delete: isAdmin,
  },
  admin: {
    group: '权限',
    useAsTitle: 'name',
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
    },
    {
      name: 'description',
      type: 'textarea',
    },
    {
      name: 'permissions',
      type: 'json',
    },
  ],
}
