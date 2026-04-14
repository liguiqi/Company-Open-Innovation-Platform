import React from 'react'

import { DashboardSidebar } from '@/components/layout/DashboardSidebar'
import { DashboardTopBar } from '@/components/layout/DashboardTopBar'
import { requireUser } from '@/lib/auth'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser()

  return (
    <div className="container-shell grid gap-6 py-6 lg:grid-cols-[280px_minmax(0,1fr)]">
      <DashboardSidebar role={user.role} />
      <div>
        <DashboardTopBar user={user} />
        {children}
      </div>
    </div>
  )
}
