'use client'

import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import SalonLogo from '@/app/components/SalonLogo'
import { getTabSalonId, setTabSalonId } from '@/lib/tabSalonId'

// ── Icons ────────────────────────────────────────────────────

function IconHome() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  )
}

function IconScissors() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="6" cy="6" r="3" />
      <circle cx="6" cy="18" r="3" />
      <line x1="20" y1="4" x2="8.12" y2="15.88" />
      <line x1="14.47" y1="14.48" x2="20" y2="20" />
      <line x1="8.12" y1="8.12" x2="12" y2="12" />
    </svg>
  )
}

function IconCard() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="5" width="20" height="14" rx="2" />
      <line x1="2" y1="10" x2="22" y2="10" />
    </svg>
  )
}

function IconSettings() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  )
}

function IconChart() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="20" x2="18" y2="10" />
      <line x1="12" y1="20" x2="12" y2="4" />
      <line x1="6" y1="20" x2="6" y2="14" />
    </svg>
  )
}

function IconCalendar() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  )
}

function IconLogout() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  )
}

// ── Nav items ─────────────────────────────────────────────────

const NAV = [
  { href: '/dashboard',               label: 'الرئيسية',   icon: <IconHome /> },
  { href: '/dashboard/bookings',      label: 'الحجوزات',   icon: <IconCalendar /> },
  { href: '/dashboard/stats',         label: 'الإحصائيات', icon: <IconChart /> },
  { href: '/dashboard/services',      label: 'الخدمات',    icon: <IconScissors /> },
  { href: '/dashboard/settings',      label: 'الإعدادات',  icon: <IconSettings /> },
]

// ── Component ─────────────────────────────────────────────────

export default function DashboardSidebar() {
  const pathname = usePathname()
  const router = useRouter()

  const [meta, setMeta] = useState<{ logo_url?: string; use_auto_logo?: boolean; logo_letter?: string; card_theme?: string; custom_color?: string } | null>(null)
  const [unread, setUnread] = useState(0)

  // Load from localStorage after mount to avoid hydration mismatch
  useEffect(() => {
    setUnread(parseInt(localStorage.getItem('unread_bookings') ?? '0', 10))
  }, [])

  // Reset badge when visiting bookings
  useEffect(() => {
    if (pathname.startsWith('/dashboard/bookings')) {
      setUnread(0)
      localStorage.setItem('unread_bookings', '0')
    }
  }, [pathname])

  // Listen for new booking messages from SW
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return
    const handler = (e: MessageEvent) => {
      if (e.data?.type === 'NEW_BOOKING') {
        setUnread(prev => {
          const next = prev + 1
          localStorage.setItem('unread_bookings', String(next))
          return next
        })
      }
    }
    navigator.serviceWorker.addEventListener('message', handler)
    return () => navigator.serviceWorker.removeEventListener('message', handler)
  }, [])

  useEffect(() => {
    const supabase = createClient()
    async function loadMeta() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      let sid = getTabSalonId() ?? (user.app_metadata?.salon_id as string | undefined) ?? null
      if (!sid) {
        const res = await fetch('/api/dashboard/fix-salon-metadata', { method: 'POST' })
        if (res.ok) { const j = await res.json(); sid = j.salon_id ?? null }
      }
      if (sid) setTabSalonId(sid)
      if (!sid) return
      const { data } = await supabase.from('salons').select('meta').eq('id', sid).single()
      setMeta((data as any)?.meta ?? {})
    }
    loadMeta()
  }, [])

  async function handleLogout() {
    const supabase = createClient()

    // Get current user's salon slug via salon_members
    const { data: { user } } = await supabase.auth.getUser()
    let slug: string | null = null
    if (user) {
      const { data: member } = await supabase
        .from('salon_members')
        .select('salons(slug)')
        .eq('user_id', user.id)
        .single()
      slug = (member?.salons as any)?.slug ?? null
    }

    await supabase.auth.signOut()
    router.push(slug ? `/${slug}` : '/dashboard/login')
  }

  function isActive(href: string) {
    return href === '/dashboard' ? pathname === '/dashboard' : pathname.startsWith(href)
  }

  return (
    <>
      {/* ── Desktop sidebar ──────────────────────────────── */}
      <aside className="hidden md:flex flex-col fixed top-0 right-0 h-full w-60 border-l border-white/10 z-20" style={{ backgroundColor: '#242424' }}>
        <div className="px-6 py-5 border-b border-white/10 flex items-center">
          <h1 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#D4A843', letterSpacing: '0.06em' }}>لوحة التحكم</h1>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1">
          {NAV.map(item => (
            <Link
              key={item.href}
              href={item.href}
              className={[
                'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors text-right',
                isActive(item.href) ? 'text-black' : 'text-gray-400 hover:text-white hover:bg-white/5',
              ].join(' ')}
              style={isActive(item.href) ? { backgroundColor: '#D4A843', color: '#1a1a1a' } : undefined}
            >
              {item.icon}
              <span className="flex-1">{item.label}</span>
              {item.href === '/dashboard/bookings' && unread > 0 && (
                <span style={{ backgroundColor: '#ef4444', color: '#fff', borderRadius: '999px', fontSize: '0.65rem', fontWeight: 700, minWidth: 18, height: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 5px' }}>
                  {unread > 99 ? '99+' : unread}
                </span>
              )}
            </Link>
          ))}
        </nav>

        <div className="px-3 py-4 border-t border-white/10">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-red-400 hover:bg-red-900/20 transition-colors"
          >
            <IconLogout />
            تسجيل الخروج
          </button>
        </div>
      </aside>

      {/* ── Mobile bottom nav ────────────────────────────── */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 border-t border-white/10 flex z-20" style={{ backgroundColor: '#242424' }}>
        {NAV.map(item => (
          <Link
            key={item.href}
            href={item.href}
            className="flex-1 flex flex-col items-center justify-center py-3 gap-0.5 transition-colors relative"
            style={{ color: isActive(item.href) ? '#D4A843' : '#6b7280' }}
          >
            {item.icon}
            <span className="text-xs font-medium">{item.label}</span>
            {item.href === '/dashboard/bookings' && unread > 0 && (
              <span style={{ position: 'absolute', top: 6, right: '50%', transform: 'translateX(10px)', backgroundColor: '#ef4444', color: '#fff', borderRadius: '999px', fontSize: '0.55rem', fontWeight: 700, minWidth: 16, height: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 4px' }}>
                {unread > 99 ? '99+' : unread}
              </span>
            )}
          </Link>
        ))}
        <button
          onClick={handleLogout}
          className="flex-1 flex flex-col items-center justify-center py-3 gap-0.5 text-red-400"
        >
          <IconLogout />
          <span className="text-xs font-medium">خروج</span>
        </button>
      </nav>
    </>
  )
}
