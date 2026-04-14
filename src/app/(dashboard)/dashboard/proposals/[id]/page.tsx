import Link from 'next/link'
import { notFound } from 'next/navigation'

import { ProposalReviewForm } from '@/components/proposals/ProposalReviewForm'
import { ProposalStatusBadge } from '@/components/shared/StatusBadge'
import { requireUser } from '@/lib/auth'
import { proposalTypeMap } from '@/lib/constants'
import { getPayloadClient } from '@/lib/payload'
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

  return (
    <div className="space-y-6">
      <div className="rounded-[2rem] border border-white/70 bg-white p-8 shadow-lg shadow-slate-200/60">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.35em] text-ht-light-blue">
              {proposalTypeMap[proposal.type]}
            </p>
            <h2 className="mt-3 text-4xl font-semibold text-slate-950">{proposal.title}</h2>
          </div>
          <ProposalStatusBadge status={proposal.status} />
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-[1.5rem] bg-slate-50 p-4">
            <p className="text-xs uppercase tracking-[0.3em] text-slate-400">联系人</p>
            <p className="mt-2 text-sm font-medium text-slate-900">{proposal.contactName}</p>
          </div>
          <div className="rounded-[1.5rem] bg-slate-50 p-4">
            <p className="text-xs uppercase tracking-[0.3em] text-slate-400">邮箱</p>
            <p className="mt-2 text-sm font-medium text-slate-900">{proposal.contactEmail}</p>
          </div>
          <div className="rounded-[1.5rem] bg-slate-50 p-4">
            <p className="text-xs uppercase tracking-[0.3em] text-slate-400">公司</p>
            <p className="mt-2 text-sm font-medium text-slate-900">{proposal.contactCompany}</p>
          </div>
          <div className="rounded-[1.5rem] bg-slate-50 p-4">
            <p className="text-xs uppercase tracking-[0.3em] text-slate-400">提交时间</p>
            <p className="mt-2 text-sm font-medium text-slate-900">
              {formatDate(proposal.createdAt)}
            </p>
          </div>
        </div>

        <div className="mt-8 space-y-8">
          <section>
            <h3 className="text-xl font-semibold text-slate-950">技术描述</h3>
            <p className="mt-3 whitespace-pre-line text-sm leading-8 text-slate-600">
              {lexicalToPlainText(proposal.description)}
            </p>
          </section>

          {proposal.relatedNeed && typeof proposal.relatedNeed !== 'number' ? (
            <section>
              <h3 className="text-xl font-semibold text-slate-950">关联需求</h3>
              <p className="mt-3 text-sm text-slate-600">{proposal.relatedNeed.title}</p>
              <Link
                className="mt-2 inline-flex text-sm font-semibold text-ht-blue"
                href={`/needs/${proposal.relatedNeed.needId}`}
              >
                查看需求详情
              </Link>
            </section>
          ) : null}

          <section>
            <h3 className="text-xl font-semibold text-slate-950">附件</h3>
            <div className="mt-3 flex flex-wrap gap-3">
              {attachments.length ? (
                attachments.map((item) => (
                  <a
                    key={item.id}
                    className="rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:border-ht-blue hover:text-ht-blue"
                    href={item.url || '#'}
                    rel="noreferrer"
                    target="_blank"
                  >
                    {item.filename}
                  </a>
                ))
              ) : (
                <p className="text-sm text-slate-500">当前没有上传附件。</p>
              )}
            </div>
          </section>

          <section>
            <h3 className="text-xl font-semibold text-slate-950">评审意见</h3>
            <p className="mt-3 whitespace-pre-line text-sm leading-8 text-slate-600">
              {proposal.reviewNotes
                ? lexicalToPlainText(proposal.reviewNotes)
                : '当前尚未填写评审意见。'}
            </p>
          </section>
        </div>
      </div>

      {(user.role === 'admin' || user.role === 'reviewer') && (
        <ProposalReviewForm
          defaultNotes={proposal.reviewNotes ? lexicalToPlainText(proposal.reviewNotes) : ''}
          proposalId={proposal.id}
          status={proposal.status}
        />
      )}
    </div>
  )
}
