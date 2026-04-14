import { EmptyState } from '@/components/shared/EmptyState'
import { requireRole } from '@/lib/auth'
import { roleLabelMap } from '@/lib/constants'
import { getPayloadClient } from '@/lib/payload'

export const dynamic = 'force-dynamic'

export default async function UsersAdminPage() {
  await requireRole(['admin'])
  const payload = await getPayloadClient()
  const users = await payload.find({
    collection: 'users',
    depth: 1,
    limit: 100,
    overrideAccess: true,
    sort: '-createdAt',
  })

  return users.docs.length ? (
    <div className="space-y-5">
      <div>
        <h2 className="text-3xl font-semibold text-slate-950">用户管理</h2>
        <p className="mt-2 text-sm text-slate-500">
          展示当前平台账号视图，完整编辑仍建议在 Payload Admin 中进行。
        </p>
      </div>
      <div className="space-y-4">
        {users.docs.map((user) => (
          <article
            key={user.id}
            className="rounded-[2rem] border border-white/70 bg-white p-6 shadow-lg shadow-slate-200/60"
          >
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <h3 className="text-xl font-semibold text-slate-950">
                  {user.name}{' '}
                  <span className="text-sm font-normal text-slate-400">(@{user.username})</span>
                </h3>
                <p className="mt-2 text-sm text-slate-500">
                  {user.email} · {user.phone || '未绑定手机'} · {roleLabelMap[user.role]}
                </p>
              </div>
              <a
                className="text-sm font-semibold text-ht-blue"
                href={`/admin/collections/users/${user.id}`}
              >
                在 Admin 中编辑
              </a>
            </div>
          </article>
        ))}
      </div>
    </div>
  ) : (
    <EmptyState
      description="尚未创建任何平台用户，请先执行 seed 或在管理后台创建账号。"
      title="暂无用户数据"
    />
  )
}
