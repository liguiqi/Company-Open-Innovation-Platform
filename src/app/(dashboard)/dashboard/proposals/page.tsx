import Link from 'next/link'

import { EmptyState } from '@/components/shared/EmptyState'
import { NeedStatusBadge, ProposalStatusBadge } from '@/components/shared/StatusBadge'
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
          <h2 className="theme-page-title text-3xl font-semibold">方案管理</h2>
          <p className="theme-page-description mt-2 text-sm">
            {user.role === 'admin' || user.role === 'reviewer'
              ? '查看并处理全量方案记录。'
              : '查看您已提交的方案、附件和评审状态。'}
          </p>
        </div>
        <Link
          className="theme-primary-button rounded-md px-5 py-3 text-sm font-semibold"
          href="/dashboard/proposals/new"
        >
          提交新方案
        </Link>
      </div>

      {proposals.docs.length ? (
        <div className="space-y-4">
          {proposals.docs.map((proposal) => (
            <div key={proposal.id} className="theme-dashboard-panel rounded-[1rem] p-6">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <h3 className="text-2xl font-semibold text-[var(--oip-text-primary)]">
                    {proposal.title}
                  </h3>
                  <p className="mt-2 text-sm text-[var(--oip-text-muted)]">
                    {proposalTypeMap[proposal.type]} · {proposal.contactCompany} · 提交时间{' '}
                    {formatDate(proposal.createdAt)}
                  </p>
                </div>
                <ProposalStatusBadge status={proposal.status} />
              </div>

              <div className="mt-5 flex flex-wrap gap-4 text-sm text-[var(--oip-text-muted)]">
                <span>联系人：{proposal.contactName}</span>
                <span>邮箱：{proposal.contactEmail}</span>
                {proposal.relatedNeed && typeof proposal.relatedNeed !== 'number' ? (
                  <span className="flex flex-wrap items-center gap-2">
                    <span>关联需求：{proposal.relatedNeed.title}</span>
                    <NeedStatusBadge status={proposal.relatedNeed.status} />
                  </span>
                ) : null}
              </div>

              <div className="mt-5">
                <Link
                  className="text-sm font-semibold text-ht-light-blue"
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
