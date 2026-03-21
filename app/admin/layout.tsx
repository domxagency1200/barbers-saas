'use client'

import { useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import AdminLayout from './AdminLayout'

export default function AdminRootLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()

  const isLoginPage = pathname === '/admin/login'

  useEffect(() => {
    if (!isLoginPage && localStorage.getItem('isAdmin') !== 'true') {
      router.replace('/admin/login')
    }
  }, [pathname, router, isLoginPage])

  if (isLoginPage) return <>{children}</>

  return <AdminLayout>{children}</AdminLayout>
}
