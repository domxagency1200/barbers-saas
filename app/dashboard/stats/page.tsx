'use client'

import { useEffect, useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

interface StatBooking {
  starts_at: string
  services: { price: number } | null
}

// ── Helpers ───────────────────────────────────────────────────

function toDateStr(d: Date) {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function firstOfMonth() {
  const d = new Date()
  return toDateStr(new Date(d.getFullYear(), d.getMonth(), 1))
}

// ── Chart ────────────────────────────────────────────────────

const CDN = 'https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.1/chart.umd.min.js'

function DailyChart({ bookings, from, to }: { bookings: StatBooking[]; from: string; to: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const chartRef = useRef<any>(null)

  useEffect(() => {
    function build() {
      const canvas = canvasRef.current
      if (!canvas) return
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const Chart = (window as any).Chart
      if (!Chart) return

      // Build day array
      const days: string[] = []
      const cur = new Date(from + 'T00:00:00')
      const end = new Date(to + 'T00:00:00')
      while (cur <= end) { days.push(toDateStr(cur)); cur.setDate(cur.getDate() + 1) }
      if (days.length === 0) return

      // Sum revenue per day
      const rev: Record<string, number> = {}
      days.forEach(d => { rev[d] = 0 })
      bookings.forEach(b => {
        const d = toDateStr(new Date(b.starts_at))
        if (rev[d] !== undefined) rev[d] += b.services?.price ?? 0
      })
      const values = days.map(d => rev[d])

      // Destroy previous instance
      if (chartRef.current) { chartRef.current.destroy(); chartRef.current = null }

      const ctx = canvas.getContext('2d')!
      const gradient = ctx.createLinearGradient(0, 0, 0, canvas.offsetHeight || 200)
      gradient.addColorStop(0, 'rgba(212,168,67,0.45)')
      gradient.addColorStop(1, 'rgba(212,168,67,0)')

      chartRef.current = new Chart(ctx, {
        type: 'line',
        data: {
          labels: days.map(d => d.slice(5)),
          datasets: [{
            data: values,
            borderColor: '#D4A843',
            backgroundColor: gradient,
            borderWidth: 2,
            tension: 0.4,
            fill: true,
            pointBackgroundColor: '#D4A843',
            pointBorderColor: '#D4A843',
            pointRadius: 3,
            pointHoverRadius: 5,
          }],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { display: false }, tooltip: { callbacks: {
            label: (item: { raw: unknown }) => ` ${item.raw} ر.س`,
          }}},
          scales: {
            x: {
              grid: { color: 'rgba(255,255,255,0.05)' },
              ticks: { color: '#6b7280', font: { size: 11 }, maxTicksLimit: 7 },
            },
            y: {
              grid: { color: 'rgba(255,255,255,0.05)' },
              ticks: { color: '#6b7280', font: { size: 11 }, callback: (v: unknown) => `${v} ر.س` },
            },
          },
        },
      })
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if ((window as any).Chart) {
      build()
    } else {
      const existing = document.querySelector(`script[src="${CDN}"]`)
      if (existing) { existing.addEventListener('load', build) }
      else {
        const s = document.createElement('script')
        s.src = CDN
        s.onload = build
        document.head.appendChild(s)
      }
    }

    return () => { if (chartRef.current) { chartRef.current.destroy(); chartRef.current = null } }
  }, [bookings, from, to])

  return <div style={{ position: 'relative', height: 220 }}><canvas ref={canvasRef} /></div>
}

// ── Page ──────────────────────────────────────────────────────

export default function StatsPage() {
  const router = useRouter()
  const supabase = createClient()

  const today = toDateStr(new Date())
  const [from, setFrom] = useState('2026-03-01')
  const [to, setTo] = useState(today)
  const [bookings, setBookings] = useState<StatBooking[]>([])
  const [loading, setLoading] = useState(true)
  const [salonId, setSalonId] = useState<string | null>(null)

  // Auth + salon init
  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/dashboard/login'); return }
      const { data: member } = await supabase
        .from('salon_members')
        .select('salon_id')
        .eq('user_id', user.id)
        .single()
      setSalonId(member?.salon_id ?? null)
      setLoading(false)
    }
    init()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Fetch whenever range or salonId changes
  useEffect(() => {
    if (loading) return
    async function fetch() {
      const fromISO = from + 'T00:00:00'
      const toISO   = to   + 'T23:59:59'
      let q = supabase
        .from('bookings')
        .select('starts_at, services(price)')
        .gte('starts_at', fromISO)
        .lte('starts_at', toISO)
      if (salonId) q = q.eq('salon_id', salonId)
      const { data } = await q
      setBookings((data as StatBooking[]) ?? [])
    }
    fetch()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [from, to, salonId, loading])

  const revenue = bookings.reduce((s, b) => s + (b.services?.price ?? 0), 0)

  if (loading) {
    return (
      <div dir="rtl" className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#1a1a1a' }}>
        <p className="text-sm text-gray-500">جارٍ التحميل...</p>
      </div>
    )
  }

  return (
    <div dir="rtl" className="p-4 space-y-4 max-w-2xl mx-auto">

      {/* Date range picker */}
      <div className="rounded-2xl border border-white/10 p-4 flex flex-wrap gap-4 items-end" style={{ backgroundColor: '#242424' }}>
        <div className="flex-1 min-w-[130px]">
          <label className="block text-xs text-gray-500 mb-1">من</label>
          <input
            type="date"
            value={from}
            min="2026-01-01"
            max="2030-12-31"
            onChange={e => setFrom(e.target.value)}
            className="w-full rounded-xl px-3 py-2 text-sm text-white border border-white/10 bg-[#1a1a1a] focus:outline-none focus:ring-1 focus:ring-[#D4A843]"
          />
        </div>
        <div className="flex-1 min-w-[130px]">
          <label className="block text-xs text-gray-500 mb-1">إلى</label>
          <input
            type="date"
            value={to}
            min="2026-01-01"
            max="2030-12-31"
            onChange={e => setTo(e.target.value)}
            className="w-full rounded-xl px-3 py-2 text-sm text-white border border-white/10 bg-[#1a1a1a] focus:outline-none focus:ring-1 focus:ring-[#D4A843]"
          />
        </div>
      </div>

      {/* Cards */}
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-2xl border border-white/10 p-4" style={{ backgroundColor: '#242424' }}>
          <p className="text-xs text-gray-500 mb-1">عدد الحجوزات</p>
          <p className="text-3xl font-bold text-white">{bookings.length}</p>
        </div>
        <div className="rounded-2xl border border-white/10 p-4" style={{ backgroundColor: '#242424' }}>
          <p className="text-xs text-gray-500 mb-1">الإيرادات</p>
          <p className="text-3xl font-bold" style={{ color: '#D4A843' }}>{revenue}</p>
          <p className="text-xs text-gray-500">ر.س</p>
        </div>
      </div>

      {/* Chart */}
      <div className="rounded-2xl border border-white/10 p-4" style={{ backgroundColor: '#242424' }}>
        <p className="text-sm font-semibold mb-3" style={{ color: '#D4A843' }}>الحجوزات اليومية</p>
        <DailyChart bookings={bookings} from={from} to={to} />
      </div>

    </div>
  )
}
