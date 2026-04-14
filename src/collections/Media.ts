import type { CollectionConfig } from 'payload'

export const Media: CollectionConfig = {
  slug: 'media',
  access: {
    create: ({ req }) => Boolean(req.user),
    read: ({ req }) => {
      if (!req.user) {
        return {
          purpose: {
            equals: 'image',
          },
        } as any
      }

      if (req.user.role === 'admin' || req.user.role === 'reviewer') {
        return true
      }

      return {
        or: [
          {
            purpose: {
              equals: 'image',
            },
          },
          {
            uploadedBy: {
              equals: req.user.id,
            },
          },
        ],
      } as any
    },
    update: ({ req }) => req.user?.role === 'admin',
    delete: ({ req }) => req.user?.role === 'admin',
  },
  admin: {
    defaultColumns: ['filename', 'purpose', 'mimeType', 'updatedAt'],
    group: '内容资产',
  },
  fields: [
    {
      name: 'alt',
      type: 'text',
      required: true,
    },
    {
      name: 'purpose',
      type: 'select',
      defaultValue: 'image',
      options: [
        { label: '展示图片', value: 'image' },
        { label: '方案附件', value: 'document' },
      ],
      required: true,
    },
    {
      name: 'uploadedBy',
      type: 'relationship',
      relationTo: 'users',
    },
    {
      name: 'proposal',
      type: 'relationship',
      relationTo: 'proposals',
    },
  ],
  upload: {
    mimeTypes: [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'image/*',
    ],
    staticDir: './media',
  },
}
