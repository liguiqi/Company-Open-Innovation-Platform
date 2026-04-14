import React from 'react'

import { PublicFooter } from '@/components/layout/PublicFooter'
import { PublicHeader } from '@/components/layout/PublicHeader'
import { getCurrentUser } from '@/lib/auth'

export default async function PublicLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser()

  return (
    <>
      <PublicHeader isLoggedIn={Boolean(user)} />
      <main>{children}</main>
      <PublicFooter />
    </>
  )
}
