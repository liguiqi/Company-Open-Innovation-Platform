import fsPromises from 'fs/promises'
import path from 'path'

const MEDIA_DIR_ENV = 'INNOVATION_MEDIA_DIR'
const STANDALONE_SEGMENT = `${path.sep}.next${path.sep}standalone`

export const mediaModuleOptions = [
  { label: '通用资源', value: 'general' },
  { label: '方案附件', value: 'proposals' },
  { label: '伙伴资料', value: 'partners' },
  { label: '技术需求图片', value: 'tech-needs' },
  { label: '案例封面', value: 'case-studies' },
  { label: '用户头像', value: 'users' },
] as const

export const mediaAssetCategoryOptions = [
  { label: '通用图片', value: 'general-image' },
  { label: '通用文档', value: 'general-document' },
  { label: '方案附件', value: 'proposal-attachment' },
  { label: '伙伴 Logo', value: 'partner-logo' },
  { label: '伙伴 SVG', value: 'partner-svg' },
  { label: '伙伴文档', value: 'partner-document' },
  { label: '技术需求图片', value: 'need-image' },
  { label: '案例封面', value: 'case-cover' },
  { label: '用户头像', value: 'user-avatar' },
] as const

export type MediaModule = (typeof mediaModuleOptions)[number]['value']
export type MediaAssetCategory = (typeof mediaAssetCategoryOptions)[number]['value']
export type MediaPurpose = 'document' | 'image'

type MediaResourceRef = {
  id?: number | string | null
  purpose?: MediaPurpose | null | string
  url?: string | null
}

const mediaModuleValueSet = new Set<MediaModule>(mediaModuleOptions.map((option) => option.value))
const mediaAssetCategoryValueSet = new Set<MediaAssetCategory>(
  mediaAssetCategoryOptions.map((option) => option.value),
)

const mediaStorageDirectoryMap: Record<MediaAssetCategory, string> = {
  'case-cover': 'image/case-studies/cover',
  'general-document': 'document/general',
  'general-image': 'image/general',
  'need-image': 'image/tech-needs',
  'partner-document': 'document/partners',
  'partner-logo': 'image/partners/logo',
  'partner-svg': 'image/partners/svg',
  'proposal-attachment': 'document/proposals',
  'user-avatar': 'image/users/avatar',
}

function getProjectRootFromCwd(cwd = process.cwd()) {
  const normalizedCwd = path.resolve(cwd)

  if (normalizedCwd.includes(STANDALONE_SEGMENT)) {
    return normalizedCwd.split(STANDALONE_SEGMENT)[0] || normalizedCwd
  }

  return normalizedCwd
}

export function getPersistentMediaDir() {
  if (process.env[MEDIA_DIR_ENV]) {
    return path.resolve(process.env[MEDIA_DIR_ENV]!)
  }

  return path.resolve(getProjectRootFromCwd(), 'media')
}

export function getRuntimeMediaDirs() {
  const runtimeDir = path.resolve(process.cwd(), 'media')
  const persistentDir = getPersistentMediaDir()

  return Array.from(new Set([persistentDir, runtimeDir]))
}

export function resolveMediaPath(baseDir: string, filename: string) {
  const safeBase = path.resolve(baseDir)
  const safePath = path.resolve(safeBase, filename)

  if (!safePath.startsWith(`${safeBase}${path.sep}`)) {
    return null
  }

  return safePath
}

function getAsciiFilenameFallback(filename: string) {
  const extension = path.extname(filename)
  const extensionFallback = extension
    .normalize('NFKD')
    .replace(/[^\x20-\x7E]+/g, '')
    .replace(/[^A-Za-z0-9._-]+/g, '')
  const basename = path.basename(filename, extension)
  const basenameFallback = basename
    .normalize('NFKD')
    .replace(/[^\x20-\x7E]+/g, '')
    .replace(/[^A-Za-z0-9._-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')

  return `${basenameFallback || 'attachment'}${extensionFallback}`
}

export function getAttachmentContentDisposition(filename: string) {
  const fallback = getAsciiFilenameFallback(filename).replace(/["\\]/g, '_')
  const encoded = encodeURIComponent(filename)

  return `attachment; filename="${fallback}"; filename*=UTF-8''${encoded}`
}

function normalizeFilename(filename?: string | null) {
  if (!filename) {
    return null
  }

  return path.posix.basename(filename.replace(/\\/g, '/'))
}

function normalizeRelativePath(relativePath?: string | null) {
  if (!relativePath) {
    return null
  }

  const normalized = relativePath.replace(/\\/g, '/').replace(/^\/+/, '')

  return normalized || null
}

function isSvgAsset({
  filename,
  mimeType,
}: {
  filename?: string | null
  mimeType?: string | null
}) {
  return mimeType === 'image/svg+xml' || normalizeFilename(filename)?.toLowerCase().endsWith('.svg')
}

export function normalizeMediaModule({
  module,
  purpose,
}: {
  module?: string | null
  purpose?: string | null
}): MediaModule {
  if (module && mediaModuleValueSet.has(module as MediaModule)) {
    return module as MediaModule
  }

  if (purpose === 'document') {
    return 'general'
  }

  return 'general'
}

export function normalizeMediaAssetCategory({
  assetCategory,
  filename,
  mimeType,
  module,
  purpose,
}: {
  assetCategory?: string | null
  filename?: string | null
  mimeType?: string | null
  module?: string | null
  purpose?: string | null
}): MediaAssetCategory {
  if (assetCategory && mediaAssetCategoryValueSet.has(assetCategory as MediaAssetCategory)) {
    return assetCategory as MediaAssetCategory
  }

  if (purpose === 'document') {
    if (module === 'partners') {
      return 'partner-document'
    }

    if (module === 'proposals') {
      return 'proposal-attachment'
    }

    return 'general-document'
  }

  switch (module) {
    case 'case-studies':
      return 'case-cover'
    case 'partners':
      return isSvgAsset({ filename, mimeType }) ? 'partner-svg' : 'partner-logo'
    case 'tech-needs':
      return 'need-image'
    case 'users':
      return 'user-avatar'
    default:
      return 'general-image'
  }
}

export function buildMediaStorageKey({
  assetCategory,
  filename,
}: {
  assetCategory: MediaAssetCategory
  filename?: string | null
}) {
  const safeFilename = normalizeFilename(filename)

  if (!safeFilename) {
    return null
  }

  return path.posix.join(mediaStorageDirectoryMap[assetCategory], safeFilename)
}

export function getMediaResourceURL(media?: MediaResourceRef | null) {
  if (!media || typeof media !== 'object') {
    return null
  }

  if (media.id != null) {
    const encodedId = encodeURIComponent(String(media.id))
    return media.purpose === 'document'
      ? `/api/attachments/${encodedId}`
      : `/api/public-media/${encodedId}`
  }

  return media.url || null
}

export function getMediaImageURL(media?: MediaResourceRef | null) {
  if (!media || typeof media !== 'object') {
    return null
  }

  if (media.id != null) {
    return `/api/public-media/${encodeURIComponent(String(media.id))}`
  }

  return media.url || null
}

async function fileExists(filePath: string) {
  return fsPromises
    .stat(filePath)
    .then(() => true)
    .catch(() => false)
}

async function moveFile(sourcePath: string, targetPath: string) {
  await fsPromises.mkdir(path.dirname(targetPath), { recursive: true })

  try {
    await fsPromises.rename(sourcePath, targetPath)
  } catch (error) {
    const renameError = error as NodeJS.ErrnoException

    if (renameError.code !== 'EXDEV') {
      throw error
    }

    await fsPromises.copyFile(sourcePath, targetPath)
    await fsPromises.unlink(sourcePath).catch(() => undefined)
  }
}

async function removeFileIfExists(filePath: string) {
  await fsPromises.unlink(filePath).catch(() => undefined)
}

async function pruneEmptyDirectories(baseDir: string, relativeFilePath: string) {
  let currentDir = path.dirname(resolveMediaPath(baseDir, relativeFilePath) || '')
  const basePath = path.resolve(baseDir)

  while (currentDir && currentDir.startsWith(basePath) && currentDir !== basePath) {
    const entries = await fsPromises.readdir(currentDir).catch(() => null)

    if (!entries || entries.length > 0) {
      break
    }

    await fsPromises.rmdir(currentDir).catch(() => undefined)
    currentDir = path.dirname(currentDir)
  }
}

function uniqueRelativePaths(paths: Array<string | null | undefined>) {
  return Array.from(
    new Set(paths.map((value) => normalizeRelativePath(value)).filter(Boolean) as string[]),
  )
}

export async function ensureMediaFileOrganization({
  filename,
  previousStorageKey,
  storageKey,
}: {
  filename?: string | null
  previousStorageKey?: string | null
  storageKey?: string | null
}) {
  const fallbackFilename = normalizeFilename(filename)
  const targetRelativePath = storageKey || fallbackFilename

  if (!targetRelativePath) {
    return
  }

  const candidateRelativePaths = uniqueRelativePaths([
    targetRelativePath,
    previousStorageKey,
    fallbackFilename,
  ])

  for (const mediaDir of getRuntimeMediaDirs()) {
    const targetPath = resolveMediaPath(mediaDir, targetRelativePath)

    if (!targetPath) {
      continue
    }

    let existingSourceRelativePath: string | null = null

    for (const candidateRelativePath of candidateRelativePaths) {
      const candidatePath = resolveMediaPath(mediaDir, candidateRelativePath)

      if (!candidatePath) {
        continue
      }

      if (await fileExists(candidatePath)) {
        existingSourceRelativePath = candidateRelativePath
        break
      }
    }

    if (existingSourceRelativePath) {
      const sourcePath = resolveMediaPath(mediaDir, existingSourceRelativePath)

      if (sourcePath && existingSourceRelativePath !== targetRelativePath) {
        await moveFile(sourcePath, targetPath)
      }
    }

    for (const staleRelativePath of candidateRelativePaths) {
      if (staleRelativePath === targetRelativePath) {
        continue
      }

      const stalePath = resolveMediaPath(mediaDir, staleRelativePath)

      if (!stalePath) {
        continue
      }

      await removeFileIfExists(stalePath)
      await pruneEmptyDirectories(mediaDir, staleRelativePath)
    }
  }
}

export async function readMediaFile({
  filename,
  storageKey,
}: {
  filename?: string | null
  storageKey?: string | null
}) {
  const candidateRelativePaths = uniqueRelativePaths([storageKey, filename])

  for (const mediaDir of getRuntimeMediaDirs()) {
    for (const candidateRelativePath of candidateRelativePaths) {
      const filePath = resolveMediaPath(mediaDir, candidateRelativePath)

      if (!filePath) {
        continue
      }

      const data = await fsPromises.readFile(filePath).catch(() => null)

      if (data) {
        return data
      }
    }
  }

  return null
}

export async function deleteMediaFiles({
  filename,
  storageKey,
}: {
  filename?: string | null
  storageKey?: string | null
}) {
  const candidateRelativePaths = uniqueRelativePaths([storageKey, filename])

  for (const mediaDir of getRuntimeMediaDirs()) {
    for (const candidateRelativePath of candidateRelativePaths) {
      const filePath = resolveMediaPath(mediaDir, candidateRelativePath)

      if (!filePath) {
        continue
      }

      await removeFileIfExists(filePath)
      await pruneEmptyDirectories(mediaDir, candidateRelativePath)
    }
  }
}
