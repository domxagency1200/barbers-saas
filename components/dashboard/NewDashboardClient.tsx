'use client'

import { useState } from 'react'
import Link from 'next/link'

// ── Types ────────────────────────────────────────────────────

interface Booking {
  id: string
  starts_at: string
  ends_at: string
  status: string
  barber_id: string | null
  customers: { name: string; phone: string } | null
  barbers: { name: string } | null
  services: { name_ar: string; price: number } | null
}

interface Props {
  todayBookings: Booking[]
  monthBookings: Booking[]
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

function formatTime(iso: string) {
  const d = new Date(iso)
  const h = d.getHours()
  const m = d.getMinutes().toString().padStart(2, '0')
  const period = h >= 12 ? 'م' : 'ص'
  const hour = h % 12 || 12
  return `${hour}:${m} ${period}`
}

function isSameDay(iso: string, year: number, month: number, day: number) {
  const d = new Date(iso)
  return d.getFullYear() === year && d.getMonth() === month && d.getDate() === day
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
  return (
    <div className="rounded-xl border border-white/10 p-3 space-y-1.5" style={{ backgroundColor: '#242424' }}>
      <div className="flex items-center justify-between gap-1">
        <p className="font-semibold text-white text-sm truncate">{b.customers?.name ?? '—'}</p>
        <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium shrink-0 ${STATUS_COLOR[b.status] ?? 'bg-white/10 text-gray-400'}`}>
          {STATUS_LABEL[b.status] ?? b.status}
        </span>
      </div>
      <p className="text-xs text-gray-500">{b.customers?.phone ?? '—'}</p>
      <p className="text-xs text-gray-400">{b.services?.name_ar ?? '—'}</p>
      <div className="flex items-center justify-between text-xs">
        <span className="font-medium text-gray-300">{formatTime(b.starts_at)}</span>
        <span style={{ color: '#D4A843' }}>{b.services?.price ?? 0} ر.س</span>
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
    <div className="rounded-2xl border border-white/10 p-4" style={{ backgroundColor: '#242424' }}>
      <p className="text-sm font-semibold mb-3 text-center" style={{ color: '#D4A843' }}>
        {ARABIC_MONTHS[month]} {year}
      </p>
      <div className="grid grid-cols-7 gap-1 mb-1">
        {ARABIC_DAYS_SHORT.map(d => (
          <div key={d} className="text-center text-xs text-gray-500 py-1">{d}</div>
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
                backgroundColor: isToday ? '#D4A843' : isSelected ? '#2e2e2e' : undefined,
                color: isToday ? '#1a1a1a' : isSelected ? 'white' : '#9ca3af',
              }}
            >
              {day}
              {countsByDay[day] ? (
                <span
                  className="absolute bottom-0.5 w-1 h-1 rounded-full"
                  style={{ backgroundColor: isToday ? '#1a1a1a' : '#D4A843' }}
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

export default function NewDashboardClient({ todayBookings, monthBookings }: Props) {
  const now = new Date()
  const [selectedDay, setSelectedDay] = useState(now.getDate())

  const barberGroups = groupByBarber(todayBookings)
  const todayRevenue = todayBookings.reduce((s, b) => s + (b.services?.price ?? 0), 0)

  const selectedDayBookings = monthBookings.filter(b =>
    isSameDay(b.starts_at, now.getFullYear(), now.getMonth(), selectedDay)
  )

  return (
    <div className="p-4 space-y-6 max-w-5xl mx-auto">

      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-2xl border border-white/10 p-4" style={{ backgroundColor: '#242424' }}>
          <p className="text-xs text-gray-500 mb-1">حجوزات اليوم</p>
          <p className="text-3xl font-bold text-white">{todayBookings.length}</p>
        </div>
        <div className="rounded-2xl border border-white/10 p-4" style={{ backgroundColor: '#242424' }}>
          <p className="text-xs text-gray-500 mb-1">إيرادات اليوم</p>
          <p className="text-3xl font-bold" style={{ color: '#D4A843' }}>{todayRevenue}</p>
          <p className="text-xs text-gray-500">ر.س</p>
        </div>
      </div>

      {/* Monthly calendar */}
      <div>
        <h2 className="text-sm font-semibold text-gray-500 mb-3 px-1">التقويم الشهري</h2>
        <MonthCalendar
          year={now.getFullYear()}
          month={now.getMonth()}
          bookings={monthBookings}
          selectedDay={selectedDay}
          onSelectDay={setSelectedDay}
        />
      </div>

      {/* Selected day bookings */}
      <div>
        <h2 className="text-sm font-semibold text-gray-500 mb-3 px-1">
          حجوزات {selectedDay} {ARABIC_MONTHS[now.getMonth()]}
        </h2>
        {selectedDayBookings.length === 0 ? (
          <div className="rounded-2xl border border-white/10 p-6 text-center" style={{ backgroundColor: '#242424' }}>
            <p className="text-gray-500 text-sm">لا توجد حجوزات في هذا اليوم</p>
          </div>
        ) : (
          <div className="space-y-2">
            {groupByBarber(selectedDayBookings).map(({ id: barberId, name, bookings: bList }) => {
              const now2 = new Date()
              const completed = bList.filter(b => new Date(b.ends_at) < now2).length
              const pending = bList.filter(b => new Date(b.ends_at) >= now2 || b.status === 'pending').length
              const dateParam = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(selectedDay).padStart(2, '0')}`
              return (
                <Link
                  key={barberId ?? name}
                  href={barberId ? `/dashboard/bookings/${barberId}?date=${dateParam}` : '#'}
                  className="rounded-2xl border border-white/10 p-4 flex items-center justify-between block"
                  style={{ backgroundColor: '#242424' }}
                >
                  <p className="font-semibold text-white text-sm">{name}</p>
                  <div className="flex items-center gap-2">
                    <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-green-900/40 text-green-400">{completed} منجز</span>
                    <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-yellow-900/40 text-yellow-400">{pending} قيد الانتظار</span>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </div>

    </div>
  )
}
