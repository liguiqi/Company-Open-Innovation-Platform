import Link from 'next/link'
import { notFound } from 'next/navigation'

import { NeedPriorityBadge } from '@/components/shared/StatusBadge'
import { getPayloadClient } from '@/lib/payload'
import { lexicalToPlainText } from '@/lib/richtext'
import { formatDate, getNeedDomainLabel } from '@/lib/utils'

export const dynamic = 'force-dynamic'

export default async function NeedDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const payload = await getPayloadClient()
  const result = await payload.find({
    collection: 'tech-needs',
    depth: 1,
    limit: 1,
    overrideAccess: true,
    pagination: false,
    where: {
      needId: {
        equals: id,
      },
    },
  })

  const need = result.docs[0]

  if (!need) {
    notFound()
  }

  return (
    <div className="container-shell py-16">
      <div className="theme-card rounded-[1rem] p-10">
        <div className="flex flex-wrap items-center gap-4">
          <NeedPriorityBadge priority={need.priority} />
          <span className="text-sm font-mono text-[var(--ht-text-muted)]">{need.needId}</span>
          <span className="text-sm text-[var(--ht-text-muted)]">
            {getNeedDomainLabel(need.domain)}
          </span>
          <span className="text-sm text-[var(--ht-text-muted)]">
            发布日期：{formatDate(need.publishedAt)}
          </span>
        </div>

        <h1 className="mt-6 font-display text-5xl font-semibold text-[var(--ht-text-primary)]">
          {need.title}
        </h1>
        <p className="mt-4 text-lg text-[var(--ht-text-muted)]">
          {need.productLine || '开放技术方向'}
        </p>

        <div className="prose-innovation mt-8 whitespace-pre-line text-base">
          {lexicalToPlainText(need.description)}
        </div>

        <div className="mt-10 flex flex-wrap gap-4">
          <Link
            className="theme-primary-button rounded-md px-6 py-3 text-sm font-semibold"
            href={`/submit?need=${need.id}`}
          >
            针对该需求提交方案
          </Link>
          <Link
            className="theme-outline-button rounded-md px-6 py-3 text-sm font-semibold"
            href="/needs"
          >
            返回需求大厅
          </Link>
        </div>
      </div>
    </div>
  )
}
