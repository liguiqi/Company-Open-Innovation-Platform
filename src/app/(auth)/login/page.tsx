import { LoginPanel } from '@/components/auth/LoginPanel'

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ redirect?: string }>
}) {
  const { redirect } = await searchParams

  return <LoginPanel redirectTo={redirect} />
}
