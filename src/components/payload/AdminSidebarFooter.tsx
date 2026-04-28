import Link from 'next/link'

export function AdminSidebarLogoutButton() {
  return null
}

export default function AdminSidebarFooter() {
  return (
    <div className="payload-admin-sidebar-footer" role="presentation">
      <div className="payload-admin-sidebar-footer__inner">
        <Link
          aria-label="Log out"
          className="payload-admin-sidebar-footer__logout"
          href="/admin/logout"
          title="Log out"
        >
          <svg
            aria-hidden="true"
            fill="none"
            height="18"
            viewBox="0 0 20 20"
            width="18"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M12 16H14.6667C15.0203 16 15.3594 15.8595 15.6095 15.6095C15.8595 15.3594 16 15.0203 16 14.6667V5.33333C16 4.97971 15.8595 4.64057 15.6095 4.39052C15.3594 4.14048 15.0203 4 14.6667 4H12M7.33333 13.3333L4 10M4 10L7.33333 6.66667M4 10H12"
              stroke="currentColor"
              strokeLinecap="square"
              strokeWidth="1.5"
            />
          </svg>
        </Link>
        <div className="payload-admin-sidebar-footer__text">
          <p>2026 HET. All rights reserved.</p>
          <p>HET Tech Research Inst. | LGQ</p>
        </div>
      </div>
    </div>
  )
}
