import Link from 'next/link'

import { PartnerLogoCard, type DisplayPartnerRecord } from '@/components/partners/PartnerLogoWall'
import { SectionHeading } from '@/components/shared/SectionHeading'
import {
  getDisplayPartners,
  groupPartnersByTier,
  partnerDirectoryRoute,
} from '@/lib/partner-branding'
import { getPayloadClient } from '@/lib/payload'

export const dynamic = 'force-dynamic'

export default async function EcosystemPage() {
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
  )
  const strategicGroup = groupedPartners.find((group) => group.tier === 'strategic')

  return (
    <div className="container-shell py-16">
      <SectionHeading
        align="center"
        description="加入Open Innovation全球创新生态，与产业领袖们协同进化，您的卓越技术将获得从概念验证到规模商用的完整价值通路。"
        descriptionClassName="lg:max-w-none lg:whitespace-nowrap"
        eyebrow="Ecosystem"
        title="Open Innovation全球合作伙伴联盟"
      />

      {strategicGroup?.partners.length ? (
        <section className="mt-12 space-y-5" id="strategic-partners">
          <div className="flex items-center gap-3">
            <span className="h-6 w-1 rounded-full bg-ht-blue" />
            <h3 className="text-2xl font-semibold text-[var(--oip-text-primary)]">
              {strategicGroup.meta.title}
              <span className="ml-2 text-lg font-medium text-[var(--oip-text-muted)]">
                ({strategicGroup.meta.subtitle})
              </span>
            </h3>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
            {strategicGroup.partners.map((partner) => (
              <PartnerLogoCard key={`${strategicGroup.tier}-${partner.id}`} partner={partner} />
            ))}
          </div>
        </section>
      ) : null}

      <div className="mt-10 flex justify-center">
        <Link
          className="inline-flex items-center gap-2 whitespace-nowrap text-base font-semibold text-ht-blue transition hover:text-ht-light-blue"
          href={partnerDirectoryRoute}
        >
          查看全部合作伙伴
          <span aria-hidden="true" className="text-xl leading-none">
            ›
          </span>
        </Link>
      </div>
    </div>
  )
}
