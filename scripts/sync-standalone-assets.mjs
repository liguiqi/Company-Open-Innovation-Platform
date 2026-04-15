import { cpSync, existsSync, mkdirSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const rootDir = path.resolve(__dirname, '..')
const buildDir = path.join(rootDir, '.next')
const standaloneDir = path.join(buildDir, 'standalone')
const standaloneNextDir = path.join(standaloneDir, '.next')

function copyTree(sourceDir, targetDir, { ensureParent = false } = {}) {
  if (!existsSync(sourceDir)) {
    return
  }

  if (ensureParent) {
    mkdirSync(path.dirname(targetDir), { recursive: true })
  }

  cpSync(sourceDir, targetDir, { recursive: true, force: true })
}

export function syncStandaloneAssets() {
  if (!existsSync(path.join(standaloneDir, 'server.js'))) {
    console.error('Missing standalone build output. Run `pnpm build` before syncing assets.')
    process.exit(1)
  }

  copyTree(path.join(buildDir, 'static'), path.join(standaloneNextDir, 'static'), {
    ensureParent: true,
  })
  copyTree(path.join(rootDir, 'public'), path.join(standaloneDir, 'public'))
  copyTree(path.join(rootDir, 'media'), path.join(standaloneDir, 'media'))
}

if (import.meta.url === `file://${process.argv[1]}`) {
  syncStandaloneAssets()
}
