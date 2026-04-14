export function EmptyState({ description, title }: { description: string; title: string }) {
  return (
    <div className="rounded-[2rem] border border-dashed border-slate-300 bg-white/80 p-10 text-center">
      <p className="font-display text-3xl font-semibold text-slate-900">{title}</p>
      <p className="mx-auto mt-3 max-w-xl text-sm leading-7 text-slate-500">{description}</p>
    </div>
  )
}
