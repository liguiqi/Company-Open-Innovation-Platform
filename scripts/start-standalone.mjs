import { cpSync, existsSync, mkdirSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const rootDir = path.resolve(__dirname, '..')
const buildDir = path.join(rootDir, '.next')
const standaloneDir = path.join(buildDir, 'standalone')
const standaloneNextDir = path.join(standaloneDir, '.next')
const sourceStaticDir = path.join(buildDir, 'static')
const targetStaticDir = path.join(standaloneNextDir, 'static')
const sourcePublicDir = path.join(rootDir, 'public')
const targetPublicDir = path.join(standaloneDir, 'public')
const sourceMediaDir = path.join(rootDir, 'media')
const targetMediaDir = path.join(standaloneDir, 'media')

if (!existsSync(path.join(standaloneDir, 'server.js'))) {
  console.error('Missing standalone build output. Run `pnpm build` before `pnpm start`.')
  process.exit(1)
}

if (existsSync(sourceStaticDir)) {
  mkdirSync(standaloneNextDir, { recursive: true })
  cpSync(sourceStaticDir, targetStaticDir, { recursive: true, force: true })
}

if (existsSync(sourcePublicDir)) {
  cpSync(sourcePublicDir, targetPublicDir, { recursive: true, force: true })
}

if (existsSync(sourceMediaDir)) {
  cpSync(sourceMediaDir, targetMediaDir, { recursive: true, force: true })
}

await import(path.join(standaloneDir, 'server.js'))
