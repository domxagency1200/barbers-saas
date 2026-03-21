'use client'

import { usePathname } from 'next/navigation'
import DashboardSidebar from '@/components/dashboard/DashboardSidebar'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  // No shell on the login page
  if (pathname === '/dashboard/login') {
    return <>{children}</>
  }

  return (
    <div dir="rtl" className="min-h-screen flex" style={{ backgroundColor: '#1a1a1a' }}>
      <DashboardSidebar />
      <main className="flex-1 md:mr-60 pb-20 md:pb-0 overflow-x-hidden">
        {children}
      </main>
    </div>
  )
}
