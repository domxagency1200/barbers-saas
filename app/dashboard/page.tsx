'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { getTabSalonId, setTabSalonId } from '@/lib/tabSalonId'
import NewDashboardClient from '@/components/dashboard/NewDashboardClient'

const bookingSelect = 'id, starts_at, ends_at, status, payment_status, barber_id, customers(name, phone), barbers(name), services'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function normalize(rows: any[] | null) {
  return (rows ?? []).map((b: any) => ({
    ...b,
    customers: Array.isArray(b.customers) ? (b.customers[0] ?? null) : (b.customers ?? null),
    barbers:   Array.isArray(b.barbers)   ? (b.barbers[0]   ?? null) : (b.barbers   ?? null),
    services:  b.services || [],
  }))
}

export default function NewDashboardPage() {
  const router = useRouter()
  const supabase = createClient()

  const [todayBookings, setTodayBookings] = useState<any[]>([])
  const [monthBookings, setMonthBookings] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [salonId, setSalonId] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/dashboard/login'); return }

      let salonId = getTabSalonId()
      if (!salonId) {
        const res = await fetch('/api/dashboard/fix-salon-metadata', { method: 'POST' })
        if (res.ok) { const j = await res.json(); salonId = j.salon_id ?? null }
        if (salonId) setTabSalonId(salonId)
      }
      setSalonId(salonId)

      // تحديث الحجوزات المنتهية إلى "مكتمل" تلقائياً
      fetch('/api/dashboard/auto-complete', { method: 'POST' }).catch(() => null)

      const now = new Date()
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0).toISOString()
      const todayEnd   = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 0).toISOString()
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
      const monthEnd   = new Date(now.getFullYear(), now.getMonth() + 1, 1).toISOString()

      const base = supabase.from('bookings').select(bookingSelect)
      const [{ data: todayRaw }, { data: monthRaw }] = await Promise.all([
        (salonId ? base.eq('salon_id', salonId) : base).gte('starts_at', todayStart).lt('starts_at', todayEnd).order('starts_at', { ascending: true }),
        (salonId ? supabase.from('bookings').select(bookingSelect).eq('salon_id', salonId) : supabase.from('bookings').select(bookingSelect)).gte('starts_at', monthStart).lt('starts_at', monthEnd).order('starts_at', { ascending: true }),
      ])

      setTodayBookings(normalize(todayRaw))
      setMonthBookings(normalize(monthRaw))
      setLoading(false)
    }
    load()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#1a1a1a' }}>
      <p className="text-sm text-gray-500">جارٍ التحميل...</p>
    </div>
  )

  return <NewDashboardClient todayBookings={todayBookings} monthBookings={monthBookings} salonId={salonId} />
}
