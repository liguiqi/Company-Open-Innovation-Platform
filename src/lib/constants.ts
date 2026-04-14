export const needPriorityMap: Record<string, { badge: string; label: string }> = {
  open: { badge: 'bg-emerald-50 text-emerald-700 border-emerald-200', label: '开放探索' },
  'joint-research': { badge: 'bg-blue-50 text-blue-700 border-blue-200', label: '联合预研' },
  urgent: { badge: 'bg-rose-50 text-rose-700 border-rose-200', label: '急需解决' },
}

export const needDomainMap: Record<string, string> = {
  ai: 'AI 与算法',
  materials: '新材料 / 工艺',
  'motor-control': '电机控制',
  sensor: '传感器技术',
}

export const proposalTypeMap: Record<string, string> = {
  investment: '寻求战略投资',
  'open-proposal': '开放式技术自荐',
  partnership: '申请加入生态联盟',
  'specific-need': '响应公开需求',
}

export const proposalStatusMap: Record<string, string> = {
  approved: '已通过',
  pending: '待评审',
  rejected: '已驳回',
  reviewing: '评审中',
}

export const partnerCategoryMap: Record<string, string> = {
  academia: '产学研机构',
  chip: '核心计算芯片',
  connectivity: '连接与传感',
  power: '功率与电源',
}

export const partnerTierMap: Record<string, string> = {
  certified: '认证伙伴',
  general: '一般伙伴',
  strategic: '金牌战略伙伴',
}

export const caseDomainMap: Record<string, string> = {
  automotive: '汽车电子',
  'home-appliance': '家用电器',
  'power-tool': '电动工具',
}

export const roleLabelMap: Record<string, string> = {
  admin: '管理员',
  partner: '合作伙伴',
  reviewer: '评审员',
  viewer: '访客账号',
}

export const publicStats = [
  { label: '全球顶级客户', value: '50+' },
  { label: '研发工程师', value: '1000+' },
  { label: '生态合作伙伴', value: '300+' },
  { label: '全球基地', value: '15' },
]

export const heroDomains = [
  {
    accent: 'border-ht-blue',
    icon: '🏠',
    title: '家用电器',
    description: '寻找变频控制算法、Matter 1.3 连接模组、HMI 交互与 AI 边缘计算方案。',
  },
  {
    accent: 'border-ht-light-blue',
    icon: '🛠️',
    title: '电动工具',
    description: '关注高功率密度 ESC、无刷电机驱动、电池管理系统与快速充电技术。',
  },
  {
    accent: 'border-emerald-500',
    icon: '🚗',
    title: '汽车电子',
    description: '探索热管理系统、智能座椅控制、车身域控制器与流体控制部件。',
  },
]
