'use client'

import { useEffect, useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { getTabSalonId, setTabSalonId } from '@/lib/tabSalonId'

interface StatBooking {
  starts_at: string
  services: { price: number }[]
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
        if (rev[d] !== undefined) rev[d] += Array.isArray(b.services) ? b.services.reduce((s: number, sv: { price: number }) => s + (sv.price ?? 0), 0) : 0
      })
      const values = days.map(d => rev[d])

      // Destroy previous instance
      if (chartRef.current) { chartRef.current.destroy(); chartRef.current = null }

      const ctx = canvas.getContext('2d')!
      const h = canvas.offsetHeight || 260
      const gradient = ctx.createLinearGradient(0, 0, 0, h)
      gradient.addColorStop(0,   'rgba(201,165,90,0.38)')
      gradient.addColorStop(0.4, 'rgba(201,165,90,0.12)')
      gradient.addColorStop(1,   'rgba(201,165,90,0.00)')

      chartRef.current = new Chart(ctx, {
        type: 'line',
        data: {
          labels: days.map(d => d.slice(5)),
          datasets: [{
            data: values,
            borderColor: '#C9A55A',
            backgroundColor: gradient,
            borderWidth: 3,
            tension: 0.5,
            cubicInterpolationMode: 'monotone' as const,
            borderCapStyle: 'round' as const,
            borderJoinStyle: 'round' as const,
            fill: true,
            pointRadius: 0,
            pointHoverRadius: 5,
            pointHoverBackgroundColor: '#C9A55A',
            pointHoverBorderColor: '#0a0a0c',
            pointHoverBorderWidth: 2,
          }],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          interaction: { mode: 'index' as const, intersect: false },
          plugins: {
            legend: { display: false },
            tooltip: {
              backgroundColor: 'rgba(10,10,12,0.97)',
              borderColor: 'rgba(201,165,90,0.25)',
              borderWidth: 1,
              titleColor: 'rgba(255,255,255,0.35)',
              bodyColor: '#C9A55A',
              padding: 12,
              cornerRadius: 10,
              displayColors: false,
              callbacks: { label: (item: { raw: unknown }) => ` ${item.raw} ر.س` },
            },
          },
          scales: {
            x: {
              grid: { display: false },
              border: { display: false },
              ticks: { color: 'rgba(255,255,255,0.18)', font: { size: 10 }, maxTicksLimit: 7 },
            },
            y: {
              grid: { color: 'rgba(255,255,255,0.05)', drawBorder: false },
              border: { display: false },
              ticks: { color: 'rgba(255,255,255,0.18)', font: { size: 10 }, callback: (v: unknown) => `${v}` },
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

  return (
    <div style={{ position: 'relative', height: 300 }}>
      <canvas ref={canvasRef} style={{ filter: 'drop-shadow(0 0 8px rgba(201,165,90,0.55)) drop-shadow(0 0 3px rgba(201,165,90,0.80)) drop-shadow(0 0 20px rgba(201,165,90,0.20))' }} />
    </div>
  )
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
  const [barbers, setBarbers] = useState<{ id: string; name: string }[]>([])
  const [selectedBarber, setSelectedBarber] = useState<string | null>(null)

  // Auth + salon init
  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/dashboard/login'); return }
      let sid = getTabSalonId() ?? (user.app_metadata?.salon_id as string | undefined) ?? null
      if (!sid) {
        const res = await fetch('/api/dashboard/fix-salon-metadata', { method: 'POST' })
        if (res.ok) { const j = await res.json(); sid = j.salon_id ?? null }
      }
      if (sid) setTabSalonId(sid)
      setSalonId(sid)
      if (sid) {
        const { data: b } = await supabase.from('barbers').select('id, name').eq('salon_id', sid).eq('is_deleted', false).order('name')
        setBarbers(b ?? [])
      }
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
        .select('starts_at, services')
        .gte('starts_at', fromISO)
        .lte('starts_at', toISO)
      if (salonId) q = q.eq('salon_id', salonId)
      if (selectedBarber) q = q.eq('barber_id', selectedBarber)
      const { data } = await q
      setBookings(
        (data ?? []).map((b: { starts_at: string; services: { price: number }[] | null }) => ({
          starts_at: b.starts_at,
          services: Array.isArray(b.services) ? b.services : [],
        }))
      )
    }
    fetch()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [from, to, salonId, loading, selectedBarber])

  const revenue = bookings.reduce((s, b) => s + b.services.reduce((ss, sv) => ss + (sv.price ?? 0), 0), 0)

  if (loading) {
    return (
      <div dir="rtl" className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#1a1a1a' }}>
        <p className="text-sm text-gray-500">جارٍ التحميل...</p>
      </div>
    )
  }

  return (
    <div dir="rtl" style={{ minHeight: '100vh', backgroundColor: '#0a0a0c', padding: '24px 16px' }}>
      <div style={{ maxWidth: 720, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 16 }}>

        {/* Header */}
        <div style={{ marginBottom: 4 }}>
          <h1 style={{ fontSize: '0.95rem', fontWeight: 500, color: 'rgba(255,255,255,0.45)', letterSpacing: '0.08em', margin: 0, textTransform: 'uppercase' as const }}>الإحصائيات</h1>
          <p style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.2)', marginTop: 3, letterSpacing: '0.04em' }}>تقرير الإيرادات والحجوزات</p>
        </div>

        {/* Barber filter */}
        {barbers.length > 0 && (
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' as const }}>
            <button onClick={() => setSelectedBarber(null)}
              style={{ padding: '6px 14px', borderRadius: 20, fontSize: '0.78rem', fontWeight: 600, border: '1px solid', cursor: 'pointer', transition: 'all .2s',
                backgroundColor: !selectedBarber ? 'rgba(201,165,90,0.15)' : 'rgba(255,255,255,0.04)',
                borderColor: !selectedBarber ? 'rgba(201,165,90,0.5)' : 'rgba(255,255,255,0.08)',
                color: !selectedBarber ? '#C9A55A' : 'rgba(255,255,255,0.4)' }}>
              الكل
            </button>
            {barbers.map(b => (
              <button key={b.id} onClick={() => setSelectedBarber(b.id)}
                style={{ padding: '6px 14px', borderRadius: 20, fontSize: '0.78rem', fontWeight: 600, border: '1px solid', cursor: 'pointer', transition: 'all .2s',
                  backgroundColor: selectedBarber === b.id ? 'rgba(201,165,90,0.15)' : 'rgba(255,255,255,0.04)',
                  borderColor: selectedBarber === b.id ? 'rgba(201,165,90,0.5)' : 'rgba(255,255,255,0.08)',
                  color: selectedBarber === b.id ? '#C9A55A' : 'rgba(255,255,255,0.4)' }}>
                {b.name}
              </button>
            ))}
          </div>
        )}

        {/* Date range picker */}
        <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 16, padding: '14px 16px', display: 'flex', flexWrap: 'wrap' as const, gap: 12, alignItems: 'flex-end' }}>
          <div style={{ flex: 1, minWidth: 130 }}>
            <label style={{ display: 'block', fontSize: '0.7rem', color: 'rgba(255,255,255,0.3)', marginBottom: 6, fontWeight: 500 }}>من</label>
            <input type="date" value={from} min="2026-01-01" max="2030-12-31" onChange={e => setFrom(e.target.value)}
              style={{ width: '100%', borderRadius: 10, padding: '8px 12px', fontSize: '0.85rem', color: '#fff', border: '1px solid rgba(255,255,255,0.08)', backgroundColor: 'rgba(0,0,0,0.3)', outline: 'none' }} />
          </div>
          <div style={{ flex: 1, minWidth: 130 }}>
            <label style={{ display: 'block', fontSize: '0.7rem', color: 'rgba(255,255,255,0.3)', marginBottom: 6, fontWeight: 500 }}>إلى</label>
            <input type="date" value={to} min="2026-01-01" max="2030-12-31" onChange={e => setTo(e.target.value)}
              style={{ width: '100%', borderRadius: 10, padding: '8px 12px', fontSize: '0.85rem', color: '#fff', border: '1px solid rgba(255,255,255,0.08)', backgroundColor: 'rgba(0,0,0,0.3)', outline: 'none' }} />
          </div>
        </div>

        {/* Stats cards */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 20, padding: '20px 18px' }}>
            <p style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.3)', fontWeight: 500, marginBottom: 8 }}>عدد الحجوزات</p>
            <p style={{ fontSize: '2.5rem', fontWeight: 900, color: '#fff', lineHeight: 1, letterSpacing: '-0.03em' }}>{bookings.length}</p>
            <p style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.2)', marginTop: 6 }}>حجز</p>
          </div>
          <div style={{ background: 'linear-gradient(135deg, rgba(201,165,90,0.08) 0%, rgba(201,165,90,0.03) 100%)', border: '1px solid rgba(201,165,90,0.18)', borderRadius: 20, padding: '20px 18px', boxShadow: '0 0 40px rgba(201,165,90,0.05)', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: 0, left: '15%', right: '15%', height: 1, background: 'linear-gradient(90deg, transparent, rgba(201,165,90,0.7), transparent)' }} />
            <p style={{ fontSize: '0.7rem', color: 'rgba(201,165,90,0.55)', fontWeight: 500, marginBottom: 8 }}>الإيرادات</p>
            <p style={{ fontSize: '2.5rem', fontWeight: 900, lineHeight: 1, letterSpacing: '-0.03em', background: 'linear-gradient(120deg,#e8c97a 0%,#C9A55A 60%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text', margin: 0 }}>{revenue}</p>
            <p style={{ fontSize: '1rem', color: '#C9A55A', marginTop: 4, fontWeight: 600 }}>ر.س</p>
          </div>
        </div>

        {/* Chart card */}
        <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 20, padding: '20px 18px', boxShadow: '0 24px 64px rgba(0,0,0,0.4), inset 0 0 80px rgba(201,165,90,0.03)', position: 'relative', overflow: 'hidden' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: '#C9A55A', boxShadow: '0 0 8px rgba(201,165,90,0.6)', display: 'inline-block', animation: 'pulse-dot 2s ease-in-out infinite' }} />
              <style>{`@keyframes pulse-dot { 0%,100%{box-shadow:0 0 6px rgba(201,165,90,0.5)} 50%{box-shadow:0 0 14px rgba(201,165,90,0.9)} }`}</style>
              <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'rgba(255,255,255,0.75)' }}>الإيرادات اليومية</span>
            </div>
            <span style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.2)', fontWeight: 500 }}>{from} — {to}</span>
          </div>
          <DailyChart bookings={bookings} from={from} to={to} />
        </div>

      </div>
    </div>
  )
}
