import { proposalStatusMap, roleLabelMap } from '@/lib/constants'
import { lexicalToPlainText } from '@/lib/richtext'

type UserLike =
  | number
  | {
      email?: string | null
      name?: string | null
      role?: string | null
      username?: string | null
    }
  | null
  | undefined

type StoredTimelineEntry = {
  actorName?: string | null
  actorRole?: string | null
  notes?: string | null
  occurredAt?: string | null
  status?: string | null
}

type ProposalLike = {
  contactName?: string | null
  createdAt?: string | null
  reviewNotes?: unknown
  reviewedBy?: UserLike
  reviewTimeline?: StoredTimelineEntry[] | null
  status?: string | null
  submittedBy?: UserLike
  updatedAt?: string | null
}

export type ProposalWorkflowStatus = 'approved' | 'pending' | 'rejected' | 'reviewing'

export type ProposalTimelineEntry = {
  actorName: string
  actorRole: string
  notes: string
  occurredAt: string
  status: ProposalWorkflowStatus
}

function resolveActorName(user: UserLike, fallback: string) {
  if (!user || typeof user === 'number') {
    return fallback
  }

  return user.name || user.username || user.email || fallback
}

function resolveActorRole(user: UserLike, fallback = '流程记录') {
  if (!user || typeof user === 'number' || !user.role) {
    return fallback
  }

  return roleLabelMap[user.role] || user.role
}

function normalizeNotes(value?: string | null, fallback = '未填写意见') {
  const text = value?.trim()

  return text ? text : fallback
}

function normalizeStatus(value?: string | null) {
  return value && proposalStatusMap[value]
    ? (value as ProposalWorkflowStatus)
    : ('pending' as ProposalWorkflowStatus)
}

export function createSubmissionTimelineEntry({
  contactName,
  createdAt,
  status,
  submittedBy,
}: {
  contactName?: string | null
  createdAt?: string | null
  status?: string | null
  submittedBy?: UserLike
}): ProposalTimelineEntry {
  return {
    actorName: resolveActorName(submittedBy, contactName || '提案提交人'),
    actorRole: resolveActorRole(submittedBy, '合作伙伴'),
    notes: '提案已提交，等待进入评审流程。',
    occurredAt: createdAt || new Date().toISOString(),
    status: normalizeStatus(status),
  }
}

export function createReviewTimelineEntry({
  notes,
  occurredAt,
  reviewer,
  status,
}: {
  notes?: string | null
  occurredAt?: string | null
  reviewer?: UserLike
  status?: string | null
}): ProposalTimelineEntry {
  return {
    actorName: resolveActorName(reviewer, '评审人员'),
    actorRole: resolveActorRole(reviewer, '评审记录'),
    notes: normalizeNotes(notes),
    occurredAt: occurredAt || new Date().toISOString(),
    status: normalizeStatus(status),
  }
}

export function normalizeStoredProposalTimeline(
  entries?: StoredTimelineEntry[] | null,
): ProposalTimelineEntry[] {
  if (!Array.isArray(entries) || !entries.length) {
    return []
  }

  return entries.map((entry) => ({
    actorName: entry.actorName?.trim() || '流程记录',
    actorRole: entry.actorRole?.trim() || '流程记录',
    notes: normalizeNotes(entry.notes),
    occurredAt: entry.occurredAt || new Date().toISOString(),
    status: normalizeStatus(entry.status),
  }))
}

export function buildProposalTimeline(proposal: ProposalLike): ProposalTimelineEntry[] {
  const storedTimeline = normalizeStoredProposalTimeline(proposal.reviewTimeline)

  if (storedTimeline.length) {
    return storedTimeline
  }

  const fallbackTimeline: ProposalTimelineEntry[] = [
    createSubmissionTimelineEntry({
      contactName: proposal.contactName,
      createdAt: proposal.createdAt,
      status: proposal.status === 'pending' ? proposal.status : 'pending',
      submittedBy: proposal.submittedBy,
    }),
  ]

  const reviewNotesText = lexicalToPlainText(proposal.reviewNotes)
  const hasReviewRecord =
    Boolean(reviewNotesText.trim()) ||
    (proposal.reviewedBy && typeof proposal.reviewedBy !== 'number') ||
    proposal.status === 'approved' ||
    proposal.status === 'reviewing' ||
    proposal.status === 'rejected'

  if (hasReviewRecord) {
    fallbackTimeline.push(
      createReviewTimelineEntry({
        notes: reviewNotesText || '评审人更新了当前提案状态。',
        occurredAt: proposal.updatedAt || proposal.createdAt,
        reviewer: proposal.reviewedBy,
        status: proposal.status,
      }),
    )
  }

  return fallbackTimeline
}
