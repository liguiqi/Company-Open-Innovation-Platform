import Link from 'next/link'

import { HetBrandLogo } from '@/components/shared/HetBrandLogo'

export function PublicFooter() {
  return (
    <footer className="theme-footer mt-20">
      <div className="container-shell grid gap-10 py-14 md:grid-cols-4">
        <div className="space-y-4">
          <HetBrandLogo className="w-[178px] md:w-[196px]" variant="white" />
          <p className="text-sm leading-7 text-[color:var(--ht-footer-muted)]">
            Open Innovation（002402.SZ）致力于成为全球智能控制器领域的领导者，通过开放创新连接产业链资源，共创智慧生活。
          </p>
        </div>

        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-[color:var(--ht-footer-text)]">快速链接</h3>
          <div className="space-y-3 text-sm text-[color:var(--ht-footer-muted)]">
            <Link className="block hover:text-white" href="/needs">
              技术需求大厅
            </Link>
            <Link className="block hover:text-white" href="/ecosystem">
              生态伙伴目录
            </Link>
            <Link className="block hover:text-white" href="/cases">
              联合创新案例
            </Link>
            <a
              className="block hover:text-white"
              href="https://www.example.com/"
              rel="noreferrer"
              target="_blank"
            >
              访问企业官网
            </a>
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-[color:var(--ht-footer-text)]">联系与支持</h3>
          <div className="space-y-2 text-sm text-[color:var(--ht-footer-muted)]">
            <p>创新合作邮箱</p>
            <p className="font-medium text-[color:var(--ht-footer-text)]">
              innovation@example.com
            </p>
            <p className="pt-2">总部地址</p>
            <p className="text-[color:var(--ht-footer-text)]">Address Line</p>
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-[color:var(--ht-footer-text)]">平台说明</h3>
          <p className="text-sm leading-7 text-[color:var(--ht-footer-muted)]">
            平台当前支持邮箱密码和短信验证码双通道认证，适用于技术需求浏览、合作伙伴入驻、方案提交与评审流转。
          </p>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="container-shell flex flex-col gap-3 py-5 text-xs text-[color:var(--ht-footer-muted)] md:flex-row md:items-center md:justify-between">
          <p>
            © 2026 Shenzhen HET Intelligent Control Co., Ltd. All rights reserved. Powered by LGQ
            {' | '}Ver 2026.04
          </p>
          <div className="flex gap-4">
            <Link href="/process">合作流程</Link>
            <Link href="/login">账号登录</Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
