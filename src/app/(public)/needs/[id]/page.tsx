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
      <div className="rounded-[2.5rem] border border-white/70 bg-white p-10 shadow-2xl shadow-slate-200/70">
        <div className="flex flex-wrap items-center gap-4">
          <NeedPriorityBadge priority={need.priority} />
          <span className="text-sm font-mono text-slate-400">{need.needId}</span>
          <span className="text-sm text-slate-400">{getNeedDomainLabel(need.domain)}</span>
          <span className="text-sm text-slate-400">发布日期：{formatDate(need.publishedAt)}</span>
        </div>

        <h1 className="mt-6 font-display text-5xl font-semibold text-slate-950">{need.title}</h1>
        <p className="mt-4 text-lg text-slate-500">{need.productLine || '开放技术方向'}</p>

        <div className="prose-innovation mt-8 whitespace-pre-line text-base">
          {lexicalToPlainText(need.description)}
        </div>

        <div className="mt-10 flex flex-wrap gap-4">
          <Link
            className="rounded-full bg-ht-blue px-6 py-3 text-sm font-semibold text-white transition hover:bg-slate-950"
            href={`/submit?need=${need.id}`}
          >
            针对该需求提交方案
          </Link>
          <Link
            className="rounded-full border border-slate-200 px-6 py-3 text-sm font-semibold text-slate-700 transition hover:border-ht-blue hover:text-ht-blue"
            href="/needs"
          >
            返回需求大厅
          </Link>
        </div>
      </div>
    </div>
  )
}
