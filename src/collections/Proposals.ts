import type { CollectionConfig } from 'payload'

import { sendProposalNotification } from '@/hooks/sendProposalNotification'
import { onProposalStatusChange } from '@/hooks/onProposalStatusChange'
import { syncProposalAttachmentMedia } from '@/hooks/syncRelatedMedia'

export const Proposals: CollectionConfig = {
  slug: 'proposals',
  access: {
    create: ({ req }) => req.user?.role === 'partner' || req.user?.role === 'admin',
    read: ({ req }) => {
      if (!req.user) {
        return false
      }

      if (req.user.role === 'admin' || req.user.role === 'reviewer') {
        return true
      }

      return {
        submittedBy: {
          equals: req.user.id,
        },
      } as any
    },
    update: ({ req }) => {
      if (!req.user) {
        return false
      }

      if (req.user.role === 'admin' || req.user.role === 'reviewer') {
        return true
      }

      return {
        and: [
          {
            submittedBy: {
              equals: req.user.id,
            },
          },
          {
            status: {
              equals: 'pending',
            },
          },
        ],
      } as any
    },
    delete: ({ req }) => req.user?.role === 'admin',
  },
  admin: {
    defaultColumns: ['title', 'type', 'status', 'contactCompany', 'attachments', 'updatedAt'],
    group: '业务流程',
    useAsTitle: 'title',
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
    },
    {
      name: 'type',
      type: 'select',
      options: [
        { label: '响应公开需求', value: 'specific-need' },
        { label: '开放式技术自荐', value: 'open-proposal' },
        { label: '寻求战略投资', value: 'investment' },
        { label: '申请加入生态联盟', value: 'partnership' },
      ],
      required: true,
    },
    {
      name: 'relatedNeed',
      type: 'relationship',
      relationTo: 'tech-needs',
    },
    {
      name: 'description',
      type: 'richText',
      required: true,
    },
    {
      name: 'attachments',
      admin: {
        description: '附件文件统一保存在 media 集合中，可直接复用已上传的文档媒体记录。',
      },
      type: 'relationship',
      hasMany: true,
      relationTo: 'media',
    },
    {
      name: 'submittedBy',
      type: 'relationship',
      admin: {
        readOnly: true,
      },
      relationTo: 'users',
    },
    {
      name: 'contactName',
      type: 'text',
      required: true,
    },
    {
      name: 'contactEmail',
      type: 'email',
      required: true,
    },
    {
      name: 'contactCompany',
      type: 'text',
      required: true,
    },
    {
      name: 'status',
      type: 'select',
      defaultValue: 'pending',
      options: [
        { label: '待评审', value: 'pending' },
        { label: '评审中', value: 'reviewing' },
        { label: '已通过', value: 'approved' },
        { label: '已驳回', value: 'rejected' },
      ],
      required: true,
    },
    {
      name: 'reviewNotes',
      type: 'richText',
      access: {
        create: ({ req }) => req.user?.role === 'admin' || req.user?.role === 'reviewer',
        read: ({ req }) =>
          req.user?.role === 'admin' ||
          req.user?.role === 'reviewer' ||
          req.user?.role === 'partner',
        update: ({ req }) => req.user?.role === 'admin' || req.user?.role === 'reviewer',
      },
    },
    {
      name: 'reviewedBy',
      type: 'relationship',
      admin: {
        readOnly: true,
      },
      relationTo: 'users',
    },
  ],
  hooks: {
    afterChange: [sendProposalNotification, onProposalStatusChange, syncProposalAttachmentMedia],
    beforeChange: [
      ({ data, operation, req }) => {
        if (operation === 'create' && req.user?.id) {
          return {
            ...data,
            submittedBy: data.submittedBy || req.user.id,
          }
        }

        return data
      },
    ],
  },
}
