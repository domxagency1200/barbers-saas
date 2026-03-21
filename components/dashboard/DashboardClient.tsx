'use client'

import { useEffect, useRef, useState } from 'react'

interface Booking {
  id: string
  starts_at: string
  ends_at: string
  status: string
  customers: { name: string; phone: string } | null
  barbers: { name: string } | null
  services: { name_ar: string; price: number } | null
}

interface StatBooking {
  starts_at: string
  status: string
  services: { price: number } | null
}

interface Props {
  todayBookings: Booking[]
  yearBookings: StatBooking[]
}

const STATUS_LABEL: Record<string, string> = {
  pending: 'قيد الانتظار',
  confirmed: 'مؤكد',
  completed: 'مكتمل',
  cancelled: 'ملغي',
}

const STATUS_COLOR: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-700',
  confirmed: 'bg-green-100 text-green-700',
  completed: 'bg-gray-100 text-gray-600',
  cancelled: 'bg-red-100 text-red-600',
}

const ARABIC_MONTHS = ['يناير','فبراير','مارس','أبريل','مايو','يونيو','يوليو','أغسطس','سبتمبر','أكتوبر','نوفمبر','ديسمبر']

function formatTime(iso: string) {
  const d = new Date(iso)
  const h = d.getHours()
  const m = d.getMinutes().toString().padStart(2, '0')
  const period = h >= 12 ? 'م' : 'ص'
  const hour = h % 12 || 12
  return `${hour}:${m} ${period}`
}

function computePeriod(bookings: StatBooking[], period: 'day' | 'week' | 'month' | 'year') {
  const now = new Date()
  const filtered = bookings.filter(b => {
    const d = new Date(b.starts_at)
    if (period === 'day') return d.toDateString() === now.toDateString()
    if (period === 'week') {
      const weekAgo = new Date(now); weekAgo.setDate(now.getDate() - 7)
      return d >= weekAgo
    }
    if (period === 'month') return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
    return d.getFullYear() === now.getFullYear()
  })
  return {
    count: filtered.length,
    revenue: filtered.reduce((s, b) => s + (b.services?.price ?? 0), 0),
  }
}

function LineChart({ yearBookings }: { yearBookings: StatBooking[] }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const counts = Array(12).fill(0)
    yearBookings.forEach(b => { counts[new Date(b.starts_at).getMonth()]++ })

    const W = canvas.width, H = canvas.height
    const padL = 30, padR = 16, padT = 16, padB = 36
    const chartW = W - padL - padR
    const chartH = H - padT - padB
    const max = Math.max(...counts, 1)

    ctx.clearRect(0, 0, W, H)

    // Grid lines
    ctx.strokeStyle = '#f0f0f0'
    ctx.lineWidth = 1
    for (let i = 0; i <= 4; i++) {
      const y = padT + (chartH / 4) * i
      ctx.beginPath(); ctx.moveTo(padL, y); ctx.lineTo(W - padR, y); ctx.stroke()
      ctx.fillStyle = '#9ca3af'
      ctx.font = '10px sans-serif'
      ctx.textAlign = 'right'
      ctx.fillText(String(Math.round(max - (max / 4) * i)), padL - 4, y + 4)
    }

    // Month labels
    ctx.fillStyle = '#9ca3af'
    ctx.font = '9px sans-serif'
    ctx.textAlign = 'center'
    const now = new Date()
    for (let i = 0; i < 12; i++) {
      const x = padL + (chartW / 11) * i
      ctx.fillText(ARABIC_MONTHS[i].slice(0, 3), x, H - 8)
    }

    // Line
    ctx.beginPath()
    ctx.strokeStyle = '#000'
    ctx.lineWidth = 2
    ctx.lineJoin = 'round'
    counts.forEach((v, i) => {
      const x = padL + (chartW / 11) * i
      const y = padT + chartH - (v / max) * chartH
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)
    })
    ctx.stroke()

    // Fill under line
    const grad = ctx.createLinearGradient(0, padT, 0, H - padB)
    grad.addColorStop(0, 'rgba(0,0,0,0.08)')
    grad.addColorStop(1, 'rgba(0,0,0,0)')
    ctx.lineTo(padL + chartW, H - padB)
    ctx.lineTo(padL, H - padB)
    ctx.closePath()
    ctx.fillStyle = grad
    ctx.fill()

    // Dots
    counts.forEach((v, i) => {
      const x = padL + (chartW / 11) * i
      const y = padT + chartH - (v / max) * chartH
      ctx.beginPath()
      ctx.arc(x, y, 3, 0, Math.PI * 2)
      ctx.fillStyle = i === now.getMonth() ? '#000' : '#6b7280'
      ctx.fill()
    })
  }, [yearBookings])

  return (
    <canvas
      ref={canvasRef}
      width={340}
      height={180}
      className="w-full"
      style={{ maxHeight: 180 }}
    />
  )
}

export default function DashboardClient({ todayBookings, yearBookings }: Props) {
  const [tab, setTab] = useState<'today' | 'stats'>('today')
  const [period, setPeriod] = useState<'day' | 'week' | 'month' | 'year'>('month')

  const todayRevenue = todayBookings.reduce((s, b) => s + (b.services?.price ?? 0), 0)
  const stats = computePeriod(yearBookings, period)

  const PERIODS = [
    { key: 'day', label: 'اليوم' },
    { key: 'week', label: 'الأسبوع' },
    { key: 'month', label: 'الشهر' },
    { key: 'year', label: 'السنة' },
  ] as const

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col max-w-md mx-auto" dir="rtl">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-4">
        <h1 className="text-lg font-bold text-gray-900">لوحة التحكم</h1>
      </div>

      <div className="flex-1 overflow-y-auto pb-20">
        {/* TODAY TAB */}
        {tab === 'today' && (
          <div className="p-4 space-y-4">
            {/* Summary cards */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-sm">
                <p className="text-xs text-gray-400 mb-1">حجوزات اليوم</p>
                <p className="text-3xl font-bold text-gray-900">{todayBookings.length}</p>
              </div>
              <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-sm">
                <p className="text-xs text-gray-400 mb-1">إيرادات اليوم</p>
                <p className="text-3xl font-bold text-gray-900">{todayRevenue}</p>
                <p className="text-xs text-gray-400">ر.س</p>
              </div>
            </div>

            {/* Booking list */}
            <h2 className="text-sm font-semibold text-gray-500 px-1">الحجوزات</h2>
            {todayBookings.length === 0 ? (
              <div className="bg-white rounded-2xl border border-gray-200 p-8 text-center shadow-sm">
                <p className="text-gray-400 text-sm">لا توجد حجوزات اليوم</p>
              </div>
            ) : (
              <div className="space-y-3">
                {todayBookings.map(b => (
                  <div key={b.id} className="bg-white rounded-2xl border border-gray-200 p-4 shadow-sm space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="font-semibold text-gray-900 text-sm">{b.customers?.name ?? '—'}</p>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLOR[b.status] ?? 'bg-gray-100 text-gray-600'}`}>
                        {STATUS_LABEL[b.status] ?? b.status}
                      </span>
                    </div>
                    <p className="text-xs text-gray-400">{b.customers?.phone}</p>
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span>{b.services?.name_ar ?? '—'}</span>
                      <span className="font-medium text-gray-700">{formatTime(b.starts_at)}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs text-gray-400">
                      <span>{b.barbers?.name ?? '—'}</span>
                      <span>{b.services?.price ?? 0} ر.س</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* STATS TAB */}
        {tab === 'stats' && (
          <div className="p-4 space-y-4">
            {/* Period selector */}
            <div className="bg-white rounded-2xl border border-gray-200 p-1 flex shadow-sm">
              {PERIODS.map(p => (
                <button
                  key={p.key}
                  onClick={() => setPeriod(p.key)}
                  className={`flex-1 py-2 rounded-xl text-xs font-medium transition-all ${
                    period === p.key ? 'bg-black text-white' : 'text-gray-500'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>

            {/* Stats cards */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-sm">
                <p className="text-xs text-gray-400 mb-1">عدد الحجوزات</p>
                <p className="text-3xl font-bold text-gray-900">{stats.count}</p>
              </div>
              <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-sm">
                <p className="text-xs text-gray-400 mb-1">الإيرادات</p>
                <p className="text-3xl font-bold text-gray-900">{stats.revenue}</p>
                <p className="text-xs text-gray-400">ر.س</p>
              </div>
            </div>

            {/* Chart */}
            <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-sm">
              <p className="text-sm font-semibold text-gray-700 mb-3">نمو الحجوزات هذا العام</p>
              <LineChart yearBookings={yearBookings} />
            </div>
          </div>
        )}
      </div>

      {/* Bottom nav */}
      <div className="fixed bottom-0 inset-x-0 max-w-md mx-auto bg-white border-t border-gray-200 flex">
        <button
          onClick={() => setTab('today')}
          className={`flex-1 py-4 text-sm font-medium transition-colors ${tab === 'today' ? 'text-black border-t-2 border-black -mt-px' : 'text-gray-400'}`}
        >
          اليوم
        </button>
        <button
          onClick={() => setTab('stats')}
          className={`flex-1 py-4 text-sm font-medium transition-colors ${tab === 'stats' ? 'text-black border-t-2 border-black -mt-px' : 'text-gray-400'}`}
        >
          الإحصائيات
        </button>
      </div>
    </div>
  )
}
