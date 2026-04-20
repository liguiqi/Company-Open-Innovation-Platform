import { SettingsForm } from '@/components/dashboard/SettingsForm'
import { requireUser } from '@/lib/auth'

export default async function SettingsPage() {
  const user = await requireUser()

  return (
    <SettingsForm
      user={{
        company: user.company,
        email: user.email,
        emailVerifiedAt: user.emailVerifiedAt,
        name: user.name,
        phone: user.phone,
        phoneVerifiedAt: user.phoneVerifiedAt,
        role: user.role,
        username: user.username,
      }}
    />
  )
}
