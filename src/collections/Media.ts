import type { CollectionConfig } from 'payload'
import fsPromises from 'fs/promises'
import path from 'path'

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
    defaultColumns: ['filename', 'purpose', 'proposal', 'uploadedBy', 'mimeType', 'updatedAt'],
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
      admin: {
        description: '若该文档来自某条方案提交，这里会回指来源 proposal，便于二次复用。',
      },
      type: 'relationship',
      relationTo: 'proposals',
    },
  ],
  upload: {
    handlers: [
      (_req, { doc, params }): void | Promise<Response> => {
        const mediaDoc = doc as {
          filename?: string | null
          mimeType?: string | null
          purpose?: string | null
        }

        if (mediaDoc.purpose !== 'document') {
          return
        }

        const staticDir = path.resolve('./media')
        const filePath = path.resolve(staticDir, params.filename)

        if (!filePath.startsWith(`${staticDir}${path.sep}`)) {
          return
        }

        return fsPromises.readFile(filePath).then((data) => {
          const headers = new Headers()
          const filename = mediaDoc.filename || params.filename

          headers.set(
            'Content-Disposition',
            `attachment; filename="${filename}"; filename*=UTF-8''${encodeURIComponent(filename)}`,
          )
          headers.set('Content-Length', String(data.length))
          headers.set('Content-Type', mediaDoc.mimeType || 'application/octet-stream')

          return new Response(data, {
            headers,
            status: 200,
          })
        })
      },
    ],
    mimeTypes: [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'text/plain',
      'image/*',
    ],
    staticDir: './media',
  },
}
