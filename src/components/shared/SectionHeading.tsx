import { cn } from '@/lib/utils'

export function SectionHeading({
  align = 'left',
  description,
  eyebrow,
  tone = 'default',
  title,
}: {
  align?: 'center' | 'left'
  description: string
  eyebrow?: string
  tone?: 'contrast' | 'default'
  title: string
}) {
  return (
    <div className={cn('space-y-3', align === 'center' && 'text-center')}>
      {eyebrow ? (
        <p className="text-xs uppercase tracking-[0.4em] text-ht-light-blue">{eyebrow}</p>
      ) : null}
      <h2
        className={cn(
          'font-display text-4xl font-semibold tracking-wide',
          tone === 'contrast' ? 'text-[var(--ht-contrast-text)]' : 'text-[var(--ht-text-primary)]',
        )}
      >
        {title}
      </h2>
      <p
        className={cn(
          'max-w-3xl text-base leading-7',
          tone === 'contrast' ? 'text-[var(--ht-contrast-muted)]' : 'text-[var(--ht-text-muted)]',
        )}
      >
        {description}
      </p>
    </div>
  )
}
