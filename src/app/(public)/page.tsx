import Link from 'next/link'

import { NeedCard } from '@/components/needs/NeedCard'
import { PartnerLogoCard, type DisplayPartnerRecord } from '@/components/partners/PartnerLogoWall'
import { SectionHeading } from '@/components/shared/SectionHeading'
import { getHomepageData } from '@/lib/data'
import { heroDomains, publicStats } from '@/lib/constants'
import { getCaseDomainLabel } from '@/lib/utils'
import { getDisplayPartnersByTier, partnerDirectoryRoute } from '@/lib/partner-branding'

export const dynamic = 'force-dynamic'

export default async function HomePage() {
  const { cases, needs, partners } = await getHomepageData()
  const featuredPartners = getDisplayPartnersByTier(
    partners as DisplayPartnerRecord[],
    'strategic',
    9,
  )

  return (
    <div>
      <section className="relative overflow-hidden bg-slate-950">
        <div
          className="absolute inset-0 bg-cover bg-center opacity-40"
          style={{
            backgroundImage:
              "url('https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=2072&auto=format&fit=crop')",
          }}
        />
        <div className="hero-grid absolute inset-0 bg-gradient-to-r from-[#004098] via-[#004eaa] to-[#001f4d] opacity-90" />

        <div className="container-shell relative py-24 md:py-32">
          <div className="max-w-3xl text-white">
            <p className="text-xs uppercase tracking-[0.4em] text-sky-200">
              Open Innovation Platform
            </p>
            <h1 className="mt-6 font-display text-5xl font-semibold leading-[1.14] md:text-7xl md:leading-[1.08]">
              连接全球智慧，
              <br />
              共创智能控制未来
            </h1>
            <p className="mt-6 text-lg leading-8 text-blue-100 lg:max-w-none lg:whitespace-nowrap">
              依托Open Innovation在智能控制领域的全球产业积累，我们向全球伙伴开放前沿需求，汇聚生态智慧，共创未来。
            </p>
            <div className="mt-10 flex flex-wrap gap-4">
              <Link
                className="rounded-full bg-ht-light-blue px-6 py-3 text-sm font-semibold text-white transition hover:bg-white hover:text-ht-blue"
                href="/needs"
              >
                查看技术需求
              </Link>
              <Link
                className="rounded-full border border-white/50 px-6 py-3 text-sm font-semibold text-white transition hover:bg-white hover:text-ht-blue"
                href="/ecosystem"
              >
                加入生态联盟
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-[color:var(--oip-border-soft)] bg-[var(--oip-card-solid)]">
        <div className="container-shell grid gap-8 py-10 md:grid-cols-4">
          {publicStats.map((item) => (
            <div key={item.label} className="text-center">
              <p className="font-display text-5xl font-semibold text-ht-blue">{item.value}</p>
              <p className="mt-2 text-xs uppercase tracking-[0.3em] text-[var(--oip-text-muted)]">
                {item.label}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="container-shell py-20">
        <SectionHeading
          align="center"
          description="开放平台当前聚焦三大核心产业带，分别向算法、功率器件、连接模组与联合实验室合作伙伴发出邀请。"
          title="我们在三大领域寻找创新伙伴"
        />
        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {heroDomains.map((domain) => (
            <article
              key={domain.title}
              className={`theme-card rounded-[1rem] border-t-4 ${domain.accent} bg-[var(--oip-card)] p-8`}
            >
              <div className="text-4xl">{domain.icon}</div>
              <h3 className="mt-4 text-2xl font-semibold text-[var(--oip-text-primary)]">
                {domain.title}
              </h3>
              <p className="mt-4 text-sm leading-7 text-[var(--oip-text-secondary)]">
                {domain.description}
              </p>
            </article>
          ))}
        </div>
      </section>

      <section className="container-shell py-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <SectionHeading
            description="围绕公开需求、开放自荐和联合预研三种模式，平台持续收集外部创新方案。"
            eyebrow="Current Needs"
            title="技术需求大厅"
          />
          <Link className="text-sm font-semibold text-ht-blue" href="/needs">
            查看全部需求
          </Link>
        </div>
        <div className="mt-10 grid gap-5">
          {needs.map((need) => (
            <NeedCard key={need.id} need={need} />
          ))}
        </div>
      </section>

      <section className="container-shell py-20">
        <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="theme-card-contrast rounded-[1rem] p-8 shadow-sm shadow-slate-300/40">
            <p className="text-xs uppercase tracking-[0.35em] text-sky-200">Ecosystem</p>
            <h2 className="mt-4 font-display text-4xl font-semibold">OIP 全球合作伙伴联盟</h2>
            <div className="mt-4 flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
              <p className="max-w-2xl text-sm leading-8 text-[var(--oip-contrast-muted)]">
                平台目前覆盖芯片、功率、电源、连接与传感、产学研合作机构等多类生态角色，可在供应链导入和联合研发之间实现快速闭环。
              </p>
              <div className="flex justify-end xl:shrink-0">
                <Link
                  className="inline-flex items-center gap-2 whitespace-nowrap text-base font-semibold text-sky-200 transition hover:text-white"
                  href={partnerDirectoryRoute}
                >
                  查看全部认证合作伙伴
                  <span aria-hidden="true" className="text-xl leading-none">
                    ›
                  </span>
                </Link>
              </div>
            </div>

            <div className="mt-8 grid gap-3 sm:grid-cols-2 md:grid-cols-3">
              {featuredPartners.map((partner) => (
                <PartnerLogoCard
                  key={`home-partner-${partner.id}`}
                  compact
                  partner={partner}
                  tone="contrast"
                />
              ))}
            </div>
          </div>

          <div className="theme-card space-y-5 rounded-[1rem] p-8">
            <p className="text-xs uppercase tracking-[0.35em] text-ht-light-blue">
              Success Stories
            </p>
            <h2 className="font-display text-4xl font-semibold text-[var(--oip-text-primary)]">
              联合创新案例
            </h2>
            {cases.map((item) => (
              <Link
                key={item.id}
                className="block rounded-[0.75rem] border border-[color:var(--oip-border-soft)] p-5 transition hover:border-ht-light-blue"
                href={`/cases/${item.slug}`}
              >
                <p className="text-xs uppercase tracking-[0.3em] text-ht-light-blue">
                  {getCaseDomainLabel(item.domain)}
                </p>
                <h3 className="mt-3 text-xl font-semibold text-[var(--oip-text-primary)]">
                  {item.title}
                </h3>
                <p className="mt-2 text-sm leading-7 text-[var(--oip-text-secondary)]">
                  {item.summary}
                </p>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
