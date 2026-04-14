import { requireUser } from '@/lib/auth'
import { roleLabelMap } from '@/lib/constants'

export default async function SettingsPage() {
  const user = await requireUser()

  return (
    <div className="rounded-[2rem] border border-white/70 bg-white p-8 shadow-lg shadow-slate-200/60">
      <h2 className="text-3xl font-semibold text-slate-950">个人设置</h2>
      <p className="mt-2 text-sm text-slate-500">
        当前版本提供只读视图，账号和权限的完整维护可在 `/admin` 中完成。
      </p>

      <div className="mt-8 grid gap-5 md:grid-cols-2">
        <div className="rounded-[1.5rem] bg-slate-50 p-5">
          <p className="text-xs uppercase tracking-[0.3em] text-slate-400">姓名</p>
          <p className="mt-2 text-lg font-semibold text-slate-950">{user.name}</p>
        </div>
        <div className="rounded-[1.5rem] bg-slate-50 p-5">
          <p className="text-xs uppercase tracking-[0.3em] text-slate-400">角色</p>
          <p className="mt-2 text-lg font-semibold text-slate-950">{roleLabelMap[user.role]}</p>
        </div>
        <div className="rounded-[1.5rem] bg-slate-50 p-5">
          <p className="text-xs uppercase tracking-[0.3em] text-slate-400">邮箱</p>
          <p className="mt-2 text-lg font-semibold text-slate-950">{user.email}</p>
        </div>
        <div className="rounded-[1.5rem] bg-slate-50 p-5">
          <p className="text-xs uppercase tracking-[0.3em] text-slate-400">手机</p>
          <p className="mt-2 text-lg font-semibold text-slate-950">{user.phone || '未绑定'}</p>
        </div>
      </div>
    </div>
  )
}
