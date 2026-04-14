import { ProposalForm } from '@/components/proposals/ProposalForm'
import { requireUser } from '@/lib/auth'
import { getPayloadClient } from '@/lib/payload'

export const dynamic = 'force-dynamic'

export default async function NewProposalPage({
  searchParams,
}: {
  searchParams: Promise<{ need?: string }>
}) {
  await requireUser()
  const { need } = await searchParams
  const payload = await getPayloadClient()
  const needs = await payload.find({
    collection: 'tech-needs',
    depth: 0,
    limit: 100,
    overrideAccess: true,
    sort: '-publishedAt',
  })

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-semibold text-slate-950">提交新方案</h2>
        <p className="mt-2 text-sm text-slate-500">
          填写方案摘要、联系人信息并上传附件，提交后会自动进入评审流程。
        </p>
      </div>

      <ProposalForm
        defaultNeedId={need}
        needs={needs.docs.map((item) => ({
          id: item.id,
          needId: item.needId,
          title: item.title,
        }))}
      />
    </div>
  )
}
