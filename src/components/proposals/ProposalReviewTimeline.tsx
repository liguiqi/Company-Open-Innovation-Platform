import { getProposalStatusLabel } from '@/lib/utils'
import { formatDateTime } from '@/lib/utils'
import type { ProposalTimelineEntry } from '@/lib/proposal-review-timeline'

export function ProposalReviewTimeline({ entries }: { entries: ProposalTimelineEntry[] }) {
  return (
    <div className="space-y-4">
      {entries.map((entry, index) => (
        <article
          className="theme-dashboard-panel-soft relative overflow-hidden rounded-[0.85rem] border border-[color:var(--oip-border-soft)] p-5"
          key={`${entry.actorName}-${entry.occurredAt}-${index}`}
        >
          <div className="absolute bottom-0 left-0 top-0 w-[3px] bg-ht-light-blue/55" />
          <div className="pl-4">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <h4 className="text-base font-semibold text-[var(--oip-text-primary)]">
                  {entry.actorName}
                </h4>
                <p className="mt-1 text-xs uppercase tracking-[0.26em] text-[var(--oip-text-muted)]">
                  {entry.actorRole}
                </p>
              </div>
              <div className="grid gap-2 text-sm text-[var(--oip-text-secondary)] sm:grid-cols-2 lg:min-w-[320px]">
                <div>
                  <p className="text-[11px] uppercase tracking-[0.24em] text-[var(--oip-text-muted)]">
                    时间
                  </p>
                  <p className="mt-1 font-medium text-[var(--oip-text-primary)]">
                    {formatDateTime(entry.occurredAt)}
                  </p>
                </div>
                <div>
                  <p className="text-[11px] uppercase tracking-[0.24em] text-[var(--oip-text-muted)]">
                    状态
                  </p>
                  <p className="mt-1 font-medium text-[var(--oip-text-primary)]">
                    {getProposalStatusLabel(entry.status)}
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-4 rounded-[0.75rem] border border-[color:var(--oip-border-soft)] bg-[color:var(--oip-panel-elevated)] px-4 py-3">
              <p className="text-[11px] uppercase tracking-[0.24em] text-[var(--oip-text-muted)]">
                意见
              </p>
              <p className="mt-2 whitespace-pre-line text-sm leading-7 text-[var(--oip-text-secondary)]">
                {entry.notes}
              </p>
            </div>
          </div>
        </article>
      ))}
    </div>
  )
}
