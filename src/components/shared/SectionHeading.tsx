import { cn } from '@/lib/utils'

export function SectionHeading({
  align = 'left',
  description,
  eyebrow,
  title,
}: {
  align?: 'center' | 'left'
  description: string
  eyebrow?: string
  title: string
}) {
  return (
    <div className={cn('space-y-3', align === 'center' && 'text-center')}>
      {eyebrow ? (
        <p className="text-xs uppercase tracking-[0.4em] text-ht-light-blue">{eyebrow}</p>
      ) : null}
      <h2 className="font-display text-4xl font-semibold tracking-wide text-slate-950">{title}</h2>
      <p className="max-w-3xl text-base leading-7 text-slate-500">{description}</p>
    </div>
  )
}
