import Link from 'next/link'

import { EmptyState } from '@/components/shared/EmptyState'
import { ProposalStatusBadge } from '@/components/shared/StatusBadge'
import { requireUser } from '@/lib/auth'
import { proposalTypeMap } from '@/lib/constants'
import { getPayloadClient } from '@/lib/payload'
import { formatDate } from '@/lib/utils'

export const dynamic = 'force-dynamic'

export default async function ProposalsPage() {
  const user = await requireUser()
  const payload = await getPayloadClient()
  const proposals = await payload.find({
    collection: 'proposals',
    depth: 2,
    limit: 100,
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

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-3xl font-semibold text-slate-950">方案管理</h2>
          <p className="mt-2 text-sm text-slate-500">
            {user.role === 'admin' || user.role === 'reviewer'
              ? '查看并处理全量方案记录。'
              : '查看您已提交的方案、附件和评审状态。'}
          </p>
        </div>
        <Link
          className="rounded-full bg-ht-blue px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-950"
          href="/dashboard/proposals/new"
        >
          提交新方案
        </Link>
      </div>

      {proposals.docs.length ? (
        <div className="space-y-4">
          {proposals.docs.map((proposal) => (
            <div
              key={proposal.id}
              className="rounded-[2rem] border border-white/70 bg-white p-6 shadow-lg shadow-slate-200/60"
            >
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <h3 className="text-2xl font-semibold text-slate-950">{proposal.title}</h3>
                  <p className="mt-2 text-sm text-slate-500">
                    {proposalTypeMap[proposal.type]} · {proposal.contactCompany} · 提交时间{' '}
                    {formatDate(proposal.createdAt)}
                  </p>
                </div>
                <ProposalStatusBadge status={proposal.status} />
              </div>

              <div className="mt-5 flex flex-wrap gap-4 text-sm text-slate-500">
                <span>联系人：{proposal.contactName}</span>
                <span>邮箱：{proposal.contactEmail}</span>
                {proposal.relatedNeed && typeof proposal.relatedNeed !== 'number' ? (
                  <span>关联需求：{proposal.relatedNeed.title}</span>
                ) : null}
              </div>

              <div className="mt-5">
                <Link
                  className="text-sm font-semibold text-ht-blue"
                  href={`/dashboard/proposals/${proposal.id}`}
                >
                  查看详情
                </Link>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState
          description="当前账号尚未产生可查看的方案记录。可先浏览公开需求，再创建第一条方案。"
          title="暂无方案"
        />
      )}
    </div>
  )
}
