export function EmptyState({ description, title }: { description: string; title: string }) {
  return (
    <div className="theme-card rounded-[1rem] border-dashed p-10 text-center">
      <p className="font-display text-3xl font-semibold text-[var(--oip-text-primary)]">{title}</p>
      <p className="mx-auto mt-3 max-w-xl text-sm leading-7 text-[var(--oip-text-muted)]">
        {description}
      </p>
    </div>
  )
}
