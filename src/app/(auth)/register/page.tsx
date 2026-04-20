import { RegisterForm } from '@/components/auth/RegisterForm'

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ email?: string; phone?: string }>
}) {
  const { email, phone } = await searchParams

  return <RegisterForm initialEmail={email} initialPhone={phone} />
}
