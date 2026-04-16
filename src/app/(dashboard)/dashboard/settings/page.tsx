import { requireUser } from '@/lib/auth'
import { roleLabelMap } from '@/lib/constants'

export default async function SettingsPage() {
  const user = await requireUser()

  return (
    <div className="theme-dashboard-panel rounded-[1rem] p-8">
      <h2 className="theme-page-title text-3xl font-semibold">个人设置</h2>
      <p className="theme-page-description mt-2 text-sm">
        当前版本提供只读视图，账号和权限的完整维护可在 `/admin` 中完成。
      </p>

      <div className="mt-8 grid gap-5 md:grid-cols-2">
        <div className="theme-dashboard-panel-soft rounded-[0.75rem] p-5">
          <p className="text-xs uppercase tracking-[0.3em] text-[var(--ht-text-muted)]">姓名</p>
          <p className="mt-2 text-lg font-semibold text-[var(--ht-text-primary)]">{user.name}</p>
        </div>
        <div className="theme-dashboard-panel-soft rounded-[0.75rem] p-5">
          <p className="text-xs uppercase tracking-[0.3em] text-[var(--ht-text-muted)]">角色</p>
          <p className="mt-2 text-lg font-semibold text-[var(--ht-text-primary)]">
            {roleLabelMap[user.role]}
          </p>
        </div>
        <div className="theme-dashboard-panel-soft rounded-[0.75rem] p-5">
          <p className="text-xs uppercase tracking-[0.3em] text-[var(--ht-text-muted)]">邮箱</p>
          <p className="mt-2 text-lg font-semibold text-[var(--ht-text-primary)]">{user.email}</p>
        </div>
        <div className="theme-dashboard-panel-soft rounded-[0.75rem] p-5">
          <p className="text-xs uppercase tracking-[0.3em] text-[var(--ht-text-muted)]">手机</p>
          <p className="mt-2 text-lg font-semibold text-[var(--ht-text-primary)]">
            {user.phone || '未绑定'}
          </p>
        </div>
      </div>
    </div>
  )
}
