import type { Media } from '@/payload-types'

import { partnerCategoryMap } from './constants'
import { getMediaImageURL } from './media'

export type PartnerTier = 'strategic' | 'certified' | 'ecosystem' | 'other'

export type DisplayPartnerRecord = {
  id: number | string
  name: string
  brandPreset?: string | null
  category: string
  description?: string | null
  logo?: Pick<Media, 'alt' | 'id' | 'url'> | number | null
  products?: string | null
  sortOrder?: number | null
  tier: PartnerTier | string
  website?: string | null
}

type BrandProfile = {
  aliases: string[]
  fontSize: number
  fontWeight?: number
  italic?: boolean
  key: string
  label: string
  letterSpacing?: number
  secondaryFontSize?: number
  secondaryLabel?: string
}

type MockPartnerSeed = Omit<DisplayPartnerRecord, 'id' | 'logo'> & {
  description: string
  products: string
  tier: PartnerTier
}

type TierSectionMeta = {
  subtitle: string
  title: string
}

export const partnerTierOrder: PartnerTier[] = ['strategic', 'certified', 'ecosystem', 'other']

const partnerTierWeight: Record<string, number> = {
  strategic: 0,
  certified: 1,
  ecosystem: 2,
  other: 3,
}

export const partnerTierSections: Record<PartnerTier, TierSectionMeta> = {
  certified: {
    subtitle: 'Certified Partners',
    title: '认证合作伙伴',
  },
  ecosystem: {
    subtitle: 'Ecosystem Partners',
    title: '生态合作伙伴',
  },
  other: {
    subtitle: 'Other Partners',
    title: '其他合作伙伴',
  },
  strategic: {
    subtitle: 'Strategic Partners',
    title: '金牌战略伙伴',
  },
}

export const partnerBrandProfiles: BrandProfile[] = [
  { aliases: ['infineon'], fontSize: 42, fontWeight: 700, key: 'infineon', label: 'Infineon' },
  {
    aliases: ['stmicroelectronics', 'st microelectronics', 'st'],
    fontSize: 46,
    fontWeight: 800,
    italic: true,
    key: 'st',
    label: 'ST',
    letterSpacing: -1,
  },
  { aliases: ['renesas'], fontSize: 42, fontWeight: 700, key: 'renesas', label: 'Renesas' },
  { aliases: ['nxp'], fontSize: 46, fontWeight: 800, key: 'nxp', label: 'NXP' },
  { aliases: ['texas instruments', 'ti'], fontSize: 46, fontWeight: 800, key: 'ti', label: 'TI' },
  {
    aliases: ['nordic semiconductor', 'nordic'],
    fontSize: 42,
    fontWeight: 700,
    key: 'nordic',
    label: 'Nordic',
  },
  { aliases: ['sensirion'], fontSize: 39, fontWeight: 700, key: 'sensirion', label: 'Sensirion' },
  { aliases: ['realtek'], fontSize: 41, fontWeight: 700, key: 'realtek', label: 'Realtek' },
  { aliases: ['melexis'], fontSize: 41, fontWeight: 700, key: 'melexis', label: 'Melexis' },
  {
    aliases: ['uni joint lab', 'uni. joint lab', 'uni'],
    fontSize: 42,
    fontWeight: 800,
    key: 'uni-joint-lab',
    label: 'Uni.',
    secondaryFontSize: 20,
    secondaryLabel: 'Joint Lab',
  },
  {
    aliases: ['electrolux'],
    fontSize: 34,
    fontWeight: 700,
    key: 'electrolux',
    label: 'Electrolux',
  },
  { aliases: ['whirlpool'], fontSize: 35, fontWeight: 700, key: 'whirlpool', label: 'Whirlpool' },
  { aliases: ['bosch'], fontSize: 40, fontWeight: 700, key: 'bosch', label: 'Bosch' },
  { aliases: ['siemens'], fontSize: 38, fontWeight: 700, key: 'siemens', label: 'Siemens' },
  { aliases: ['bsh'], fontSize: 44, fontWeight: 800, key: 'bsh', label: 'BSH' },
  { aliases: ['tti', 'techtronic'], fontSize: 46, fontWeight: 800, key: 'tti', label: 'TTI' },
  {
    aliases: ['arcelik', 'arcelik'],
    fontSize: 37,
    fontWeight: 700,
    key: 'arcelik',
    label: 'Arcelik',
  },
  { aliases: ['haier'], fontSize: 46, fontWeight: 700, key: 'haier', label: 'Haier' },
  { aliases: ['hisense'], fontSize: 37, fontWeight: 700, key: 'hisense', label: 'Hisense' },
  { aliases: ['philips'], fontSize: 41, fontWeight: 700, key: 'philips', label: 'Philips' },
  { aliases: ['robam'], fontSize: 40, fontWeight: 700, key: 'robam', label: 'Robam' },
  { aliases: ['supor'], fontSize: 42, fontWeight: 700, key: 'supor', label: 'SUPOR' },
  { aliases: ['xiaomi', 'mi'], fontSize: 42, fontWeight: 700, key: 'xiaomi', label: 'Xiaomi' },
  {
    aliases: ['borgwarner'],
    fontSize: 31,
    fontWeight: 700,
    key: 'borgwarner',
    label: 'BorgWarner',
  },
  { aliases: ['nidec'], fontSize: 42, fontWeight: 700, key: 'nidec', label: 'Nidec' },
  { aliases: ['byd'], fontSize: 44, fontWeight: 800, key: 'byd', label: 'BYD' },
  { aliases: ['nio'], fontSize: 46, fontWeight: 800, key: 'nio', label: 'NIO' },
  { aliases: ['xpeng', 'xiaopeng'], fontSize: 36, fontWeight: 700, key: 'xpeng', label: 'XPENG' },
  { aliases: ['volvo'], fontSize: 40, fontWeight: 700, key: 'volvo', label: 'Volvo' },
  {
    aliases: ['delonghi', "de'longhi", 'de longhi'],
    fontSize: 34,
    fontWeight: 700,
    key: 'delonghi',
    label: "De'Longhi",
  },
  { aliases: ['panasonic'], fontSize: 34, fontWeight: 700, key: 'panasonic', label: 'Panasonic' },
  { aliases: ['toshiba'], fontSize: 38, fontWeight: 700, key: 'toshiba', label: 'Toshiba' },
]

export const partnerBrandOptions = partnerBrandProfiles.map((profile) => ({
  label: profile.secondaryLabel ? `${profile.label} ${profile.secondaryLabel}` : profile.label,
  value: profile.key,
}))

export const partnerCategoryOptions = Object.entries(partnerCategoryMap).map(([value, label]) => ({
  label,
  value,
}))

export const fallbackStrategicPartners: DisplayPartnerRecord[] = [
  {
    id: 'fallback-infineon',
    name: 'Infineon',
    brandPreset: 'infineon',
    category: 'chip',
    tier: 'strategic',
    website: 'https://www.infineon.com/',
  },
  {
    id: 'fallback-st',
    name: 'ST',
    brandPreset: 'st',
    category: 'chip',
    tier: 'strategic',
    website: 'https://www.st.com/',
  },
  {
    id: 'fallback-renesas',
    name: 'Renesas',
    brandPreset: 'renesas',
    category: 'chip',
    tier: 'strategic',
    website: 'https://www.renesas.com/',
  },
  {
    id: 'fallback-nxp',
    name: 'NXP',
    brandPreset: 'nxp',
    category: 'chip',
    tier: 'strategic',
    website: 'https://www.nxp.com/',
  },
  {
    id: 'fallback-ti',
    name: 'TI',
    brandPreset: 'ti',
    category: 'chip',
    tier: 'strategic',
    website: 'https://www.ti.com/',
  },
  {
    id: 'fallback-nordic',
    name: 'Nordic',
    brandPreset: 'nordic',
    category: 'connectivity',
    tier: 'strategic',
    website: 'https://www.nordicsemi.com/',
  },
  {
    id: 'fallback-sensirion',
    name: 'Sensirion',
    brandPreset: 'sensirion',
    category: 'connectivity',
    tier: 'strategic',
    website: 'https://www.sensirion.com/',
  },
  {
    id: 'fallback-realtek',
    name: 'Realtek',
    brandPreset: 'realtek',
    category: 'chip',
    tier: 'strategic',
    website: 'https://www.realtek.com/',
  },
  {
    id: 'fallback-melexis',
    name: 'Melexis',
    brandPreset: 'melexis',
    category: 'connectivity',
    tier: 'strategic',
    website: 'https://www.melexis.com/',
  },
  {
    id: 'fallback-uni-joint-lab',
    name: 'Uni. Joint Lab',
    brandPreset: 'uni-joint-lab',
    category: 'academia',
    tier: 'strategic',
  },
]

export const partnerMockSeedData: MockPartnerSeed[] = [
  {
    brandPreset: 'infineon',
    category: 'chip',
    description:
      '面向家电与工业控制场景的 MCU / 功率器件生态伙伴样例，用于演示芯片型战略合作厂商目录。',
    name: 'Infineon',
    products: 'MCU, IGBT, MOSFET, Power Modules',
    sortOrder: 10,
    tier: 'strategic',
    website: 'https://www.infineon.com/',
  },
  {
    brandPreset: 'st',
    category: 'chip',
    description: '面向控制器、驱动板与边缘智能模块的芯片伙伴样例，用于演示战略级半导体合作目录。',
    name: 'ST',
    products: 'MCU, MEMS, Power, Wireless',
    sortOrder: 20,
    tier: 'strategic',
    website: 'https://www.st.com/',
  },
  {
    brandPreset: 'renesas',
    category: 'chip',
    description: '面向变频控制、HMI 与多核控制平台的芯片生态伙伴样例。',
    name: 'Renesas',
    products: 'MCU, MPU, Analog, Connectivity',
    sortOrder: 30,
    tier: 'strategic',
    website: 'https://www.renesas.com/',
  },
  {
    brandPreset: 'nxp',
    category: 'chip',
    description: '面向汽车电子、边缘控制与安全连接场景的半导体合作伙伴样例。',
    name: 'NXP',
    products: 'Automotive SoC, MCU, Secure Connectivity',
    sortOrder: 40,
    tier: 'strategic',
    website: 'https://www.nxp.com/',
  },
  {
    brandPreset: 'ti',
    category: 'chip',
    description: '面向电机驱动、电源管理与模拟前端应用的芯片伙伴样例。',
    name: 'TI',
    products: 'Analog, MCU, Power, Driver',
    sortOrder: 50,
    tier: 'strategic',
    website: 'https://www.ti.com/',
  },
  {
    brandPreset: 'nordic',
    category: 'connectivity',
    description: '面向低功耗蓝牙与 IoT 场景的无线连接合作伙伴样例。',
    name: 'Nordic',
    products: 'BLE, Matter, Cellular IoT',
    sortOrder: 60,
    tier: 'strategic',
    website: 'https://www.nordicsemi.com/',
  },
  {
    brandPreset: 'sensirion',
    category: 'connectivity',
    description: '面向环境感知、温湿度与气体检测的传感合作伙伴样例。',
    name: 'Sensirion',
    products: 'Humidity, Flow, Gas, Environmental Sensors',
    sortOrder: 70,
    tier: 'strategic',
    website: 'https://www.sensirion.com/',
  },
  {
    brandPreset: 'realtek',
    category: 'chip',
    description: '面向连接控制、音视频与边缘网关场景的芯片伙伴样例。',
    name: 'Realtek',
    products: 'Wi-Fi, Ethernet, Audio, Gateway SoC',
    sortOrder: 80,
    tier: 'strategic',
    website: 'https://www.realtek.com/',
  },
  {
    brandPreset: 'melexis',
    category: 'connectivity',
    description: '面向车规传感、磁编码与温度测量场景的器件伙伴样例。',
    name: 'Melexis',
    products: 'Magnetic Sensor, Temp Sensor, Automotive IC',
    sortOrder: 90,
    tier: 'strategic',
    website: 'https://www.melexis.com/',
  },
  {
    brandPreset: 'uni-joint-lab',
    category: 'academia',
    description: '面向联合评估、算法验证与产学研协同研发的实验室合作样例。',
    name: 'Uni. Joint Lab',
    products: 'Joint Research, PoC Validation, Applied Lab',
    sortOrder: 100,
    tier: 'strategic',
  },
  {
    brandPreset: 'electrolux',
    category: 'home-appliance-brand',
    description: '公开资料可见的海外家电品牌客户样例，用于演示洗护与厨电控制器客户目录。',
    name: 'Electrolux',
    products: 'Laundry, Kitchen Appliances, Climate Control',
    sortOrder: 210,
    tier: 'certified',
    website: 'https://www.electroluxgroup.com/',
  },
  {
    brandPreset: 'whirlpool',
    category: 'home-appliance-brand',
    description: '公开资料可见的海外家电品牌客户样例，用于演示白电控制器合作目录。',
    name: 'Whirlpool',
    products: 'Washing, Refrigeration, Cooking Appliances',
    sortOrder: 220,
    tier: 'certified',
    website: 'https://www.whirlpoolcorp.com/',
  },
  {
    brandPreset: 'bosch',
    category: 'home-appliance-brand',
    description: '公开资料可见的欧洲家电品牌客户样例，用于演示高端家电控制项目。',
    name: 'Bosch',
    products: 'Kitchen Appliances, Cleaning, Thermal Control',
    sortOrder: 230,
    tier: 'certified',
    website: 'https://www.bsh-group.com/brands/bosch',
  },
  {
    brandPreset: 'siemens',
    category: 'home-appliance-brand',
    description: '公开资料可见的欧洲家电品牌客户样例，用于演示高端厨房与洗护控制产品。',
    name: 'Siemens',
    products: 'Laundry, Kitchen, Built-in Appliances',
    sortOrder: 240,
    tier: 'certified',
    website: 'https://www.bsh-group.com/brands/siemens',
  },
  {
    brandPreset: 'bsh',
    category: 'home-appliance-brand',
    description: '公开资料可见的国际家电集团客户样例，用于演示全球化客户结构。',
    name: 'BSH',
    products: 'Home Appliances Group, Embedded Control',
    sortOrder: 250,
    tier: 'certified',
    website: 'https://www.bsh-group.com/',
  },
  {
    brandPreset: 'tti',
    category: 'tool-industrial-brand',
    description: '公开资料可见的电动工具客户样例，用于演示无刷驱动与电池管理合作目录。',
    name: 'TTI',
    products: 'Power Tools, Battery Systems, Motor Drive',
    sortOrder: 260,
    tier: 'certified',
    website: 'https://www.ttigroup.com/',
  },
  {
    brandPreset: 'arcelik',
    category: 'home-appliance-brand',
    description: '公开资料可见的海外家电集团客户样例，用于演示欧洲与新兴市场白电项目。',
    name: 'Arcelik',
    products: 'White Goods, Kitchen Appliances, Smart Control',
    sortOrder: 270,
    tier: 'certified',
    website: 'https://www.arcelikglobal.com/',
  },
  {
    brandPreset: 'haier',
    category: 'home-appliance-brand',
    description: '公开资料可见的国内头部家电品牌客户样例，用于演示大家电控制器项目。',
    name: 'Haier',
    products: 'White Goods, Smart Home, Refrigeration',
    sortOrder: 280,
    tier: 'certified',
    website: 'https://www.haier.com/global/',
  },
  {
    brandPreset: 'hisense',
    category: 'home-appliance-brand',
    description: '公开资料可见的国内家电与显示品牌客户样例，用于演示多品类智能控制项目。',
    name: 'Hisense',
    products: 'Home Appliances, Display, Smart Home',
    sortOrder: 290,
    tier: 'certified',
    website: 'https://global.hisense.com/',
  },
  {
    brandPreset: 'philips',
    category: 'smart-product-brand',
    description: '公开资料可见的消费电子与健康类品牌客户样例，用于演示智能产品控制项目。',
    name: 'Philips',
    products: 'Personal Care, Health Devices, Smart Small Appliances',
    sortOrder: 300,
    tier: 'other',
    website: 'https://www.philips.com/',
  },
  {
    brandPreset: 'robam',
    category: 'smart-product-brand',
    description: '公开资料可见的厨电品牌客户样例，用于演示智能厨电控制项目。',
    name: 'Robam',
    products: 'Kitchen Appliances, HMI, Smart Control',
    sortOrder: 310,
    tier: 'other',
    website: 'https://www.robam.com/',
  },
  {
    brandPreset: 'supor',
    category: 'smart-product-brand',
    description: '公开资料可见的小家电品牌客户样例，用于演示智能小电与加热控制项目。',
    name: 'Supor',
    products: 'Small Appliances, Heating Control, Smart Kitchen',
    sortOrder: 320,
    tier: 'other',
    website: 'https://www.supor.com.cn/',
  },
  {
    brandPreset: 'xiaomi',
    category: 'smart-product-brand',
    description: '公开资料可见的智能产品品牌客户样例，用于演示 IoT 控制器与生态设备协同。',
    name: 'Xiaomi',
    products: 'IoT Devices, Smart Home, Consumer Electronics',
    sortOrder: 330,
    tier: 'other',
    website: 'https://www.mi.com/',
  },
  {
    brandPreset: 'delonghi',
    category: 'smart-product-brand',
    description: '公开资料可见的咖啡机与小家电品牌客户样例，用于演示高端小家电控制项目。',
    name: "De'Longhi",
    products: 'Coffee Machine, Kitchen Appliances, Heating Control',
    sortOrder: 340,
    tier: 'other',
    website: 'https://www.delonghigroup.com/',
  },
  {
    brandPreset: 'panasonic',
    category: 'smart-product-brand',
    description: '公开资料可见的消费电子与家电品牌客户样例，用于演示多品类智能控制产品。',
    name: 'Panasonic',
    products: 'Home Appliances, Consumer Electronics, Smart Control',
    sortOrder: 350,
    tier: 'other',
    website: 'https://www.panasonic.com/',
  },
  {
    brandPreset: 'toshiba',
    category: 'home-appliance-brand',
    description: '公开资料可见的家电品牌客户样例，用于演示制冷与白电控制目录。',
    name: 'Toshiba',
    products: 'White Goods, Refrigeration, Embedded Control',
    sortOrder: 360,
    tier: 'other',
    website: 'https://www.global.toshiba/',
  },
  {
    brandPreset: 'borgwarner',
    category: 'automotive-brand',
    description: '公开资料可见的汽车电子与动力系统客户样例，用于演示车载控制项目。',
    name: 'BorgWarner',
    products: 'Automotive Electronics, Thermal Systems, eDrive',
    sortOrder: 410,
    tier: 'ecosystem',
    website: 'https://www.borgwarner.com/',
  },
  {
    brandPreset: 'nidec',
    category: 'automotive-brand',
    description: '公开资料可见的电机与汽车零部件客户样例，用于演示驱动与执行器控制项目。',
    name: 'Nidec',
    products: 'Motor, Actuator, Automotive Electronics',
    sortOrder: 420,
    tier: 'ecosystem',
    website: 'https://www.nidec.com/',
  },
  {
    brandPreset: 'byd',
    category: 'automotive-brand',
    description: '公开资料可见的国内新能源车客户样例，用于演示车身与热管理控制项目。',
    name: 'BYD',
    products: 'EV Electronics, Body Control, Thermal Control',
    sortOrder: 430,
    tier: 'ecosystem',
    website: 'https://www.byd.com/',
  },
  {
    brandPreset: 'nio',
    category: 'automotive-brand',
    description: '公开资料可见的新能源车客户样例，用于演示座舱与车身域控制项目。',
    name: 'NIO',
    products: 'Cockpit Control, Seat Control, Automotive Electronics',
    sortOrder: 440,
    tier: 'ecosystem',
    website: 'https://www.nio.com/',
  },
  {
    brandPreset: 'xpeng',
    category: 'automotive-brand',
    description: '公开资料可见的智能汽车客户样例，用于演示车身与智能控制模块项目。',
    name: 'XPENG',
    products: 'Vehicle Control, Smart Cabin, Automotive Modules',
    sortOrder: 450,
    tier: 'ecosystem',
    website: 'https://www.xiaopeng.com/',
  },
  {
    brandPreset: 'volvo',
    category: 'automotive-brand',
    description: '公开资料可见的国际汽车品牌客户样例，用于演示汽车电子项目目录。',
    name: 'Volvo',
    products: 'Automotive Electronics, Body Control, Safety Comfort',
    sortOrder: 460,
    tier: 'ecosystem',
    website: 'https://www.volvocars.com/',
  },
]

export function normalizePartnerTier(tier?: string | null): PartnerTier {
  switch (tier) {
    case 'strategic':
      return 'strategic'
    case 'certified':
      return 'certified'
    case 'other':
      return 'other'
    case 'general':
    case 'ecosystem':
      return 'ecosystem'
    default:
      return 'other'
  }
}

export function normalizePartnerName(name: string) {
  return name
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(
      /\b(semiconductor|semiconductors|electronics|technology|technologies|corp|corporation|inc|co|ltd|limited|group|global|home|appliances)\b/g,
      ' ',
    )
    .replace(/\s+/g, ' ')
    .trim()
}

export function resolvePartnerBrandProfile({
  brandPreset,
  name,
}: {
  brandPreset?: string | null
  name: string
}) {
  const normalized = normalizePartnerName(name)
  const exactPreset = brandPreset
    ? partnerBrandProfiles.find((profile) => profile.key === brandPreset)
    : undefined

  if (exactPreset) {
    return exactPreset
  }

  const aliasPreset = partnerBrandProfiles.find((profile) =>
    profile.aliases.some((alias) => normalized.includes(alias)),
  )

  if (aliasPreset) {
    return aliasPreset
  }

  const words = name.replace(/\s+/g, ' ').trim().split(' ').filter(Boolean)
  const primary = words.slice(0, 2).join(' ').slice(0, 16) || 'Partner'
  const secondary = words.length > 2 ? words.slice(2, 5).join(' ').slice(0, 18) : undefined

  return {
    aliases: [],
    fontSize: primary.length >= 12 ? 34 : 40,
    fontWeight: 700,
    key: normalized || 'partner',
    label: primary,
    secondaryFontSize: secondary ? 20 : undefined,
    secondaryLabel: secondary,
  }
}

export function getPartnerLogoMedia(logo?: DisplayPartnerRecord['logo']) {
  if (logo && typeof logo === 'object') {
    const url = getMediaImageURL(logo)

    if (url) {
      return {
        ...logo,
        url,
      }
    }
  }

  return null
}

export function sortPartnersForDisplay<
  T extends Pick<DisplayPartnerRecord, 'name' | 'sortOrder' | 'tier'>,
>(partners: T[]) {
  return [...partners].sort((left, right) => {
    const tierDelta =
      (partnerTierWeight[normalizePartnerTier(left.tier)] ?? 99) -
      (partnerTierWeight[normalizePartnerTier(right.tier)] ?? 99)

    if (tierDelta !== 0) {
      return tierDelta
    }

    const sortDelta = (left.sortOrder ?? 9999) - (right.sortOrder ?? 9999)
    if (sortDelta !== 0) {
      return sortDelta
    }

    return left.name.localeCompare(right.name, 'en')
  })
}

export function getDisplayPartners(partners: DisplayPartnerRecord[], limit?: number) {
  const source = partners.length ? sortPartnersForDisplay(partners) : fallbackStrategicPartners

  if (typeof limit === 'number') {
    return source.slice(0, limit)
  }

  return source
}

export function getDisplayPartnersByTier(
  partners: DisplayPartnerRecord[],
  tier: PartnerTier,
  limit?: number,
) {
  const source = getDisplayPartners(partners).filter(
    (partner) => normalizePartnerTier(partner.tier) === tier,
  )

  if (typeof limit === 'number') {
    return source.slice(0, limit)
  }

  return source
}

export function groupPartnersByTier(partners: DisplayPartnerRecord[]) {
  const source = sortPartnersForDisplay(partners)

  return partnerTierOrder.map((tier) => ({
    meta: partnerTierSections[tier],
    partners: source.filter((partner) => normalizePartnerTier(partner.tier) === tier),
    tier,
  }))
}

export const partnerDirectoryRoute = '/ecosystem/directory'
