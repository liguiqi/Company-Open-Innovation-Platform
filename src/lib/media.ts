import path from 'path'

const MEDIA_DIR_ENV = 'INNOVATION_MEDIA_DIR'
const STANDALONE_SEGMENT = `${path.sep}.next${path.sep}standalone`

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
