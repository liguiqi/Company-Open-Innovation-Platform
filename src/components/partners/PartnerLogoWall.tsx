import Image from 'next/image'

import { partnerTierMap } from '@/lib/constants'
import {
  getPartnerLogoMedia,
  resolvePartnerBrandProfile,
  type DisplayPartnerRecord,
} from '@/lib/partner-branding'
import { cn, getPartnerCategoryLabel } from '@/lib/utils'

export type { DisplayPartnerRecord } from '@/lib/partner-branding'

export function PartnerBrandMark({
  brandPreset,
  className,
  name,
}: {
  brandPreset?: string | null
  className?: string
  name: string
}) {
  const profile = resolvePartnerBrandProfile({ brandPreset, name })
  const hasSecondary = Boolean(profile.secondaryLabel)

  return (
    <svg
      aria-label={name}
      className={className}
      fill="none"
      role="img"
      viewBox="0 0 240 96"
      xmlns="http://www.w3.org/2000/svg"
    >
      <title>{name}</title>
      <text
        fill="currentColor"
        fontFamily="Arial, PingFang SC, Microsoft YaHei, sans-serif"
        fontSize={profile.fontSize}
        fontStyle={profile.italic ? 'italic' : 'normal'}
        fontWeight={profile.fontWeight || 700}
        letterSpacing={profile.letterSpacing || 0}
        textAnchor="middle"
        x="120"
        y={hasSecondary ? '44' : '58'}
      >
        {profile.label}
      </text>
      {profile.secondaryLabel ? (
        <text
          fill="currentColor"
          fillOpacity="0.68"
          fontFamily="Arial, PingFang SC, Microsoft YaHei, sans-serif"
          fontSize={profile.secondaryFontSize || 20}
          fontWeight="500"
          textAnchor="middle"
          x="120"
          y="72"
        >
          {profile.secondaryLabel}
        </text>
      ) : null}
    </svg>
  )
}

export function PartnerLogoCard({
  className,
  compact = false,
  partner,
  tone = 'default',
}: {
  className?: string
  compact?: boolean
  partner: DisplayPartnerRecord
  tone?: 'contrast' | 'default'
}) {
  const logoMedia = !partner.brandPreset ? getPartnerLogoMedia(partner.logo) : null
  const cardClassName = cn(
    'group flex items-center justify-center overflow-hidden border px-4 transition-all duration-200',
    compact ? 'h-[5.25rem] rounded-[0.7rem]' : 'h-[5.9rem] rounded-[0.8rem]',
    tone === 'contrast'
      ? 'border-white/12 bg-white/[0.04] text-[var(--ht-contrast-muted)] hover:border-sky-300/30 hover:bg-white/[0.07] hover:text-[var(--ht-contrast-text)]'
      : 'border-[color:var(--ht-border-soft)] bg-[var(--ht-card-solid)] text-[var(--ht-text-muted)] shadow-[0_12px_28px_rgba(15,23,42,0.04)] hover:border-[color:var(--ht-border-strong)] hover:text-[var(--ht-text-primary)]',
    className,
  )

  const content = (
    <>
      {logoMedia ? (
        <Image
          alt={logoMedia.alt || partner.name}
          className="h-[2.75rem] w-full max-w-[11rem] object-contain"
          height={96}
          loading="lazy"
          src={logoMedia.url || ''}
          width={240}
        />
      ) : (
        <PartnerBrandMark
          brandPreset={partner.brandPreset}
          className="h-[3.1rem] w-full max-w-[11rem]"
          name={partner.name}
        />
      )}
      <span className="sr-only">
        {partner.name}，{partnerTierMap[partner.tier] || partner.tier}，
        {getPartnerCategoryLabel(partner.category)}
      </span>
    </>
  )

  if (partner.website) {
    return (
      <a
        className={cardClassName}
        href={partner.website}
        rel="noreferrer"
        target="_blank"
        title={partner.name}
      >
        {content}
      </a>
    )
  }

  return (
    <div className={cardClassName} title={partner.name}>
      {content}
    </div>
  )
}
