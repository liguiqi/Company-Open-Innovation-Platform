import type { CollectionConfig } from 'payload'

import {
  buildMediaStorageKey,
  deleteMediaFiles,
  ensureMediaFileOrganization,
  getAttachmentContentDisposition,
  getMediaImageURL,
  getPersistentMediaDir,
  type MediaAssetCategory,
  mediaAssetCategoryOptions,
  mediaModuleOptions,
  normalizeMediaAssetCategory,
  normalizeMediaModule,
  readMediaFile,
} from '@/lib/media'
import { getMediaFolderId } from '@/lib/media-folders'

export const Media: CollectionConfig = {
  slug: 'media',
  folders: {
    browseByFolder: true,
  },
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
    defaultColumns: [
      'filename',
      'folder',
      'module',
      'assetCategory',
      'purpose',
      'proposal',
      'uploadedBy',
      'updatedAt',
    ],
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
      name: 'module',
      type: 'select',
      admin: {
        description: '按业务模块归档媒体文件，例如 proposals / partners / tech-needs。',
      },
      defaultValue: 'general',
      options: mediaModuleOptions.map((option) => ({
        label: option.label,
        value: option.value,
      })),
      required: true,
    },
    {
      name: 'assetCategory',
      type: 'select',
      admin: {
        description: '更细粒度的资产分类，用于自动映射到 media/ 下的专属目录。',
      },
      defaultValue: 'general-image',
      options: mediaAssetCategoryOptions.map((option) => ({
        label: option.label,
        value: option.value,
      })),
      required: true,
    },
    {
      name: 'storageKey',
      type: 'text',
      admin: {
        description: '物理存储相对路径，由系统自动维护。',
        position: 'sidebar',
        readOnly: true,
      },
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
      (_req, { doc }): void | Promise<Response> => {
        const mediaDoc = doc as {
          filename?: string | null
          mimeType?: string | null
          purpose?: string | null
          storageKey?: string | null
        }

        if (!mediaDoc?.filename) {
          return
        }

        const filename = mediaDoc.filename

        return (async () => {
          const data = await readMediaFile({
            filename,
            storageKey: mediaDoc.storageKey,
          })

          if (!data) {
            return new Response(null, { status: 404 })
          }

          const headers = new Headers()

          headers.set('Content-Length', String(data.length))
          headers.set('Content-Type', mediaDoc.mimeType || 'application/octet-stream')

          if (mediaDoc.purpose === 'document') {
            headers.set('Content-Disposition', getAttachmentContentDisposition(filename))
          }

          return new Response(data, {
            headers,
            status: 200,
          })
        })()
      },
    ],
    mimeTypes: [
      'application/pdf',
      'application/zip',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'application/vnd.rar',
      'application/x-rar-compressed',
      'application/x-zip-compressed',
      'text/plain',
      'image/*',
    ],
    staticDir: getPersistentMediaDir(),
  },
  hooks: {
    beforeChange: [
      async ({ data, originalDoc, req }) => {
        const purpose = data?.purpose || originalDoc?.purpose || 'image'
        const mediaModule = normalizeMediaModule({
          module: data?.module || originalDoc?.module,
          purpose,
        })
        const assetCategory = normalizeMediaAssetCategory({
          assetCategory: data?.assetCategory,
          filename: data?.filename || originalDoc?.filename,
          mimeType: data?.mimeType || originalDoc?.mimeType,
          module: mediaModule,
          purpose,
        })
        const storageKey = buildMediaStorageKey({
          assetCategory,
          filename: data?.filename || originalDoc?.filename,
        })
        const folderId = await getMediaFolderId({
          assetCategory: assetCategory as MediaAssetCategory,
          payload: req.payload,
          req,
        })

        return {
          ...data,
          assetCategory,
          folder: folderId,
          module: mediaModule,
          purpose,
          storageKey,
        }
      },
    ],
    afterRead: [
      ({ doc }) => {
        if (doc?.purpose !== 'image') {
          return doc
        }

        const imageURL = getMediaImageURL(
          doc as { id?: number | string | null; url?: string | null },
        )

        if (!imageURL) {
          return doc
        }

        return {
          ...doc,
          thumbnailURL: imageURL,
          url: imageURL,
        }
      },
    ],
    afterChange: [
      async ({ context, doc, previousDoc, req }) => {
        if ((context as Record<string, unknown> | undefined)?.skipMediaOrganization) {
          return doc
        }

        const mediaModule = normalizeMediaModule({
          module: doc.module,
          purpose: doc.purpose,
        })
        const assetCategory = normalizeMediaAssetCategory({
          assetCategory: doc.assetCategory,
          filename: doc.filename,
          mimeType: doc.mimeType,
          module: mediaModule,
          purpose: doc.purpose,
        })
        const storageKey = buildMediaStorageKey({
          assetCategory,
          filename: doc.filename,
        })

        await ensureMediaFileOrganization({
          filename: doc.filename,
          previousStorageKey: previousDoc?.storageKey,
          storageKey,
        })

        if (
          doc.module === mediaModule &&
          doc.assetCategory === assetCategory &&
          doc.storageKey === storageKey
        ) {
          return doc
        }

        await req.payload.update({
          id: doc.id,
          collection: 'media',
          data: {
            assetCategory,
            module: mediaModule,
            storageKey,
          },
          context: {
            ...(context || {}),
            skipMediaOrganization: true,
          },
          overrideAccess: true,
        })

        return doc
      },
    ],
    afterDelete: [
      async ({ doc }) => {
        await deleteMediaFiles({
          filename: doc.filename,
          storageKey: doc.storageKey,
        })
      },
    ],
  },
}
