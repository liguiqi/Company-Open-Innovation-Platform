import { LoginPanel } from '@/components/auth/LoginPanel'

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ identifier?: string; redirect?: string; registered?: string }>
}) {
  const { identifier, redirect, registered } = await searchParams

  return (
    <LoginPanel
      initialIdentifier={identifier}
      initialSuccessMessage={registered === '1' ? '注册成功，请使用新账号登录' : undefined}
      redirectTo={redirect}
    />
  )
}
