import type { CollectionSlug } from 'payload'

import { appEnv } from '@/lib/env'
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
      <text x="90" y="580" fill="rgba(255,255,255,0.55)" font-size="22" font-family="Arial, Microsoft YaHei, sans-serif">H&T Open Innovation Platform</text>
    </svg>
  `

  return Buffer.from(svg)
}

async function upsertByField<T extends CollectionSlug>({
  collection,
  data,
  field,
  value,
}: {
  collection: T
  data: Record<string, unknown>
  field: string
  value: string
}) {
  const payload = (await getPayloadClient()) as any
  const existing = await payload.find({
    collection,
    depth: 0,
    limit: 1,
    overrideAccess: true,
    pagination: false,
    where: {
      [field]: {
        equals: value,
      },
    },
  })

  if (existing.docs[0]) {
    return payload.update({
      id: existing.docs[0].id,
      collection,
      data: data as any,
      overrideAccess: true,
    })
  }

  return payload.create({
    collection,
    data: data as any,
    overrideAccess: true,
  })
}

async function ensureMedia({
  alt,
  color,
  filename,
  purpose = 'image',
  subtitle,
}: {
  alt: string
  color: string
  filename: string
  purpose?: 'document' | 'image'
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

  if (existing.docs[0]) {
    return existing.docs[0]
  }

  return payload.create({
    collection: 'media',
    data: {
      alt,
      purpose,
    },
    file: {
      data: createSVGBuffer(alt, subtitle, color),
      mimetype: 'image/svg+xml',
      name: filename,
      size: createSVGBuffer(alt, subtitle, color).length,
    },
    overrideAccess: true,
  })
}

async function main() {
  const payload = await getPayloadClient()
  payload.logger.info('Seeding H&T Open Innovation Platform ...')

  const reviewGroup = await upsertByField({
    collection: 'user-groups',
    data: {
      description: '负责技术评估、POC 筛选和导入建议。',
      name: '技术评审委员会',
    },
    field: 'name',
    value: '技术评审委员会',
  })

  const strategicGroup = await upsertByField({
    collection: 'user-groups',
    data: {
      description: 'Open Innovation重点战略合作伙伴分组。',
      name: '战略伙伴',
    },
    field: 'name',
    value: '战略伙伴',
  })

  const admin = await upsertByField({
    collection: 'users',
    data: {
      company: 'H&T',
      email: appEnv.DEFAULT_ADMIN_EMAIL || 'admin@innovation.local',
      emailVerificationExpiresAt: null,
      emailVerificationToken: '',
      emailVerifiedAt: new Date().toISOString(),
      name: '系统管理员',
      password: appEnv.DEFAULT_ADMIN_PASSWORD || 'ChangeMe123!',
      role: 'admin',
      username: appEnv.DEFAULT_ADMIN_USERNAME || 'admin',
      userGroup: reviewGroup.id,
    },
    field: 'username',
    value: appEnv.DEFAULT_ADMIN_USERNAME || 'admin',
  })

  const reviewer = await upsertByField({
    collection: 'users',
    data: {
      company: 'H&T',
      email: appEnv.DEFAULT_REVIEWER_EMAIL || 'reviewer@innovation.local',
      emailVerificationExpiresAt: null,
      emailVerificationToken: '',
      emailVerifiedAt: new Date().toISOString(),
      name: '技术评审员',
      password: appEnv.DEFAULT_REVIEWER_PASSWORD || 'ChangeMe123!',
      role: 'reviewer',
      username: 'reviewer',
      userGroup: reviewGroup.id,
    },
    field: 'username',
    value: 'reviewer',
  })

  const partner = await upsertByField({
    collection: 'users',
    data: {
      company: 'Demo Innovation Lab',
      email: appEnv.DEFAULT_PARTNER_EMAIL || 'partner@example.com',
      emailVerificationExpiresAt: null,
      emailVerificationToken: '',
      emailVerifiedAt: new Date().toISOString(),
      name: appEnv.DEFAULT_PARTNER_NAME || 'lgq',
      password: appEnv.DEFAULT_PARTNER_PASSWORD || 'ChangeMe123!',
      phone: appEnv.DEFAULT_PARTNER_PHONE || '13200000000',
      phoneVerifiedAt: new Date().toISOString(),
      role: 'partner',
      username: 'lgq',
      userGroup: strategicGroup.id,
    },
    field: 'username',
    value: 'lgq',
  })

  const needs = [
    {
      description:
        '寻找能支持 150A 持续电流，且封装尺寸小于现有 TO-247 标准的创新封装技术。要求热阻低于 0.5 K/W，并能适配工业无人机场景的高频工况。',
      domain: 'motor-control',
      needId: 'RD-2026-001',
      priority: 'urgent',
      productLine: '工业无人机',
      publishedAt: '2026-04-01T09:00:00.000Z',
      status: 'open',
      title: '高功率密度电调散热方案（MOSFET封装）',
    },
    {
      description:
        '针对欧洲出口家电，寻找支持 Thread / WiFi 6 双模，且待机功耗优于行业标准 20% 的单芯片或模组方案，以支撑 Matter 1.3 生态快速导入。',
      domain: 'sensor',
      needId: 'RD-2026-005',
      priority: 'open',
      productLine: '智能家电',
      publishedAt: '2026-04-05T09:00:00.000Z',
      status: 'open',
      title: 'Matter 1.3 协议低功耗多模组方案',
    },
    {
      description:
        '寻找特殊的镜头纳米镀膜工艺或微型加热结构设计，解决冰箱冷藏室内（-5°C ~ 5°C）摄像头起雾问题，并兼顾可量产性。',
      domain: 'ai',
      needId: 'RD-2026-008',
      priority: 'joint-research',
      productLine: '冰箱视觉',
      publishedAt: '2026-04-10T09:00:00.000Z',
      status: 'open',
      title: 'AI冰箱抗凝露视觉识别模组',
    },
  ]

  for (const item of needs) {
    await upsertByField({
      collection: 'tech-needs',
      data: {
        ...item,
        description: plainTextToLexical(item.description),
      },
      field: 'needId',
      value: item.needId,
    })
  }

  const partnerLogoA = await ensureMedia({
    alt: 'Partner A Logo',
    color: '#00A0E9',
    filename: 'partner-a.svg',
    subtitle: 'MCU, DSP, FPGA',
  })
  const partnerLogoB = await ensureMedia({
    alt: 'Partner B Logo',
    color: '#22c55e',
    filename: 'partner-b.svg',
    subtitle: 'GaN, MOSFET, Power',
  })
  const partnerLogoC = await ensureMedia({
    alt: 'Partner C Logo',
    color: '#f97316',
    filename: 'partner-c.svg',
    subtitle: 'Thread, WiFi, Sensor',
  })
  const caseCoverA = await ensureMedia({
    alt: '洗衣机直驱变频方案',
    color: '#004098',
    filename: 'case-washer.svg',
    subtitle: 'H&T × Partner A',
  })
  const caseCoverB = await ensureMedia({
    alt: '低成本离线语音控制模组',
    color: '#00A0E9',
    filename: 'case-voice.svg',
    subtitle: 'H&T × Partner B',
  })

  await upsertByField({
    collection: 'partners',
    data: {
      category: 'chip',
      description: '聚焦高性能 MCU 与 DSP，支持家电和工业控制双栈平台。',
      logo: partnerLogoA.id,
      name: 'Partner A',
      products: 'MCU, DSP, FPGA',
      sortOrder: 1,
      tier: 'strategic',
      website: 'https://example.com/partner-a',
    },
    field: 'name',
    value: 'Partner A',
  })

  await upsertByField({
    collection: 'partners',
    data: {
      category: 'power',
      description: '擅长高功率密度 GaN 与 MOSFET 器件，以及驱动与散热封装技术。',
      logo: partnerLogoB.id,
      name: 'Partner B',
      products: 'GaN, MOSFET, Power',
      sortOrder: 2,
      tier: 'certified',
      website: 'https://example.com/partner-b',
    },
    field: 'name',
    value: 'Partner B',
  })

  await upsertByField({
    collection: 'partners',
    data: {
      category: 'connectivity',
      description: '提供 Thread / WiFi / BLE 多模连接与多传感器融合方案。',
      logo: partnerLogoC.id,
      name: 'Partner C',
      products: 'Thread, WiFi, BLE, Sensors',
      sortOrder: 3,
      tier: 'general',
      website: 'https://example.com/partner-c',
    },
    field: 'name',
    value: 'Partner C',
  })

  await upsertByField({
    collection: 'case-studies',
    data: {
      content: plainTextToLexical(
        '通过联合开发底层 FOC 算法，我们将芯片算力发挥到极致，实现洗衣机在超低转速下的平稳运行，噪音降低 3dB。方案已在欧洲头部家电客户量产。',
      ),
      coverImage: caseCoverA.id,
      domain: 'home-appliance',
      partnerName: 'Partner A (Chip Vendor)',
      publishedAt: '2026-03-18T10:00:00.000Z',
      slug: 'foc-washing-machine',
      summary:
        '联合开发底层 FOC 算法，在新一代洗衣机直驱变频方案中实现更平稳的超低速控制和更低噪声。',
      title: '新一代洗衣机直驱变频方案',
      whitePaperUrl: 'https://example.com/whitepapers/foc-washing-machine.pdf',
    },
    field: 'slug',
    value: 'foc-washing-machine',
  })

  await upsertByField({
    collection: 'case-studies',
    data: {
      content: plainTextToLexical(
        '整合合作伙伴的轻量级 NLP 模型，在低成本 MCU 上实现 99% 的离线命令识别率，为智能卫浴产品提供免联网语音交互能力。',
      ),
      coverImage: caseCoverB.id,
      domain: 'home-appliance',
      partnerName: 'Partner B (AI Startup)',
      publishedAt: '2026-02-06T10:00:00.000Z',
      slug: 'offline-voice-module',
      summary: '借助轻量级 NLP 模型和 H&T 平台算法，在低成本 MCU 平台实现高识别率离线语音交互。',
      title: '低成本离线语音控制模组',
      whitePaperUrl: 'https://example.com/whitepapers/offline-voice-module.pdf',
    },
    field: 'slug',
    value: 'offline-voice-module',
  })

  await upsertByField({
    collection: 'proposals',
    data: {
      contactCompany: partner.company,
      contactEmail: partner.email,
      contactName: partner.name,
      description: plainTextToLexical(
        '提出基于新型散热腔体与铜柱封装结构的高功率 MOSFET 电调方案。',
      ),
      reviewNotes: plainTextToLexical('建议进入 PoC 阶段，补充热仿真与小批测试数据。'),
      reviewedBy: reviewer.id,
      status: 'reviewing',
      submittedBy: partner.id,
      title: '工业无人机高功率电调散热封装方案',
      type: 'specific-need',
    },
    field: 'title',
    value: '工业无人机高功率电调散热封装方案',
  })

  await upsertByField({
    collection: 'proposals',
    data: {
      contactCompany: partner.company,
      contactEmail: partner.email,
      contactName: partner.name,
      description: plainTextToLexical('提供 Matter 1.3 双模模组方案，待机功耗可进一步优化 22%。'),
      reviewNotes: plainTextToLexical('技术方向契合度高，建议推进样件验证。'),
      reviewedBy: reviewer.id,
      status: 'approved',
      submittedBy: partner.id,
      title: 'Matter 双模低功耗连接模组方案',
      type: 'open-proposal',
    },
    field: 'title',
    value: 'Matter 双模低功耗连接模组方案',
  })

  payload.logger.info(
    `Seed completed. Admin=${admin.email} Reviewer=${reviewer.email} Partner=${partner.email}`,
  )
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
