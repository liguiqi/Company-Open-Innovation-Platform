import { cn } from '@/lib/utils'

export function HetWordmark({
  className,
  title = 'Open Innovation',
}: {
  className?: string
  title?: string
}) {
  return (
    <svg
      aria-label={title}
      className={cn('h-11 w-auto text-ht-blue', className)}
      role="img"
      viewBox="0 0 760 120"
      xmlns="http://www.w3.org/2000/svg"
    >
      <title>{title}</title>
      <text
        fill="currentColor"
        fontFamily="'Barlow Condensed', 'Arial Narrow', Arial, sans-serif"
        fontSize="94"
        fontStyle="italic"
        fontWeight="700"
        letterSpacing="-3"
        x="0"
        y="80"
      >
        HeT
      </text>
      <text
        fill="currentColor"
        fontFamily="'Noto Sans SC', 'Microsoft YaHei', sans-serif"
        fontSize="78"
        fontWeight="700"
        letterSpacing="4"
        x="255"
        y="82"
      >
        Open Innovation
      </text>
    </svg>
  )
}
