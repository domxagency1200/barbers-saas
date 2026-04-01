'use client'

import { Suspense } from 'react'
import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { getTabSalonId, setTabSalonId } from '@/lib/tabSalonId'
import Link from 'next/link'
import DatePicker from '@/components/dashboard/DatePicker'

interface Booking { id: string; ends_at: string; barber_id: string | null }

function BookingsPageInner() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()

  const now = new Date()
  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
  const dateStr = searchParams.get('date') ?? todayStr

  const [barbers, setBarbers] = useState<{ id: string; name: string }[]>([])
  const [bookingsByBarber, setBookingsByBarber] = useState<Record<string, Booking[]>>({})
  const [loading, setLoading] = useState(true)

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

      const dateObj = new Date(dateStr)
      const dayStart = new Date(dateObj.getFullYear(), dateObj.getMonth(), dateObj.getDate(), 0, 0, 0).toISOString()
      const dayEnd   = new Date(dateObj.getFullYear(), dateObj.getMonth(), dateObj.getDate() + 1, 0, 0, 0).toISOString()

      const [{ data: barbersRaw }, { data: bookingsRaw }] = await Promise.all([
        salonId
          ? supabase.from('barbers').select('id, name').eq('salon_id', salonId).eq('is_deleted', false).order('name')
          : supabase.from('barbers').select('id, name').eq('is_deleted', false).order('name'),
        salonId
          ? supabase.from('bookings').select('id, ends_at, barber_id').gte('starts_at', dayStart).lt('starts_at', dayEnd).eq('salon_id', salonId)
          : supabase.from('bookings').select('id, ends_at, barber_id').gte('starts_at', dayStart).lt('starts_at', dayEnd),
      ])

      const byBarber: Record<string, Booking[]> = {};
      (bookingsRaw ?? []).forEach((b: Booking) => {
        const key = b.barber_id ?? ''
        if (!byBarber[key]) byBarber[key] = []
        byBarber[key].push(b)
      })

      setBarbers(barbersRaw ?? [])
      setBookingsByBarber(byBarber)
      setLoading(false)
    }
    load()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dateStr])

  const nowTime = new Date()

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#1a1a1a' }}>
      <p className="text-sm text-gray-500">جارٍ التحميل...</p>
    </div>
  )

  return (
    <div dir="rtl" style={{ backgroundColor: '#0a0a0c', minHeight: '100vh', padding: '24px 16px' }}>
      <div style={{ maxWidth: 640, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 12 }}>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
          <div>
            <h1 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#fff', margin: 0, letterSpacing: '-0.02em' }}>حجوزات اليوم</h1>
          </div>
          <DatePicker value={dateStr} />
        </div>

        {barbers.length === 0 ? (
          <div style={{ borderRadius: 16, border: '1px solid rgba(255,255,255,0.07)', padding: '40px 16px', textAlign: 'center', backgroundColor: 'rgba(255,255,255,0.03)' }}>
            <p style={{ color: 'rgba(255,255,255,0.25)', fontSize: '0.85rem' }}>لا يوجد حلاقون</p>
          </div>
        ) : (
          barbers.map(({ id, name }) => {
            const bList = bookingsByBarber[id] ?? []
            const done = bList.filter(b => new Date(b.ends_at) < nowTime).length
            const pending = bList.filter(b => new Date(b.ends_at) >= nowTime).length
            const total = done + pending
            return (
              <Link
                key={id}
                href={`/dashboard/bookings/${id}?date=${dateStr}`}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderRadius: 16, border: '1px solid rgba(255,255,255,0.07)', padding: '14px 16px', backgroundColor: 'rgba(255,255,255,0.03)', textDecoration: 'none', transition: 'background .2s, border-color .2s' }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.backgroundColor = 'rgba(255,255,255,0.06)'; (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.12)' }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.backgroundColor = 'rgba(255,255,255,0.03)'; (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.07)' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(201,165,90,0.12)', border: '1px solid rgba(201,165,90,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.85rem', fontWeight: 700, color: '#C9A55A', flexShrink: 0 }}>
                    {name.charAt(0)}
                  </div>
                  <div>
                    <p style={{ fontWeight: 700, color: '#fff', fontSize: '0.9rem', margin: 0 }}>{name}</p>
                    <p style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.3)', margin: 0, marginTop: 2 }}>{total} حجز اليوم</p>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ fontSize: '0.72rem', padding: '3px 10px', borderRadius: 20, fontWeight: 600, backgroundColor: 'rgba(34,197,94,0.1)', color: '#4ade80', border: '1px solid rgba(34,197,94,0.2)' }}>{done} منجز</span>
                  <span style={{ fontSize: '0.72rem', padding: '3px 10px', borderRadius: 20, fontWeight: 600, backgroundColor: 'rgba(234,179,8,0.1)', color: '#facc15', border: '1px solid rgba(234,179,8,0.2)' }}>{pending} انتظار</span>
                </div>
              </Link>
            )
          })
        )}
      </div>
    </div>
  )
}

export default function BookingsPage() { return <Suspense><BookingsPageInner /></Suspense> }
