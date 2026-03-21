'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'

const NAV = [
  { href: '/admin', label: 'الرئيسية' },
  { href: '/admin/salons', label: 'الصالونات' },
]

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()

  function handleLogout() {
    localStorage.removeItem('isAdmin')
    router.push('/admin/login')
  }

  return (
    <div className="flex min-h-screen" style={{ backgroundColor: '#1a1a1a' }}>
      {/* Sidebar */}
      <aside className="w-56 shrink-0 flex flex-col border-r border-white/10" style={{ backgroundColor: '#141414' }}>
        <div className="px-5 py-5 border-b border-white/10">
          <span className="text-base font-extrabold" style={{ color: '#D4A843' }}>Salony Admin</span>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1">
          {NAV.map(({ href, label }) => {
            const active = pathname === href
            return (
              <Link
                key={href}
                href={href}
                className="flex items-center rounded-xl px-3 py-2.5 text-sm font-medium transition-colors"
                style={active
                  ? { backgroundColor: 'rgba(212,168,67,0.15)', color: '#D4A843' }
                  : { color: 'rgba(255,255,255,0.55)' }}
              >
                {label}
              </Link>
            )
          })}
        </nav>

        <div className="px-3 py-4 border-t border-white/10">
          <button
            onClick={handleLogout}
            className="w-full rounded-xl px-3 py-2.5 text-sm font-medium text-right transition-colors"
            style={{ color: 'rgba(255,255,255,0.4)' }}
          >
            تسجيل الخروج
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 min-w-0">
        {children}
      </main>
    </div>
  )
}
