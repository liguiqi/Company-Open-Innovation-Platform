import { PartnerLogoCard, type DisplayPartnerRecord } from '@/components/partners/PartnerLogoWall'
import { SectionHeading } from '@/components/shared/SectionHeading'
import { getDisplayPartners, groupPartnersByTier } from '@/lib/partner-branding'
import { getPayloadClient } from '@/lib/payload'

export const dynamic = 'force-dynamic'

export default async function PartnerDirectoryPage() {
  const payload = await getPayloadClient()
  const partners = await payload.find({
    collection: 'partners',
    depth: 1,
    limit: 200,
    overrideAccess: true,
    sort: 'sortOrder',
  })

  const groupedPartners = groupPartnersByTier(
    getDisplayPartners(partners.docs as DisplayPartnerRecord[]),
  ).filter((group) => group.partners.length)

  return (
    <div className="container-shell py-16">
      <SectionHeading
        align="center"
        description="加入Open Innovation供应链生态，您的技术将进入从需求澄清、联合评估到 PoC 验证和导入量产的完整通道。平台围绕战略协同、认证合作、生态共建与专项合作持续扩展联合创新网络。"
        eyebrow="Directory"
        title="全部合作伙伴目录"
      />

      <div className="mt-12 space-y-10">
        {groupedPartners.map((group) => (
          <section key={group.tier} className="space-y-5">
            <div className="flex items-center gap-3">
              <span className="h-6 w-1 rounded-full bg-ht-blue" />
              <h3 className="text-2xl font-semibold text-[var(--ht-text-primary)]">
                {group.meta.title}
                <span className="ml-2 text-lg font-medium text-[var(--ht-text-muted)]">
                  ({group.meta.subtitle})
                </span>
              </h3>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
              {group.partners.map((partner) => (
                <PartnerLogoCard key={`${group.tier}-${partner.id}`} partner={partner} />
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  )
}
