import { EmptyState } from '@/components/shared/EmptyState'
import { requireRole } from '@/lib/auth'
import { partnerTierMap } from '@/lib/constants'
import { getPayloadClient } from '@/lib/payload'
import { getPartnerCategoryLabel } from '@/lib/utils'

export const dynamic = 'force-dynamic'

export default async function PartnersAdminPage() {
  await requireRole(['admin'])
  const payload = await getPayloadClient()
  const partners = await payload.find({
    collection: 'partners',
    depth: 1,
    limit: 100,
    overrideAccess: true,
    sort: 'sortOrder',
  })

  return partners.docs.length ? (
    <div className="space-y-5">
      <div>
        <h2 className="theme-page-title text-3xl font-semibold">伙伴管理</h2>
        <p className="theme-page-description mt-2 text-sm">
          这里提供运营视图，详细字段维护可进入 `/admin/collections/partners`。
        </p>
      </div>
      <div className="grid gap-5 md:grid-cols-2">
        {partners.docs.map((partner) => (
          <article key={partner.id} className="theme-dashboard-panel rounded-[1rem] p-6">
            <h3 className="text-2xl font-semibold text-[var(--ht-text-primary)]">{partner.name}</h3>
            <p className="mt-3 text-sm text-[var(--ht-text-muted)]">
              {getPartnerCategoryLabel(partner.category)} · {partnerTierMap[partner.tier]}
            </p>
            <p className="mt-4 text-sm leading-7 text-[var(--ht-text-secondary)]">
              {partner.description || partner.products}
            </p>
          </article>
        ))}
      </div>
    </div>
  ) : (
    <EmptyState
      description="后台尚未维护任何伙伴记录，请先通过 Payload Admin 录入。"
      title="暂无伙伴数据"
    />
  )
}
