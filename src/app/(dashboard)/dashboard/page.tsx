import Link from 'next/link'

import { EmptyState } from '@/components/shared/EmptyState'
import { ProposalStatusBadge } from '@/components/shared/StatusBadge'
import { requireUser } from '@/lib/auth'
import { getDashboardMetrics } from '@/lib/data'
import { getPayloadClient } from '@/lib/payload'
import { formatDate } from '@/lib/utils'

export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
  const user = await requireUser()
  const payload = await getPayloadClient()
  const metrics = await getDashboardMetrics(user)

  const proposals = await payload.find({
    collection: 'proposals',
    depth: 1,
    limit: 5,
    overrideAccess: true,
    sort: '-createdAt',
    where:
      user.role === 'admin' || user.role === 'reviewer'
        ? {}
        : {
            submittedBy: {
              equals: user.id,
            },
          },
  })

  const cards = [
    { label: '方案总数', value: metrics.proposalCount },
    { label: '公开需求', value: metrics.needCount },
    { label: '生态伙伴', value: metrics.partnerCount },
    { label: '联合案例', value: metrics.caseCount },
  ]

  return (
    <div className="space-y-8">
      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => (
          <div
            key={card.label}
            className="rounded-[2rem] border border-white/70 bg-white p-6 shadow-lg shadow-slate-200/60"
          >
            <p className="text-sm text-slate-500">{card.label}</p>
            <p className="mt-4 font-display text-5xl font-semibold text-slate-950">{card.value}</p>
          </div>
        ))}
      </div>

      <div className="rounded-[2rem] border border-white/70 bg-white p-6 shadow-lg shadow-slate-200/60">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-semibold text-slate-950">最近方案</h2>
            <p className="mt-2 text-sm text-slate-500">展示最近提交或最近变更状态的方案记录。</p>
          </div>
          <Link className="text-sm font-semibold text-ht-blue" href="/dashboard/proposals">
            查看全部
          </Link>
        </div>

        <div className="mt-6 space-y-4">
          {proposals.docs.length ? (
            proposals.docs.map((proposal) => (
              <div
                key={proposal.id}
                className="flex flex-col gap-3 rounded-[1.5rem] border border-slate-200 p-5 md:flex-row md:items-center md:justify-between"
              >
                <div>
                  <h3 className="text-lg font-semibold text-slate-950">{proposal.title}</h3>
                  <p className="mt-2 text-sm text-slate-500">
                    {proposal.contactCompany} · {formatDate(proposal.createdAt, '刚刚')}
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <ProposalStatusBadge status={proposal.status} />
                  <Link
                    className="text-sm font-semibold text-ht-blue"
                    href={`/dashboard/proposals/${proposal.id}`}
                  >
                    查看详情
                  </Link>
                </div>
              </div>
            ))
          ) : (
            <EmptyState
              description="登录后的方案记录会出现在这里，可继续提交新方案或等待评审流转。"
              title="暂时没有方案记录"
            />
          )}
        </div>
      </div>
    </div>
  )
}
