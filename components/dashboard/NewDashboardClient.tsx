'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

// ── Types ────────────────────────────────────────────────────

interface Booking {
  id: string
  starts_at: string
  ends_at: string
  status: string
  payment_status: string | null
  barber_id: string | null
  customers: { name: string; phone: string } | null
  barbers: { name: string } | null
  services: { name_ar: string; price: number }[]
}

interface Props {
  todayBookings: Booking[]
  monthBookings: Booking[]
  salonId: string | null
}

// ── Constants ────────────────────────────────────────────────

const STATUS_LABEL: Record<string, string> = {
  pending: 'قيد الانتظار',
  confirmed: 'مؤكد',
  completed: 'مكتمل',
  cancelled: 'ملغي',
}

const STATUS_COLOR: Record<string, string> = {
  pending: 'bg-yellow-900/40 text-yellow-400',
  confirmed: 'bg-green-900/40 text-green-400',
  completed: 'bg-white/10 text-gray-400',
  cancelled: 'bg-red-900/40 text-red-400',
}

const ARABIC_MONTHS = ['يناير','فبراير','مارس','أبريل','مايو','يونيو','يوليو','أغسطس','سبتمبر','أكتوبر','نوفمبر','ديسمبر']
const ARABIC_DAYS_SHORT = ['أح', 'إث', 'ث', 'أر', 'خ', 'ج', 'س']

// ── Helpers ──────────────────────────────────────────────────

const TZ = 'Asia/Riyadh'

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString('ar-SA', { timeZone: TZ, hour: '2-digit', minute: '2-digit', hour12: true })
}

function isSameDay(iso: string, year: number, month: number, day: number) {
  const parts = new Intl.DateTimeFormat('en', { timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(new Date(iso))
  const p: Record<string, number> = {}
  parts.forEach(({ type, value }) => { if (type !== 'literal') p[type] = parseInt(value) })
  return p.year === year && p.month - 1 === month && p.day === day
}

function groupByBarber(bookings: Booking[]): { id: string | null; name: string; bookings: Booking[] }[] {
  const map: Record<string, { id: string | null; name: string; bookings: Booking[] }> = {}
  bookings.forEach(b => {
    const key = b.barber_id ?? 'unknown'
    const name = b.barbers?.name ?? 'غير محدد'
    if (!map[key]) map[key] = { id: b.barber_id, name, bookings: [] }
    map[key].bookings.push(b)
  })
  return Object.values(map)
}

// ── Sub-components ───────────────────────────────────────────

function BookingCard({ b }: { b: Booking }) {
  console.log(b.services)
  const total = b.services.reduce((s, sv) => s + (sv.price ?? 0), 0)
  const paid = b.payment_status === 'paid'
  return (
    <div className="rounded-2xl border border-white/10 p-3 space-y-1.5 transition-all duration-200 hover:border-white/[0.17]" style={{ backgroundColor: '#242424' }}>
      <div className="flex items-center justify-between gap-1">
        <p className="font-semibold text-white text-sm truncate">{b.customers?.name ?? '—'}</p>
        <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium shrink-0 ${STATUS_COLOR[b.status] ?? 'bg-white/10 text-gray-400'}`}>
          {STATUS_LABEL[b.status] ?? b.status}
        </span>
      </div>
      <p className="text-xs text-gray-500">{b.customers?.phone ?? '—'}</p>
      <div className="space-y-0.5">
        {b.services.length > 0
          ? b.services.map((sv, i) => (
              <p key={i} className="text-xs text-gray-400">• {sv.name_ar} — {sv.price} ر.س</p>
            ))
          : <p className="text-xs text-gray-500">—</p>
        }
      </div>
      <div className="flex items-center justify-between text-xs pt-1 border-t border-white/5">
        <div className="flex items-center gap-2">
          <span className="font-medium text-gray-300">{formatTime(b.starts_at)}</span>
          <span className={`px-1.5 py-0.5 rounded-full font-medium ${paid ? 'bg-green-900/40 text-green-400' : 'bg-red-900/30 text-red-400'}`}>
            {paid ? 'مدفوع' : 'غير مدفوع'}
          </span>
        </div>
        <span className="font-bold" style={{ color: '#C9A55A' }}>{total} ر.س</span>
      </div>
    </div>
  )
}

function MonthCalendar({
  year, month, bookings, selectedDay, onSelectDay,
}: {
  year: number
  month: number
  bookings: Booking[]
  selectedDay: number
  onSelectDay: (day: number) => void
}) {
  const today = new Date()
  const isCurrentMonth = today.getFullYear() === year && today.getMonth() === month
  const firstDow = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()

  const countsByDay: Record<number, number> = {}
  bookings.forEach(b => {
    const d = new Date(b.starts_at)
    if (d.getMonth() === month && d.getFullYear() === year) {
      countsByDay[d.getDate()] = (countsByDay[d.getDate()] ?? 0) + 1
    }
  })

  const cells: (number | null)[] = [
    ...Array(firstDow).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ]

  return (
    <div className="rounded-3xl border border-white/[0.07] p-4" style={{ backgroundColor: '#111113' }}>
      <p className="text-sm font-semibold mb-3 text-center" style={{ color: '#C9A55A' }}>
        {ARABIC_MONTHS[month]} {year}
      </p>
      <div className="grid grid-cols-7 gap-1 mb-2 border-b pb-2" style={{ borderColor: 'rgba(255,255,255,0.04)' }}>
        {ARABIC_DAYS_SHORT.map(d => (
          <div key={d} className="text-center text-xs py-1" style={{ color: 'rgba(255,255,255,0.15)', letterSpacing: '0.03em' }}>{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {cells.map((day, i) => {
          if (!day) return <div key={i} />
          const isToday = isCurrentMonth && day === today.getDate()
          const isSelected = day === selectedDay && !isToday
          return (
            <button
              key={i}
              onClick={() => onSelectDay(day)}
              className="aspect-square rounded-full text-xs font-medium flex flex-col items-center justify-center relative transition-colors"
              style={{
                backgroundColor: isToday ? '#C9A55A' : isSelected ? 'rgba(255,255,255,0.08)' : undefined,
                color: isToday ? '#1a1a1a' : isSelected ? 'white' : 'rgba(255,255,255,0.38)',
              }}
            >
              {day}
              {countsByDay[day] ? (
                <span
                  className="absolute bottom-0.5 w-1 h-1 rounded-full"
                  style={{ backgroundColor: isToday ? '#1a1a1a' : '#C9A55A' }}
                />
              ) : null}
            </button>
          )
        })}
      </div>
    </div>
  )
}

// ── Main component ───────────────────────────────────────────

export default function NewDashboardClient({ todayBookings, monthBookings, salonId }: Props) {
  const now = new Date()
  const [selectedDay, setSelectedDay] = useState(now.getDate())
  const [notifEnabled, setNotifEnabled] = useState(false)
  const [testingPush, setTestingPush] = useState(false)

  useEffect(() => {
    if (!('serviceWorker' in navigator)) return
    navigator.serviceWorker.ready.then(reg =>
      reg.pushManager.getSubscription().then(sub => {
        if (sub) setNotifEnabled(true)
      })
    ).catch(() => null)
  }, [])

  async function testPush() {
    if (!salonId) { alert('تعذّر تحديد الصالون'); return }
    setTestingPush(true)
    try {
      const res = await fetch('/api/push/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ salon_id: salonId, title: 'اختبار تنبيه', body: 'إذا وصل هذا = الإشعارات تعمل ✓' }),
      })
      const json = await res.json()
      if (res.ok) alert(`✓ تم الإرسال (${json.sent ?? 0} subscription)`)
      else alert('✗ فشل: ' + JSON.stringify(json))
    } catch (err) {
      alert('✗ خطأ: ' + (err instanceof Error ? err.message : String(err)))
    } finally {
      setTestingPush(false)
    }
  }

  async function toggleNotifications() {
    if (notifEnabled) {
      setNotifEnabled(false)
      return
    }
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent)
      if (isIOS) {
        alert('لتفعيل الإشعارات على iPhone:\n\nاضغط على زر المشاركة ← "إضافة إلى الشاشة الرئيسية"\nثم افتح التطبيق من الشاشة الرئيسية وفعّل الإشعارات')
      }
      return
    }
    try {
      const permission = await Notification.requestPermission()
      if (permission !== 'granted') { alert('لم يتم منح إذن الإشعارات'); return }
      const reg = await navigator.serviceWorker.register('/sw.js')
      await navigator.serviceWorker.ready
      const existing = await reg.pushManager.getSubscription()
      const rawKey = 'BNEgTj_n0t5fSrQGKtaQhHUi5lAhpiuoInXwWRsy8LWXOKcyh9kUxFKH23FbRtRi7ZCFYaCskHUtnePDnn1k0R4'
      const base64 = rawKey.replace(/-/g, '+').replace(/_/g, '/')
      const binary = atob(base64)
      const vapidKey = new Uint8Array(binary.length)
      for (let i = 0; i < binary.length; i++) vapidKey[i] = binary.charCodeAt(i)
      const sub = existing ?? await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: vapidKey,
      })
      if (!salonId) { alert('تعذّر تحديد الصالون، أعد تحميل الصفحة'); return }
      const res = await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subscription: sub.toJSON(), salon_id: salonId }),
      })
      if (!res.ok) { alert('فشل حفظ الإشعارات، حاول مرة أخرى'); return }
      setNotifEnabled(true)
      alert('✓ تم تفعيل الإشعارات')
    } catch (err) {
      alert('حدث خطأ: ' + (err instanceof Error ? err.message : String(err)))
    }
  }

  const barberGroups = groupByBarber(todayBookings)
  const todayRevenue = todayBookings.reduce((s, b) => s + b.services.reduce((ss, sv) => ss + (sv.price ?? 0), 0), 0)

  const selectedDayBookings = monthBookings.filter(b =>
    isSameDay(b.starts_at, now.getFullYear(), now.getMonth(), selectedDay)
  )

  return (
    <div dir="rtl" style={{ backgroundColor: '#0a0a0c', minHeight: '100vh', padding: '24px 16px' }}>
      <div style={{ maxWidth: 600, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 16 }}>

        {/* Header */}
        <div>
          <h1 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#fff', margin: 0, letterSpacing: '-0.02em' }}>لوحة التحكم</h1>
          <p style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.28)', marginTop: 2 }}>{ARABIC_MONTHS[now.getMonth()]} {now.getFullYear()}</p>
        </div>

        {/* Summary cards */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <div style={{ borderRadius: 20, border: '1px solid rgba(255,255,255,0.07)', padding: '16px', backgroundColor: 'rgba(255,255,255,0.03)', position: 'relative', transition: 'all 0.25s ease' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <p style={{ fontSize: '0.68rem', color: 'rgba(255,255,255,0.3)', fontWeight: 500 }}>حجوزات اليوم</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontSize: '0.6rem', color: notifEnabled ? '#C9A55A' : 'rgba(255,255,255,0.2)', fontWeight: 600 }}>الإشعارات</span>
                <button
                  onClick={toggleNotifications}
                  title={notifEnabled ? 'إيقاف الإشعارات' : 'تشغيل الإشعارات'}
                  style={{
                    width: 36, height: 20, borderRadius: 10, border: 'none', cursor: 'pointer',
                    backgroundColor: notifEnabled ? '#C9A55A' : 'rgba(255,255,255,0.1)',
                    position: 'relative', transition: 'background 0.2s', flexShrink: 0,
                  }}
                >
                  <span style={{
                    position: 'absolute', top: 2,
                    right: notifEnabled ? 2 : 18,
                    width: 16, height: 16, borderRadius: '50%',
                    backgroundColor: '#fff',
                    transition: 'right 0.2s',
                    display: 'block',
                  }} />
                </button>
                {notifEnabled && (
                  <button
                    onClick={testPush}
                    disabled={testingPush}
                    title="اختبار التنبيه"
                    style={{
                      fontSize: '0.6rem', padding: '2px 7px', borderRadius: 6, border: '1px solid rgba(201,165,90,0.3)',
                      backgroundColor: 'rgba(201,165,90,0.08)', color: '#C9A55A', cursor: 'pointer', fontWeight: 600,
                      opacity: testingPush ? 0.5 : 1,
                    }}
                  >
                    {testingPush ? '...' : 'اختبار'}
                  </button>
                )}
              </div>
            </div>
            <p style={{ fontSize: '2.2rem', fontWeight: 900, color: '#fff', lineHeight: 1, letterSpacing: '-0.03em' }}>{todayBookings.length}</p>
          </div>
          <div style={{ borderRadius: 20, border: '1px solid rgba(201,165,90,0.2)', padding: '16px', backgroundColor: 'rgba(201,165,90,0.05)', position: 'relative', overflow: 'hidden', transition: 'all 0.25s ease' }}>
            <div style={{ position: 'absolute', top: 0, left: '15%', right: '15%', height: 1, background: 'linear-gradient(90deg,transparent,rgba(201,165,90,0.6),transparent)' }} />
            <p style={{ fontSize: '0.68rem', color: 'rgba(201,165,90,0.5)', fontWeight: 500, marginBottom: 8 }}>إيرادات اليوم</p>
            <p style={{ fontSize: '2.2rem', fontWeight: 900, lineHeight: 1, letterSpacing: '-0.03em', background: 'linear-gradient(120deg,#e8c97a 0%,#C9A55A 50%,#9a6f2a 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>{todayRevenue}</p>
            <p style={{ fontSize: '0.65rem', color: 'rgba(201,165,90,0.35)', marginTop: 4 }}>ر.س</p>
          </div>
        </div>

        {/* Monthly calendar */}
        <div>
          <p style={{ fontSize: '0.68rem', color: 'rgba(255,255,255,0.25)', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 8 }}>التقويم الشهري</p>
          <MonthCalendar year={now.getFullYear()} month={now.getMonth()} bookings={monthBookings} selectedDay={selectedDay} onSelectDay={setSelectedDay} />
        </div>

        {/* All bookings DB button */}
        <Link href="/dashboard/bookings-db" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, borderRadius: 16, border: '1px solid rgba(201,165,90,0.3)', padding: '13px 16px', backgroundColor: 'rgba(201,165,90,0.06)', textDecoration: 'none', color: '#C9A55A', fontWeight: 700, fontSize: '0.85rem', transition: 'all 0.2s ease' }}>
          <span>🗂️</span>
          <span>جميع الحجوزات — قاعدة البيانات</span>
        </Link>

        {/* Selected day bookings */}
        <div>
          <p style={{ fontSize: '0.68rem', color: 'rgba(255,255,255,0.25)', fontWeight: 600, letterSpacing: '0.08em', marginBottom: 8 }}>
            حجوزات {selectedDay} {ARABIC_MONTHS[now.getMonth()]}
          </p>
          {selectedDayBookings.length === 0 ? (
            <div style={{ borderRadius: 16, border: '1px solid rgba(255,255,255,0.06)', padding: '32px 16px', textAlign: 'center', backgroundColor: 'rgba(255,255,255,0.02)' }}>
              <p style={{ color: 'rgba(255,255,255,0.2)', fontSize: '0.85rem' }}>لا توجد حجوزات</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {groupByBarber(selectedDayBookings).map(({ id: barberId, name, bookings: bList }) => {
                const now2 = new Date()
                const completed = bList.filter(b => new Date(b.ends_at) < now2).length
                const pending = bList.filter(b => new Date(b.ends_at) >= now2).length
                const dateParam = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(selectedDay).padStart(2, '0')}`
                return (
                  <Link key={barberId ?? name} href={barberId ? `/dashboard/bookings/${barberId}?date=${dateParam}` : '#'}
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderRadius: 16, border: '1px solid rgba(255,255,255,0.07)', padding: '12px 14px', backgroundColor: 'rgba(255,255,255,0.03)', textDecoration: 'none', transition: 'all 0.2s ease' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 34, height: 34, borderRadius: '50%', background: 'rgba(201,165,90,0.1)', border: '1px solid rgba(201,165,90,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', fontWeight: 700, color: '#C9A55A', flexShrink: 0 }}>
                        {name.charAt(0)}
                      </div>
                      <p style={{ fontWeight: 700, color: '#fff', fontSize: '0.85rem', margin: 0 }}>{name}</p>
                    </div>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <span style={{ fontSize: '0.7rem', padding: '2px 9px', borderRadius: 20, fontWeight: 600, backgroundColor: 'rgba(34,197,94,0.1)', color: '#4ade80', border: '1px solid rgba(34,197,94,0.2)' }}>{completed} منجز</span>
                      <span style={{ fontSize: '0.7rem', padding: '2px 9px', borderRadius: 20, fontWeight: 600, backgroundColor: 'rgba(234,179,8,0.1)', color: '#facc15', border: '1px solid rgba(234,179,8,0.2)' }}>{pending} انتظار</span>
                    </div>
                  </Link>
                )
              })}
            </div>
          )}
        </div>

      </div>
    </div>
  )
}
