import Link from 'next/link'
import { Blocks, BriefcaseBusiness, FileText, FolderKanban, type LucideIcon } from 'lucide-react'

import { EmptyState } from '@/components/shared/EmptyState'
import {
  NeedPriorityBadge,
  NeedStatusBadge,
  ProposalStatusBadge,
} from '@/components/shared/StatusBadge'
import { requireUser } from '@/lib/auth'
import { getDashboardMetrics } from '@/lib/data'
import { getPayloadClient } from '@/lib/payload'
import { lexicalToPlainText } from '@/lib/richtext'
import { formatDate, getNeedDomainLabel } from '@/lib/utils'

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

  const needs =
    user.role === 'admin' || user.role === 'reviewer'
      ? await payload.find({
          collection: 'tech-needs',
          depth: 0,
          limit: 3,
          overrideAccess: true,
          sort: '-publishedAt',
        })
      : null

  const cards = [
    { label: '方案总数', value: metrics.proposalCount, icon: Blocks },
    { label: '公开需求', value: metrics.needCount, icon: FileText },
    { label: '生态伙伴', value: metrics.partnerCount, icon: BriefcaseBusiness },
    { label: '联合案例', value: metrics.caseCount, icon: FolderKanban },
  ] satisfies Array<{
    icon: LucideIcon
    label: string
    value: number
  }>

  return (
    <div className="space-y-8">
      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => (
          <div key={card.label} className="theme-dashboard-panel rounded-xl p-6">
            <div className="flex items-start justify-between gap-4">
              <p className="text-sm text-[var(--ht-text-muted)]">{card.label}</p>
              <span className="theme-dashboard-nav-icon flex h-11 w-11 items-center justify-center rounded-lg">
                <card.icon size={18} />
              </span>
            </div>
            <p className="mt-6 font-display text-5xl font-semibold text-[var(--ht-text-primary)]">
              {card.value}
            </p>
          </div>
        ))}
      </div>

      <div className="theme-dashboard-panel rounded-xl p-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-semibold text-[var(--ht-text-primary)]">最近方案</h2>
            <p className="mt-2 text-sm text-[var(--ht-text-muted)]">
              展示最近提交或最近变更状态的方案记录。
            </p>
          </div>
          <Link className="text-sm font-semibold text-ht-light-blue" href="/dashboard/proposals">
            查看全部
          </Link>
        </div>

        <div className="mt-6 space-y-4">
          {proposals.docs.length ? (
            proposals.docs.map((proposal) => (
              <div
                key={proposal.id}
                className="theme-dashboard-panel-soft flex flex-col gap-3 rounded-lg p-5 md:flex-row md:items-center md:justify-between"
              >
                <div>
                  <h3 className="text-lg font-semibold text-[var(--ht-text-primary)]">
                    {proposal.title}
                  </h3>
                  <p className="mt-2 text-sm text-[var(--ht-text-muted)]">
                    {proposal.contactCompany} · {formatDate(proposal.createdAt, '刚刚')}
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <ProposalStatusBadge status={proposal.status} />
                  <Link
                    className="text-sm font-semibold text-ht-light-blue"
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

      {needs ? (
        <div className="theme-dashboard-panel rounded-xl p-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-semibold text-[var(--ht-text-primary)]">最新技术需求</h2>
              <p className="mt-2 text-sm text-[var(--ht-text-muted)]">
                供管理员与评审员快速查看当前公开需求状态，并进入需求发布台维护。
              </p>
            </div>
            <Link className="text-sm font-semibold text-ht-light-blue" href="/dashboard/needs">
              进入需求发布
            </Link>
          </div>

          <div className="mt-6 grid gap-4 lg:grid-cols-2">
            {needs.docs.length ? (
              needs.docs.map((need) => (
                <div key={need.id} className="theme-dashboard-panel-soft rounded-lg p-5">
                  <div className="flex flex-wrap items-center gap-2">
                    <NeedPriorityBadge priority={need.priority} />
                    <NeedStatusBadge status={need.status} />
                  </div>
                  <h3 className="mt-4 text-xl font-semibold text-[var(--ht-text-primary)]">
                    {need.title}
                  </h3>
                  <p className="mt-2 text-sm text-[var(--ht-text-muted)]">
                    {need.needId} · {getNeedDomainLabel(need.domain)} ·{' '}
                    {formatDate(need.publishedAt)}
                  </p>
                  <p className="mt-4 text-sm leading-7 text-[var(--ht-text-secondary)]">
                    {lexicalToPlainText(need.description).slice(0, 96) || '暂无需求描述'}
                    {lexicalToPlainText(need.description).length > 96 ? '...' : ''}
                  </p>
                </div>
              ))
            ) : (
              <div className="lg:col-span-2">
                <EmptyState
                  description="当前尚未发布技术需求，可在需求发布台创建首条记录。"
                  title="暂无技术需求"
                />
              </div>
            )}
          </div>
        </div>
      ) : null}
    </div>
  )
}
