import Link from 'next/link'
import { notFound } from 'next/navigation'

import { SectionHeading } from '@/components/shared/SectionHeading'
import { getPayloadClient } from '@/lib/payload'
import { lexicalToPlainText } from '@/lib/richtext'
import { formatDate, getCaseDomainLabel } from '@/lib/utils'

export const dynamic = 'force-dynamic'

export default async function CaseDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const payload = await getPayloadClient()
  const result = await payload.find({
    collection: 'case-studies',
    depth: 2,
    limit: 1,
    overrideAccess: true,
    pagination: false,
    where: {
      slug: {
        equals: slug,
      },
    },
  })

  const caseStudy = result.docs[0]

  if (!caseStudy) {
    notFound()
  }

  const coverImage = typeof caseStudy.coverImage === 'number' ? null : caseStudy.coverImage

  return (
    <div className="container-shell py-16">
      <div className="overflow-hidden rounded-[2.5rem] border border-white/70 bg-white shadow-2xl shadow-slate-200/70">
        <div
          className="h-72 bg-cover bg-center"
          style={{
            backgroundImage: coverImage?.url
              ? `linear-gradient(rgba(2,6,23,0.35), rgba(2,6,23,0.35)), url('${coverImage.url}')`
              : 'linear-gradient(135deg, #004098 0%, #00A0E9 100%)',
          }}
        />
        <div className="p-10">
          <SectionHeading
            description={`${caseStudy.partnerName} · ${getCaseDomainLabel(caseStudy.domain)} · ${formatDate(caseStudy.publishedAt)}`}
            eyebrow="Case Study"
            title={caseStudy.title}
          />
          <div className="prose-innovation mt-8 whitespace-pre-line">
            {lexicalToPlainText(caseStudy.content)}
          </div>

          <div className="mt-10 flex flex-wrap gap-4">
            {caseStudy.whitePaperUrl ? (
              <a
                className="rounded-full bg-ht-blue px-6 py-3 text-sm font-semibold text-white transition hover:bg-slate-950"
                href={caseStudy.whitePaperUrl}
                rel="noreferrer"
                target="_blank"
              >
                下载技术白皮书
              </a>
            ) : null}
            <Link
              className="rounded-full border border-slate-200 px-6 py-3 text-sm font-semibold text-slate-700 transition hover:border-ht-blue hover:text-ht-blue"
              href="/cases"
            >
              返回案例列表
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
