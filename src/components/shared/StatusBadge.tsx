import { needPriorityMap, proposalStatusMap } from '@/lib/constants'
import { cn } from '@/lib/utils'

export function NeedPriorityBadge({ priority }: { priority?: string | null }) {
  const config = needPriorityMap[priority || 'open'] || needPriorityMap.open

  return (
    <span className={cn('rounded-full border px-2.5 py-1 text-xs font-semibold', config.badge)}>
      {config.label}
    </span>
  )
}

export function ProposalStatusBadge({ status }: { status?: string | null }) {
  const label = proposalStatusMap[status || 'pending'] || proposalStatusMap.pending
  const tone =
    status === 'approved'
      ? 'bg-emerald-50 text-emerald-700'
      : status === 'rejected'
        ? 'bg-rose-50 text-rose-700'
        : status === 'reviewing'
          ? 'bg-blue-50 text-blue-700'
          : 'bg-amber-50 text-amber-700'

  return <span className={cn('rounded-full px-3 py-1 text-xs font-semibold', tone)}>{label}</span>
}
