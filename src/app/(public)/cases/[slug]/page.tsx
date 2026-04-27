import Link from 'next/link'
import { notFound } from 'next/navigation'

import { SectionHeading } from '@/components/shared/SectionHeading'
import { getMediaImageURL } from '@/lib/media'
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
  const coverImageURL = getMediaImageURL(coverImage)

  return (
    <div className="container-shell py-16">
      <div className="theme-card overflow-hidden rounded-[1rem]">
        <div
          className="h-72 bg-cover bg-center"
          style={{
            backgroundImage: coverImageURL
              ? `linear-gradient(rgba(2,6,23,0.35), rgba(2,6,23,0.35)), url('${coverImageURL}')`
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
                className="theme-primary-button rounded-md px-6 py-3 text-sm font-semibold"
                href={caseStudy.whitePaperUrl}
                rel="noreferrer"
                target="_blank"
              >
                下载技术白皮书
              </a>
            ) : null}
            <Link
              className="theme-outline-button rounded-md px-6 py-3 text-sm font-semibold"
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
