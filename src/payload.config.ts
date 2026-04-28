import { postgresAdapter } from '@payloadcms/db-postgres'
import { nodemailerAdapter } from '@payloadcms/email-nodemailer'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import path from 'path'
import { buildConfig } from 'payload'
import { fileURLToPath } from 'url'
import sharp from 'sharp'

import { CaseStudies } from './collections/CaseStudies'
import { Users } from './collections/Users'
import { Media } from './collections/Media'
import { Partners } from './collections/Partners'
import { Proposals } from './collections/Proposals'
import { TechNeeds } from './collections/TechNeeds'
import { UserGroups } from './collections/UserGroups'
import { appEnv } from './lib/env'
import { backfillMediaFolders } from './lib/media-folders'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)
const allowedOrigins = appEnv.payloadAllowedOrigins

export default buildConfig({
  admin: {
    components: {
      afterNav: ['@/components/payload/AdminSidebarFooter'],
      logout: {
        Button: '@/components/payload/AdminSidebarFooter#AdminSidebarLogoutButton',
      },
      graphics: {
        Icon: '@/components/payload/AdminIcon#AdminIcon',
        Logo: '@/components/payload/AdminLoginLogo#AdminLoginLogo',
      },
    },
    meta: {
      icons: [
        {
          media: '(prefers-color-scheme: light)',
          rel: 'icon',
          sizes: '32x32',
          type: 'image/png',
          url: '/branding/het-favicon-32.png',
        },
        {
          media: '(prefers-color-scheme: dark)',
          rel: 'icon',
          sizes: '32x32',
          type: 'image/png',
          url: '/branding/het-favicon-32-white.png',
        },
        {
          rel: 'apple-touch-icon',
          sizes: '180x180',
          type: 'image/png',
          url: '/branding/het-apple-touch-180.png',
        },
      ],
    },
    user: Users.slug,
    importMap: {
      baseDir: path.resolve(dirname),
    },
  },
  collections: [Users, UserGroups, TechNeeds, Proposals, Partners, CaseStudies, Media],
  cors: allowedOrigins,
  csrf: allowedOrigins,
  db: postgresAdapter({
    pool: {
      connectionString: appEnv.databaseURL,
    },
  }),
  email: await nodemailerAdapter({
    defaultFromAddress: appEnv.SMTP_FROM_ADDRESS || appEnv.SMTP_USER || 'innovation@example.com',
    defaultFromName: appEnv.SMTP_FROM_NAME || 'HeT Innovation Platform',
    skipVerify: true,
    transportOptions: appEnv.smtpEnabled
      ? {
          auth: {
            pass: appEnv.SMTP_PASS,
            user: appEnv.SMTP_USER,
          },
          host: appEnv.SMTP_HOST,
          port: appEnv.SMTP_PORT || 25,
          secure: appEnv.smtpSecure,
          tls: {
            rejectUnauthorized: appEnv.smtpTlsRejectUnauthorized,
          },
        }
      : undefined,
  }),
  editor: lexicalEditor(),
  folders: {
    browseByFolder: true,
    collectionSpecific: true,
  },
  graphQL: {
    disablePlaygroundInProduction: true,
  },
  onInit: async (payload) => {
    await backfillMediaFolders({
      payload,
    })
    payload.logger.info('H&T Open Innovation Platform initialized')
  },
  routes: {
    admin: '/admin',
    api: '/api',
  },
  secret: appEnv.PAYLOAD_SECRET,
  serverURL: appEnv.NEXT_PUBLIC_SERVER_URL,
  sharp,
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
  plugins: [],
})
