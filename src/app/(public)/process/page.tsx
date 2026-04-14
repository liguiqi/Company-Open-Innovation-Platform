import Link from 'next/link'

import { SectionHeading } from '@/components/shared/SectionHeading'

const steps = [
  {
    description: '针对公开需求或开放自荐方向，在线提交技术方案与资料。',
    number: '01',
    title: '提交方案',
  },
  {
    description: 'Open Innovation技术团队完成初审，必要时签署 NDA 并进行样品测试。',
    number: '02',
    title: '技术评估',
  },
  {
    description: '联合开发 PoC 原型，评估场景适配度和导入可行性。',
    number: '03',
    title: 'PoC 验证',
  },
  {
    description: '通过评审后进入合格供应商库，在大客户项目中推广量产。',
    number: '04',
    title: '导入供应链',
  },
]

export default function ProcessPage() {
  return (
    <div className="container-shell py-16">
      <SectionHeading
        align="center"
        description="从创意进入量产，需要经过公开征集、技术评估、PoC 验证和供应链导入四个阶段。平台将全过程沉淀为可追踪流程。"
        eyebrow="Workflow"
        title="从创意到量产的合作路径"
      />

      <div className="relative mt-14 grid gap-6 md:grid-cols-4">
        {steps.map((step, index) => (
          <article
            key={step.number}
            className={`rounded-[2rem] border border-white/70 bg-white p-7 text-center shadow-lg shadow-slate-200/60 ${index === 1 ? 'border-t-4 border-t-ht-light-blue' : index === 2 ? 'border-t-4 border-t-ht-blue' : index === 3 ? 'border-t-4 border-t-emerald-500' : 'border-t-4 border-t-slate-300'}`}
          >
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-lg font-semibold text-slate-700">
              {step.number}
            </div>
            <h3 className="mt-4 text-xl font-semibold text-slate-950">{step.title}</h3>
            <p className="mt-3 text-sm leading-7 text-slate-500">{step.description}</p>
          </article>
        ))}
      </div>

      <div className="mt-12 text-center">
        <Link
          className="rounded-full bg-ht-light-blue px-6 py-3 text-sm font-semibold text-white transition hover:bg-ht-blue"
          href="/submit"
        >
          立即开始提交
        </Link>
      </div>
    </div>
  )
}
