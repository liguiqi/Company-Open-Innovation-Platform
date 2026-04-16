import { SectionHeading } from '@/components/shared/SectionHeading'
import { getPayloadClient } from '@/lib/payload'
import { getPartnerCategoryLabel } from '@/lib/utils'
import { partnerCategoryMap, partnerTierMap } from '@/lib/constants'

export const dynamic = 'force-dynamic'

export default async function EcosystemPage() {
  const payload = await getPayloadClient()
  const partners = await payload.find({
    collection: 'partners',
    depth: 1,
    limit: 100,
    overrideAccess: true,
    sort: 'sortOrder',
  })

  return (
    <div className="container-shell py-16">
      <SectionHeading
        align="center"
        description="加入Open Innovation供应链生态，您的技术将进入从需求澄清、联合评估到 PoC 验证和导入量产的完整通道。"
        eyebrow="Ecosystem"
        title="HeT 全球合作伙伴联盟"
      />

      <div className="mt-10 grid gap-4 md:grid-cols-4">
        {Object.entries(partnerCategoryMap).map(([value, label]) => (
          <div key={value} className="theme-card rounded-[1rem] p-6 text-center">
            <p className="text-xs uppercase tracking-[0.35em] text-ht-light-blue">Category</p>
            <h3 className="mt-4 text-lg font-semibold text-[var(--ht-text-primary)]">{label}</h3>
          </div>
        ))}
      </div>

      <div className="mt-10 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {partners.docs.map((partner) => (
          <article key={partner.id} className="theme-card rounded-[1rem] p-6">
            <p className="text-xs uppercase tracking-[0.35em] text-ht-light-blue">
              {getPartnerCategoryLabel(partner.category)}
            </p>
            <h3 className="mt-4 text-2xl font-semibold text-[var(--ht-text-primary)]">
              {partner.name}
            </h3>
            <p className="mt-2 text-sm font-medium text-[var(--ht-text-muted)]">
              {partnerTierMap[partner.tier]}
            </p>
            <p className="mt-4 text-sm leading-7 text-[var(--ht-text-secondary)]">
              {partner.description || partner.products}
            </p>
            {partner.website ? (
              <a
                className="mt-5 inline-flex text-sm font-semibold text-ht-blue"
                href={partner.website}
                rel="noreferrer"
                target="_blank"
              >
                访问官网
              </a>
            ) : null}
          </article>
        ))}
      </div>
    </div>
  )
}
