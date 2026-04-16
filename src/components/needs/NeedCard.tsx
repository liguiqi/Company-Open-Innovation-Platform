import Link from 'next/link'

import type { TechNeed } from '@/payload-types'

import { NeedPriorityBadge } from '@/components/shared/StatusBadge'
import { getNeedDomainLabel } from '@/lib/utils'
import { lexicalToPlainText } from '@/lib/richtext'

export function NeedCard({ need }: { need: TechNeed }) {
  return (
    <article className="theme-card group rounded-[1rem] p-6 transition hover:border-[color:var(--ht-border-strong)]">
      <div className="flex flex-wrap items-center gap-3">
        <NeedPriorityBadge priority={need.priority} />
        <span className="text-xs font-mono text-[var(--ht-text-muted)]">{need.needId}</span>
        {need.productLine ? (
          <span className="text-xs text-[var(--ht-text-muted)]">| {need.productLine}</span>
        ) : null}
      </div>

      <h3 className="mt-4 text-2xl font-semibold text-[var(--ht-text-primary)] transition group-hover:text-ht-blue">
        {need.title}
      </h3>
      <p className="mt-3 text-sm text-[var(--ht-text-muted)]">{getNeedDomainLabel(need.domain)}</p>
      <p className="mt-4 line-clamp-3 text-sm leading-7 text-[var(--ht-text-secondary)]">
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
          className="rounded-md border border-ht-light-blue px-4 py-2 text-sm font-semibold text-ht-light-blue transition hover:bg-[var(--ht-hover-soft)]"
          href={`/submit?need=${need.id}`}
        >
          提交方案
        </Link>
      </div>
    </article>
  )
}
