import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { syncStandaloneAssets } from './sync-standalone-assets.mjs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const rootDir = path.resolve(__dirname, '..')
const buildDir = path.join(rootDir, '.next')
const standaloneDir = path.join(buildDir, 'standalone')

syncStandaloneAssets()

if (existsSync(sourceMediaDir)) {
  cpSync(sourceMediaDir, targetMediaDir, { recursive: true, force: true })
}

await import(path.join(standaloneDir, 'server.js'))
