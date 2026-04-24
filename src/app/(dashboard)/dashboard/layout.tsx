import React from 'react'

import { DashboardSidebar } from '@/components/layout/DashboardSidebar'
import { DashboardTopBar } from '@/components/layout/DashboardTopBar'
import { RouteTransition } from '@/components/shared/RouteTransition'
import { requireUser } from '@/lib/auth'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser()

  return (
    <div className="container-shell py-6">
      <div className="dashboard-workspace grid gap-6 lg:h-[calc(100vh-3rem)] lg:grid-cols-[280px_minmax(0,1fr)] lg:overflow-hidden">
        <DashboardSidebar role={user.role} />
        <div className="dashboard-main-scroll min-h-0 min-w-0 lg:overflow-y-auto lg:pr-2">
          <DashboardTopBar user={user} />
          <RouteTransition>{children}</RouteTransition>
        </div>
      </div>
    </div>
  )
}
