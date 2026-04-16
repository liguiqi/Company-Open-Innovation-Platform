import Link from 'next/link'

import { SectionHeading } from '@/components/shared/SectionHeading'
import { getPayloadClient } from '@/lib/payload'
import { formatDate, getCaseDomainLabel } from '@/lib/utils'

export const dynamic = 'force-dynamic'

export default async function CasesPage() {
  const payload = await getPayloadClient()
  const caseStudies = await payload.find({
    collection: 'case-studies',
    depth: 1,
    limit: 100,
    overrideAccess: true,
    sort: '-publishedAt',
  })

  return (
    <div className="container-shell py-16">
      <SectionHeading
        description="平台沉淀了Open Innovation与芯片厂商、算法公司和实验室合作完成的典型联合创新案例，用于展示协同研发和量产导入能力。"
        descriptionClassName="lg:max-w-none lg:whitespace-nowrap"
        eyebrow="Success Stories"
        title="联合创新案例"
      />

      <div className="mt-10 grid gap-8 lg:grid-cols-2">
        {caseStudies.docs.map((item) => {
          const coverImage = typeof item.coverImage === 'number' ? null : item.coverImage

          return (
            <Link
              key={item.id}
              className="theme-card overflow-hidden rounded-[1rem] transition hover:border-[color:var(--ht-border-strong)]"
              href={`/cases/${item.slug}`}
            >
              <div
                className="h-56 bg-cover bg-center"
                style={{
                  backgroundImage: coverImage?.url
                    ? `linear-gradient(rgba(2,6,23,0.35), rgba(2,6,23,0.35)), url('${coverImage.url}')`
                    : 'linear-gradient(135deg, #004098 0%, #00A0E9 100%)',
                }}
              />
              <div className="p-8">
                <p className="text-xs uppercase tracking-[0.35em] text-ht-light-blue">
                  {item.partnerName}
                </p>
                <h2 className="mt-4 text-3xl font-semibold text-[var(--ht-text-primary)]">
                  {item.title}
                </h2>
                <p className="mt-3 text-sm text-[var(--ht-text-muted)]">
                  {getCaseDomainLabel(item.domain)} · {formatDate(item.publishedAt)}
                </p>
                <p className="mt-4 text-sm leading-7 text-[var(--ht-text-secondary)]">
                  {item.summary}
                </p>
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
