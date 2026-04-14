import { VerifyClient } from '@/components/auth/VerifyClient'

export default async function VerifyPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>
}) {
  const { token } = await searchParams

  return <VerifyClient token={token} />
}
