import Link from 'next/link'
import { notFound } from 'next/navigation'

import { ProposalReviewForm } from '@/components/proposals/ProposalReviewForm'
import { ProposalReviewTimeline } from '@/components/proposals/ProposalReviewTimeline'
import { NeedStatusBadge, ProposalStatusBadge } from '@/components/shared/StatusBadge'
import { requireUser } from '@/lib/auth'
import { proposalTypeMap } from '@/lib/constants'
import { getPayloadClient } from '@/lib/payload'
import { buildProposalTimeline } from '@/lib/proposal-review-timeline'
import { lexicalToPlainText } from '@/lib/richtext'
import { formatDate } from '@/lib/utils'

export const dynamic = 'force-dynamic'

export default async function ProposalDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser()
  const { id } = await params
  const payload = await getPayloadClient()
  const proposal = await payload.findByID({
    id,
    collection: 'proposals',
    depth: 3,
    overrideAccess: true,
  })

  if (
    !proposal ||
    (user.role === 'partner' &&
      ((typeof proposal.submittedBy === 'number' && proposal.submittedBy !== user.id) ||
        (typeof proposal.submittedBy !== 'number' && proposal.submittedBy?.id !== user.id)))
  ) {
    notFound()
  }

  const attachments = Array.isArray(proposal.attachments)
    ? proposal.attachments.filter((item) => typeof item !== 'number')
    : []
  const reviewNotesText = proposal.reviewNotes ? lexicalToPlainText(proposal.reviewNotes) : ''
  const reviewTimeline = buildProposalTimeline(proposal)
  const reviewFormKey = `${proposal.id}-${proposal.status || 'pending'}-${reviewNotesText}`

  return (
    <div className="space-y-6">
      <div className="theme-dashboard-panel rounded-[1rem] p-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.35em] text-ht-light-blue">
              {proposalTypeMap[proposal.type]}
            </p>
            <h2 className="mt-3 text-4xl font-semibold text-[var(--oip-text-primary)]">
              {proposal.title}
            </h2>
          </div>
          <ProposalStatusBadge status={proposal.status} />
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div className="theme-dashboard-panel-soft rounded-[0.75rem] p-4">
            <p className="text-xs uppercase tracking-[0.3em] text-[var(--oip-text-muted)]">联系人</p>
            <p className="mt-2 text-sm font-medium text-[var(--oip-text-primary)]">
              {proposal.contactName}
            </p>
          </div>
          <div className="theme-dashboard-panel-soft rounded-[0.75rem] p-4">
            <p className="text-xs uppercase tracking-[0.3em] text-[var(--oip-text-muted)]">邮箱</p>
            <p className="mt-2 text-sm font-medium text-[var(--oip-text-primary)]">
              {proposal.contactEmail}
            </p>
          </div>
          <div className="theme-dashboard-panel-soft rounded-[0.75rem] p-4">
            <p className="text-xs uppercase tracking-[0.3em] text-[var(--oip-text-muted)]">公司</p>
            <p className="mt-2 text-sm font-medium text-[var(--oip-text-primary)]">
              {proposal.contactCompany}
            </p>
          </div>
          <div className="theme-dashboard-panel-soft rounded-[0.75rem] p-4">
            <p className="text-xs uppercase tracking-[0.3em] text-[var(--oip-text-muted)]">
              提交时间
            </p>
            <p className="mt-2 text-sm font-medium text-[var(--oip-text-primary)]">
              {formatDate(proposal.createdAt)}
            </p>
          </div>
        </div>

        <div className="mt-8 space-y-8">
          <section>
            <h3 className="text-xl font-semibold text-[var(--oip-text-primary)]">技术描述</h3>
            <p className="mt-3 whitespace-pre-line text-sm leading-8 text-[var(--oip-text-secondary)]">
              {lexicalToPlainText(proposal.description)}
            </p>
          </section>

          {proposal.relatedNeed && typeof proposal.relatedNeed !== 'number' ? (
            <section>
              <h3 className="text-xl font-semibold text-[var(--oip-text-primary)]">关联需求</h3>
              <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-[var(--oip-text-secondary)]">
                <p>{proposal.relatedNeed.title}</p>
                <NeedStatusBadge status={proposal.relatedNeed.status} />
              </div>
              <Link
                className="mt-2 inline-flex text-sm font-semibold text-ht-light-blue"
                href={`/needs/${proposal.relatedNeed.needId}`}
              >
                查看需求详情
              </Link>
            </section>
          ) : null}

          <section>
            <h3 className="text-xl font-semibold text-[var(--oip-text-primary)]">附件</h3>
            <div className="mt-3 flex flex-wrap gap-3">
              {attachments.length ? (
                attachments.map((item) => (
                  <a
                    key={item.id}
                    className="theme-file-link rounded-md px-4 py-2 text-sm font-medium"
                    download={item.filename || true}
                    href={`/api/attachments/${item.id}`}
                  >
                    {item.filename}
                  </a>
                ))
              ) : (
                <p className="text-sm text-[var(--oip-text-muted)]">当前没有上传附件。</p>
              )}
            </div>
          </section>

          <section>
            <h3 className="text-xl font-semibold text-[var(--oip-text-primary)]">
              评审意见与状态流转
            </h3>
            <p className="mt-3 text-sm leading-8 text-[var(--oip-text-secondary)]">
              从提案提交开始，按时间顺序记录每次状态流转、评审意见和操作人员。
            </p>
            <div className="mt-4">
              <ProposalReviewTimeline entries={reviewTimeline} />
            </div>
          </section>
        </div>
      </div>

      {(user.role === 'admin' || user.role === 'reviewer') && (
        <ProposalReviewForm
          defaultNotes={reviewNotesText}
          key={reviewFormKey}
          proposalId={proposal.id}
          status={proposal.status}
        />
      )}
    </div>
  )
}
