import type { CollectionConfig } from 'payload'

import { isAdmin } from '@/access/isAdmin'

export const Partners: CollectionConfig = {
  slug: 'partners',
  access: {
    create: isAdmin,
    read: () => true,
    update: isAdmin,
    delete: isAdmin,
  },
  admin: {
    defaultColumns: ['name', 'category', 'tier', 'sortOrder'],
    group: '内容资产',
    useAsTitle: 'name',
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
    },
    {
      name: 'logo',
      type: 'relationship',
      relationTo: 'media',
    },
    {
      name: 'website',
      type: 'text',
    },
    {
      name: 'category',
      type: 'select',
      options: [
        { label: '核心计算芯片', value: 'chip' },
        { label: '功率与电源', value: 'power' },
        { label: '连接与传感', value: 'connectivity' },
        { label: '产学研机构', value: 'academia' },
      ],
      required: true,
    },
    {
      name: 'tier',
      type: 'select',
      options: [
        { label: '金牌战略伙伴', value: 'strategic' },
        { label: '认证伙伴', value: 'certified' },
        { label: '一般伙伴', value: 'general' },
      ],
      required: true,
    },
    {
      name: 'description',
      type: 'textarea',
    },
    {
      name: 'products',
      type: 'text',
    },
    {
      name: 'sortOrder',
      type: 'number',
      defaultValue: 100,
    },
  ],
}
