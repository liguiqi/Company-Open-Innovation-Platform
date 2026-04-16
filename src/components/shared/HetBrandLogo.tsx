import Image from 'next/image'

import { cn } from '@/lib/utils'

export function HetBrandLogo({
  className,
  priority = false,
  variant = 'blue',
}: {
  className?: string
  priority?: boolean
  variant?: 'blue' | 'white'
}) {
  return (
    <Image
      alt="Open Innovation HeT"
      className={cn(
        'h-auto w-[170px] object-contain',
        variant === 'white' && 'brightness-0 invert',
        className,
      )}
      height={460}
      priority={priority}
      src="/branding/het-full.png"
      unoptimized
      width={3180}
    />
  )
}
