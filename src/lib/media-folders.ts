import type { MediaAssetCategory } from '@/lib/media'

const mediaFolderPathMap: Record<MediaAssetCategory, string[]> = {
  'case-cover': ['Case Studies', 'Cover'],
  'general-document': ['General', 'Documents'],
  'general-image': ['General', 'Images'],
  'need-image': ['Tech Needs', 'Images'],
  'partner-document': ['Partners', 'Documents'],
  'partner-logo': ['Partners', 'Logo'],
  'partner-svg': ['Partners', 'SVG'],
  'proposal-attachment': ['Proposals', 'Attachments'],
  'user-avatar': ['Users', 'Avatars'],
}

const folderIdCache = new Map<string, number>()

function getFolderCacheKey(pathSegments: string[]) {
  return pathSegments.join('/')
}

async function findFolder({
  name,
  parentId,
  payload,
  req,
}: {
  name: string
  parentId?: number
  payload: any
  req?: unknown
}) {
  const folderQuery = await payload.find({
    collection: 'payload-folders',
    depth: 0,
    limit: 1,
    overrideAccess: true,
    pagination: false,
    req,
    where: {
      and: [
        {
          name: {
            equals: name,
          },
        },
        parentId
          ? {
              folder: {
                equals: parentId,
              },
            }
          : {
              folder: {
                exists: false,
              },
            },
      ],
    },
  })

  return folderQuery.docs[0] || null
}

async function ensureFolderPath({
  pathSegments,
  payload,
  req,
}: {
  pathSegments: string[]
  payload: any
  req?: unknown
}) {
  let parentId: number | undefined

  for (let index = 0; index < pathSegments.length; index += 1) {
    const segment = pathSegments[index]!
    const currentPath = pathSegments.slice(0, index + 1)
    const cacheKey = getFolderCacheKey(currentPath)
    const cachedId = folderIdCache.get(cacheKey)

    if (cachedId) {
      parentId = cachedId
      continue
    }

    let folderDoc = await findFolder({
      name: segment,
      parentId,
      payload,
      req,
    })

    if (!folderDoc) {
      folderDoc = await payload.create({
        collection: 'payload-folders',
        data: {
          folder: parentId,
          folderType: ['media'],
          name: segment,
        },
        overrideAccess: true,
        req,
      })
    }

    folderIdCache.set(cacheKey, folderDoc.id)
    parentId = folderDoc.id
  }

  return parentId
}

export async function getMediaFolderId({
  assetCategory,
  payload,
  req,
}: {
  assetCategory: MediaAssetCategory
  payload: any
  req?: unknown
}) {
  return ensureFolderPath({
    pathSegments: mediaFolderPathMap[assetCategory],
    payload,
    req,
  })
}

export async function ensureDefaultMediaFolders({ payload, req }: { payload: any; req?: unknown }) {
  for (const pathSegments of Object.values(mediaFolderPathMap)) {
    await ensureFolderPath({
      pathSegments,
      payload,
      req,
    })
  }
}

export async function backfillMediaFolders({ payload, req }: { payload: any; req?: unknown }) {
  await ensureDefaultMediaFolders({
    payload,
    req,
  })

  const mediaDocs = await payload.find({
    collection: 'media',
    depth: 0,
    limit: 1000,
    overrideAccess: true,
    pagination: false,
    req,
  })

  for (const mediaDoc of mediaDocs.docs) {
    const folderId = await getMediaFolderId({
      assetCategory: mediaDoc.assetCategory,
      payload,
      req,
    })

    if (folderId && mediaDoc.folder !== folderId) {
      await payload.update({
        id: mediaDoc.id,
        collection: 'media',
        data: {
          folder: folderId,
        },
        overrideAccess: true,
        req,
      })
    }
  }
}
