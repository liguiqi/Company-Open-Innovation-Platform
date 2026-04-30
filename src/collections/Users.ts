import type { CollectionConfig } from 'payload'

import { isAdmin } from '@/access/isAdmin'
import { syncUserAvatarMedia } from '@/hooks/syncRelatedMedia'
import { touchUserLastAccess } from '@/lib/user-access'

export const Users: CollectionConfig = {
  slug: 'users',
  access: {
    admin: ({ req }) => req.user?.role === 'admin',
    create: isAdmin,
    delete: isAdmin,
    read: ({ req }) => {
      if (!req.user) {
        return false
      }

      if (req.user.role === 'admin') {
        return true
      }

      return {
        id: {
          equals: req.user.id,
        },
      }
    },
    update: ({ req }) => {
      if (!req.user) {
        return false
      }

      if (req.user.role === 'admin') {
        return true
      }

      return {
        id: {
          equals: req.user.id,
        },
      }
    },
  },
  admin: {
    defaultColumns: ['username', 'email', 'phone', 'role', 'lastAccessAt', 'updatedAt'],
    group: '权限',
    useAsTitle: 'name',
  },
  auth: {
    tokenExpiration: 60 * 60 * 8,
    useSessions: false,
  },
  fields: [
    {
      name: 'username',
      type: 'text',
      index: true,
      required: true,
      unique: true,
    },
    {
      name: 'phone',
      type: 'text',
      index: true,
      unique: true,
    },
    {
      name: 'name',
      type: 'text',
      required: true,
      saveToJWT: true,
    },
    {
      name: 'company',
      type: 'text',
    },
    {
      name: 'role',
      type: 'select',
      defaultValue: 'viewer',
      options: [
        { label: '管理员', value: 'admin' },
        { label: '评审员', value: 'reviewer' },
        { label: '合作伙伴', value: 'partner' },
        { label: '访客账号', value: 'viewer' },
      ],
      required: true,
      saveToJWT: true,
    },
    {
      name: 'userGroup',
      type: 'relationship',
      relationTo: 'user-groups',
    },
    {
      name: 'avatar',
      filterOptions: {
        assetCategory: {
          equals: 'user-avatar',
        },
        module: {
          equals: 'users',
        },
        purpose: {
          equals: 'image',
        },
      },
      type: 'relationship',
      relationTo: 'media',
      admin: {
        sortOptions: '-updatedAt',
      },
    },
    {
      name: 'emailVerifiedAt',
      type: 'date',
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'emailVerificationToken',
      type: 'text',
      admin: {
        hidden: true,
      },
    },
    {
      name: 'emailVerificationExpiresAt',
      type: 'date',
      admin: {
        hidden: true,
      },
    },
    {
      name: 'phoneVerifiedAt',
      type: 'date',
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'lastAccessAt',
      label: '最后访问时间',
      type: 'date',
      index: true,
      admin: {
        position: 'sidebar',
        readOnly: true,
      },
    },
  ],
  hooks: {
    afterLogin: [
      async ({ req, user }) =>
        (await touchUserLastAccess(user, {
          force: true,
          now: new Date(),
          payload: req.payload,
        })) ?? user,
    ],
    afterChange: [syncUserAvatarMedia],
  },
}
