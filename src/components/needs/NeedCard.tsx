import Link from 'next/link'

import type { TechNeed } from '@/payload-types'

import { NeedPriorityBadge } from '@/components/shared/StatusBadge'
import { getNeedDomainLabel } from '@/lib/utils'
import { lexicalToPlainText } from '@/lib/richtext'

export function NeedCard({ need }: { need: TechNeed }) {
  return (
    <article className="group rounded-[2rem] border border-white/70 bg-white p-6 shadow-lg shadow-slate-200/60 transition hover:-translate-y-1 hover:shadow-2xl">
      <div className="flex flex-wrap items-center gap-3">
        <NeedPriorityBadge priority={need.priority} />
        <span className="text-xs font-mono text-slate-400">{need.needId}</span>
        {need.productLine ? (
          <span className="text-xs text-slate-400">| {need.productLine}</span>
        ) : null}
      </div>

      <h3 className="mt-4 text-2xl font-semibold text-slate-950 transition group-hover:text-ht-blue">
        {need.title}
      </h3>
      <p className="mt-3 text-sm text-slate-500">{getNeedDomainLabel(need.domain)}</p>
      <p className="mt-4 line-clamp-3 text-sm leading-7 text-slate-600">
        {lexicalToPlainText(need.description)}
      </p>

      <div className="mt-6 flex items-center justify-between">
        <Link
          className="text-sm font-semibold text-ht-blue hover:text-ht-light-blue"
          href={`/needs/${need.needId}`}
        >
          查看详情
        </Link>
        <Link
          className="rounded-full border border-ht-light-blue px-4 py-2 text-sm font-semibold text-ht-light-blue transition hover:bg-sky-50"
          href={`/submit?need=${need.id}`}
        >
          提交方案
        </Link>
      </div>
    </article>
  )
}
