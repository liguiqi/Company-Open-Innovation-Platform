import type { CollectionConfig } from 'payload'

import { isAdmin } from '@/access/isAdmin'
import { syncPartnerLogoMedia } from '@/hooks/syncRelatedMedia'
import { partnerBrandOptions, partnerCategoryOptions } from '@/lib/partner-branding'

export const Partners: CollectionConfig = {
  slug: 'partners',
  access: {
    create: isAdmin,
    read: () => true,
    update: isAdmin,
    delete: isAdmin,
  },
  admin: {
    defaultColumns: ['name', 'brandPreset', 'category', 'tier', 'sortOrder'],
    group: '内容资产',
    useAsTitle: 'name',
  },
  fields: [
    {
      name: 'name',
      label: '伙伴名称',
      type: 'text',
      required: true,
      admin: {
        description: '公开站与工作台的展示名称；未选择品牌预设时，也会用于自动生成文本 SVG 标识。',
      },
    },
    {
      name: 'brandPreset',
      label: '品牌预设 SVG',
      type: 'select',
      options: partnerBrandOptions,
      admin: {
        description:
          '优先用于前台统一 Logo 卡片展示。选择后将直接使用预设 SVG；若留空，则优先读取上传 Logo，其次根据名称自动生成字标。',
      },
    },
    {
      name: 'logo',
      label: 'Logo 文件（可选）',
      filterOptions: {
        assetCategory: {
          in: ['partner-logo', 'partner-svg'],
        },
        module: {
          equals: 'partners',
        },
        purpose: {
          equals: 'image',
        },
      },
      type: 'relationship',
      relationTo: 'media',
      admin: {
        description: '用于非预设品牌或自定义 SVG / PNG。若同时设置品牌预设，前台优先使用品牌预设。',
        sortOptions: '-updatedAt',
      },
    },
    {
      name: 'website',
      label: '官网链接',
      type: 'text',
    },
    {
      name: 'category',
      label: '伙伴类型',
      type: 'select',
      options: partnerCategoryOptions,
      required: true,
    },
    {
      name: 'tier',
      label: '展示层级',
      type: 'select',
      options: [
        { label: '金牌战略伙伴', value: 'strategic' },
        { label: '认证伙伴', value: 'certified' },
        { label: '生态伙伴', value: 'ecosystem' },
        { label: '其他伙伴', value: 'other' },
      ],
      required: true,
    },
    {
      name: 'description',
      label: '对外说明',
      type: 'textarea',
      admin: {
        description: '用于 /ecosystem 页面和工作台伙伴管理页的说明文字。',
      },
    },
    {
      name: 'products',
      label: '合作方向 / 产品关键词',
      type: 'text',
    },
    {
      name: 'sortOrder',
      label: '排序权重',
      type: 'number',
      defaultValue: 100,
      admin: {
        description: '数值越小越靠前；公开页会先按展示层级，再按排序权重展示。',
      },
    },
  ],
  hooks: {
    afterChange: [syncPartnerLogoMedia],
  },
}
