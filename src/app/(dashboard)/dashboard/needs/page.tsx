import { TechNeedsManager } from '@/components/dashboard/TechNeedsManager'
import { requireRole } from '@/lib/auth'
import { getPayloadClient } from '@/lib/payload'

export const dynamic = 'force-dynamic'

export default async function DashboardNeedsPage() {
  const user = await requireRole(['admin', 'reviewer'])
  const payload = await getPayloadClient()
  const needs = await payload.find({
    collection: 'tech-needs',
    depth: 0,
    limit: 100,
    overrideAccess: true,
    sort: '-publishedAt',
  })

  return <TechNeedsManager needs={needs.docs} role={user.role} />
}
