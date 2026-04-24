import type { CollectionConfig } from 'payload'

import { isAdmin } from '@/access/isAdmin'
import { generateNeedId } from '@/hooks/generateNeedId'

export const TechNeeds: CollectionConfig = {
  slug: 'tech-needs',
  access: {
    create: isAdmin,
    read: () => true,
    update: isAdmin,
    delete: isAdmin,
  },
  admin: {
    defaultColumns: ['needId', 'title', 'priority', 'domain', 'status'],
    group: '内容资产',
    useAsTitle: 'title',
  },
  fields: [
    {
      name: 'needId',
      type: 'text',
      admin: {
        description: '系统按 RD-年份-流水号 自动生成，创建后不可修改。',
        placeholder: '保存后自动生成，例如 RD-2026-001',
        readOnly: true,
      },
      index: true,
      unique: true,
    },
    {
      name: 'title',
      type: 'text',
      required: true,
    },
    {
      name: 'priority',
      type: 'select',
      options: [
        { label: '急需解决', value: 'urgent' },
        { label: '开放探索', value: 'open' },
        { label: '联合预研', value: 'joint-research' },
      ],
      required: true,
    },
    {
      name: 'domain',
      type: 'select',
      options: [
        { label: '电机控制', value: 'motor-control' },
        { label: '传感器技术', value: 'sensor' },
        { label: '新材料 / 工艺', value: 'materials' },
        { label: 'AI 与算法', value: 'ai' },
      ],
      required: true,
    },
    {
      name: 'productLine',
      type: 'text',
    },
    {
      name: 'description',
      type: 'richText',
      required: true,
    },
    {
      name: 'status',
      type: 'select',
      defaultValue: 'open',
      options: [
        { label: '开放中', value: 'open' },
        { label: '推进中', value: 'in-progress' },
        { label: '已关闭', value: 'closed' },
      ],
      required: true,
    },
    {
      name: 'publishedAt',
      type: 'date',
    },
  ],
  hooks: {
    beforeValidate: [generateNeedId],
  },
}
