import Link from 'next/link'

import { NeedCard } from '@/components/needs/NeedCard'
import { EmptyState } from '@/components/shared/EmptyState'
import { SectionHeading } from '@/components/shared/SectionHeading'
import { getPayloadClient } from '@/lib/payload'
import { needDomainMap } from '@/lib/constants'

export const dynamic = 'force-dynamic'

export default async function NeedsPage({
  searchParams,
}: {
  searchParams: Promise<{ domain?: string }>
}) {
  const { domain } = await searchParams
  const payload = await getPayloadClient()
  const needs = await payload.find({
    collection: 'tech-needs',
    depth: 1,
    limit: 50,
    overrideAccess: true,
    sort: '-publishedAt',
    where: domain
      ? {
          domain: {
            equals: domain,
          },
        }
      : {},
  })

  return (
    <div className="container-shell py-16">
      <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
        <SectionHeading
          description="链接全球智慧，共策技术未来。我们期待您的加入，以创新方案开启共创，并肩探索无限可能。"
          eyebrow="Current Needs"
          title="技术需求大厅"
        />
        <Link className="text-sm font-semibold text-ht-blue" href="/submit">
          提交创新方案
        </Link>
      </div>

      <div className="mt-8 flex flex-wrap gap-3">
        <Link
          className={`theme-filter-chip rounded-md px-4 py-2 text-sm font-medium ${!domain ? 'is-active' : ''}`}
          href="/needs"
        >
          全部需求
        </Link>
        {Object.entries(needDomainMap).map(([value, label]) => (
          <Link
            key={value}
            className={`theme-filter-chip rounded-md px-4 py-2 text-sm font-medium ${domain === value ? 'is-active' : ''}`}
            href={`/needs?domain=${value}`}
          >
            {label}
          </Link>
        ))}
      </div>

      <div className="mt-8 grid gap-5">
        {needs.docs.length ? (
          needs.docs.map((need) => <NeedCard key={need.id} need={need} />)
        ) : (
          <EmptyState
            description="当前筛选条件下暂无开放需求，请稍后再来，或直接提交开放式技术自荐方案。"
            title="暂无匹配需求"
          />
        )}
      </div>
    </div>
  )
}
