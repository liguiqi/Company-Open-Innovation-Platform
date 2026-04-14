import type { CollectionConfig } from 'payload'

import { isAdmin } from '@/access/isAdmin'

export const CaseStudies: CollectionConfig = {
  slug: 'case-studies',
  access: {
    create: isAdmin,
    read: () => true,
    update: isAdmin,
    delete: isAdmin,
  },
  admin: {
    defaultColumns: ['title', 'partnerName', 'domain', 'publishedAt'],
    group: '内容资产',
    useAsTitle: 'title',
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
    },
    {
      name: 'slug',
      type: 'text',
      required: true,
      unique: true,
    },
    {
      name: 'partnerName',
      type: 'text',
      required: true,
    },
    {
      name: 'coverImage',
      type: 'relationship',
      relationTo: 'media',
      required: true,
    },
    {
      name: 'summary',
      type: 'textarea',
      required: true,
    },
    {
      name: 'content',
      type: 'richText',
      required: true,
    },
    {
      name: 'whitePaperUrl',
      type: 'text',
    },
    {
      name: 'domain',
      type: 'select',
      options: [
        { label: '家用电器', value: 'home-appliance' },
        { label: '电动工具', value: 'power-tool' },
        { label: '汽车电子', value: 'automotive' },
      ],
      required: true,
    },
    {
      name: 'publishedAt',
      type: 'date',
      required: true,
    },
  ],
}
