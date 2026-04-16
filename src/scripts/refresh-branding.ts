import { plainTextToLexical } from '@/lib/lexical'
import { getPayloadClient } from '@/lib/payload'

function createSVGBuffer(title: string, subtitle: string, color: string) {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="1200" height="675" viewBox="0 0 1200 675">
      <defs>
        <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#001f4d" />
          <stop offset="100%" stop-color="${color}" />
        </linearGradient>
      </defs>
      <rect width="1200" height="675" fill="url(#bg)" rx="48" />
      <circle cx="930" cy="160" r="120" fill="rgba(255,255,255,0.08)" />
      <circle cx="1040" cy="520" r="180" fill="rgba(255,255,255,0.06)" />
      <text x="90" y="270" fill="white" font-size="58" font-family="Arial, Microsoft YaHei, sans-serif" font-weight="700">${title}</text>
      <text x="90" y="340" fill="rgba(255,255,255,0.78)" font-size="28" font-family="Arial, Microsoft YaHei, sans-serif">${subtitle}</text>
      <text x="90" y="580" fill="rgba(255,255,255,0.55)" font-size="22" font-family="Arial, Microsoft YaHei, sans-serif">HeT Open Innovation Platform</text>
    </svg>
  `

  return Buffer.from(svg)
}

async function refreshSeedMedia({
  alt,
  color,
  filename,
  subtitle,
}: {
  alt: string
  color: string
  filename: string
  subtitle: string
}) {
  const payload = await getPayloadClient()
  const existing = await payload.find({
    collection: 'media',
    depth: 0,
    limit: 1,
    overrideAccess: true,
    pagination: false,
    where: {
      alt: {
        equals: alt,
      },
    },
  })

  const buffer = createSVGBuffer(alt, subtitle, color)

  if (!existing.docs[0]) {
    return null
  }

  return payload.update({
    id: existing.docs[0].id,
    collection: 'media',
    data: {
      alt,
      purpose: existing.docs[0].purpose || 'image',
    },
    file: {
      data: buffer,
      mimetype: 'image/svg+xml',
      name: filename,
      size: buffer.length,
    },
    overrideAccess: true,
  })
}

async function refreshCaseStudy({
  content,
  slug,
  summary,
}: {
  content: string
  slug: string
  summary: string
}) {
  const payload = await getPayloadClient()
  const existing = await payload.find({
    collection: 'case-studies',
    depth: 0,
    limit: 1,
    overrideAccess: true,
    pagination: false,
    where: {
      slug: {
        equals: slug,
      },
    },
  })

  if (!existing.docs[0]) {
    return null
  }

  return payload.update({
    id: existing.docs[0].id,
    collection: 'case-studies',
    data: {
      content: plainTextToLexical(content),
      summary,
    },
    overrideAccess: true,
  })
}

async function main() {
  const payload = await getPayloadClient()
  payload.logger.info('Refreshing HeT branding content ...')

  await Promise.all([
    refreshSeedMedia({
      alt: 'Partner A Logo',
      color: '#00A0E9',
      filename: 'partner-a.svg',
      subtitle: 'MCU, DSP, FPGA',
    }),
    refreshSeedMedia({
      alt: 'Partner B Logo',
      color: '#22c55e',
      filename: 'partner-b.svg',
      subtitle: 'GaN, MOSFET, Power',
    }),
    refreshSeedMedia({
      alt: 'Partner C Logo',
      color: '#f97316',
      filename: 'partner-c.svg',
      subtitle: 'Thread, WiFi, Sensor',
    }),
    refreshSeedMedia({
      alt: '洗衣机直驱变频方案',
      color: '#004098',
      filename: 'case-washer.svg',
      subtitle: 'HeT × Partner A',
    }),
    refreshSeedMedia({
      alt: '低成本离线语音控制模组',
      color: '#00A0E9',
      filename: 'case-voice.svg',
      subtitle: 'HeT × Partner B',
    }),
    refreshCaseStudy({
      content:
        '通过联合开发底层 FOC 算法，我们将芯片算力发挥到极致，实现洗衣机在超低转速下的平稳运行，噪音降低 3dB。方案已在欧洲头部家电客户量产。',
      slug: 'foc-washing-machine',
      summary:
        '联合开发底层 FOC 算法，在新一代洗衣机直驱变频方案中实现更平稳的超低速控制和更低噪声。',
    }),
    refreshCaseStudy({
      content:
        '整合合作伙伴的轻量级 NLP 模型，在低成本 MCU 上实现 99% 的离线命令识别率，为智能卫浴产品提供免联网语音交互能力。',
      slug: 'offline-voice-module',
      summary: '借助轻量级 NLP 模型和 HeT 平台算法，在低成本 MCU 平台实现高识别率离线语音交互。',
    }),
  ])

  payload.logger.info('HeT branding refresh completed')
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
