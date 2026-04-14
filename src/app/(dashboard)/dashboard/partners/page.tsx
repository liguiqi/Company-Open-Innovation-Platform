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
        <h2 className="text-3xl font-semibold text-slate-950">伙伴管理</h2>
        <p className="mt-2 text-sm text-slate-500">
          这里提供运营视图，详细字段维护可进入 `/admin/collections/partners`。
        </p>
      </div>
      <div className="grid gap-5 md:grid-cols-2">
        {partners.docs.map((partner) => (
          <article
            key={partner.id}
            className="rounded-[2rem] border border-white/70 bg-white p-6 shadow-lg shadow-slate-200/60"
          >
            <h3 className="text-2xl font-semibold text-slate-950">{partner.name}</h3>
            <p className="mt-3 text-sm text-slate-500">
              {getPartnerCategoryLabel(partner.category)} · {partnerTierMap[partner.tier]}
            </p>
            <p className="mt-4 text-sm leading-7 text-slate-600">
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
