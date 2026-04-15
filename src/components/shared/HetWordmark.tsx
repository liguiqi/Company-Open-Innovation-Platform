import Image from 'next/image'

import { cn } from '@/lib/utils'

export function HetWordmark({
  className,
  title = 'Open Innovation HET',
}: {
  className?: string
  title?: string
}) {
  return (
    <Image
      alt={title}
      className={cn('h-11 w-auto object-contain', className)}
      height={460}
      priority
      src="/branding/2018-Open Innovation-LOGO-CMYK01.png"
      width={3180}
    />
  )
}
