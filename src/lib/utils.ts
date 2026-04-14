import { clsx } from 'clsx'
import { format } from 'date-fns'

import { caseDomainMap, needDomainMap, partnerCategoryMap, proposalStatusMap } from './constants'

export function cn(...inputs: Array<string | false | null | undefined>) {
  return clsx(inputs)
}

export function formatDate(value?: string | Date | null, fallback = '未发布') {
  if (!value) {
    return fallback
  }

  return format(new Date(value), 'yyyy-MM-dd')
}

export function getNeedDomainLabel(value?: string | null) {
  return needDomainMap[value || ''] || '未分类'
}

export function getProposalStatusLabel(value?: string | null) {
  return proposalStatusMap[value || ''] || '待处理'
}

export function getPartnerCategoryLabel(value?: string | null) {
  return partnerCategoryMap[value || ''] || '其他'
}

export function getCaseDomainLabel(value?: string | null) {
  return caseDomainMap[value || ''] || '联合创新'
}

export function buildSyntheticEmail(phone: string) {
  return `sms-${phone}@innovation.local`
}

export function buildPhoneOnlyName(phone: string) {
  return `合作伙伴 ${phone.slice(-4)}`
}
