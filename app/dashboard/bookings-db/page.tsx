'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { getTabSalonId } from '@/lib/tabSalonId'

const PAGE_SIZE = 20

interface Booking {
  id: string
  starts_at: string
  status: string
  payment_status: string | null
  customers: { name: string; phone: string } | null
  barbers: { name: string } | null
  services: { name_ar: string; price: number }[]
}

const STATUS_LABEL: Record<string, string> = {
  pending: 'انتظار',
  confirmed: 'مؤكد',
  completed: 'مكتمل',
  cancelled: 'ملغي',
}

const STATUS_COLOR: Record<string, string> = {
  pending: '#facc15',
  confirmed: '#4ade80',
  completed: '#9ca3af',
  cancelled: '#f87171',
}

function fmt(iso: string) {
  const d = new Date(iso)
  const date = `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`
  const h = d.getHours(), m = d.getMinutes().toString().padStart(2, '0')
  const period = h >= 12 ? 'م' : 'ص'
  const hour = h % 12 || 12
  return `${date} ${hour}:${m}${period}`
}

export default function BookingsDbPage() {
  const router = useRouter()
  const supabase = createClient()

  const [rows, setRows] = useState<Booking[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [loading, setLoading] = useState(true)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  async function deleteBooking(id: string) {
    if (!confirm('تأكيد الحذف؟')) return
    setDeletingId(id)
    await supabase.from('bookings').delete().eq('id', id)
    setRows(prev => prev.filter(b => b.id !== id))
    setTotal(prev => prev - 1)
    setDeletingId(null)
  }

  async function load(p: number, f: string, t: string) {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/dashboard/login'); return }

    const salonId = getTabSalonId()
    const start = (p - 1) * PAGE_SIZE
    const end = start + PAGE_SIZE - 1

    let q = supabase
      .from('bookings')
      .select('id, starts_at, status, payment_status, customers(name,phone), barbers(name), services', { count: 'exact' })
      .order('starts_at', { ascending: false })
      .range(start, end)

    if (salonId) q = q.eq('salon_id', salonId)
    if (f) q = q.gte('starts_at', new Date(f).toISOString())
    if (t) {
      const tDate = new Date(t)
      tDate.setDate(tDate.getDate() + 1)
      q = q.lt('starts_at', tDate.toISOString())
    }

    const { data, count } = await q
    const norm = (data ?? []).map((b: any) => ({
      ...b,
      customers: Array.isArray(b.customers) ? (b.customers[0] ?? null) : (b.customers ?? null),
      barbers: Array.isArray(b.barbers) ? (b.barbers[0] ?? null) : (b.barbers ?? null),
      services: b.services || [],
    }))

    setRows(norm)
    setTotal(count ?? 0)
    setLoading(false)
  }

  useEffect(() => { load(1, '', '') }, [])

  function applyFilter() { setPage(1); load(1, from, to) }
  function goPage(p: number) { setPage(p); load(p, from, to) }

  const totalPages = Math.ceil(total / PAGE_SIZE)

  return (
    <div dir="rtl" style={{ backgroundColor: '#0a0a0c', minHeight: '100vh', padding: '24px 16px', fontFamily: 'inherit' }}>
      <div style={{ maxWidth: 900, margin: '0 auto' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <div>
            <h1 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#fff', margin: 0 }}>قاعدة بيانات الحجوزات</h1>
            <p style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.28)', marginTop: 2 }}>{total} حجز إجمالي</p>
          </div>
          <Link href="/dashboard" style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)', textDecoration: 'none', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, padding: '6px 12px' }}>
            ← العودة
          </Link>
        </div>

        {/* Date filter */}
        <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end', marginBottom: 16, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <label style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.3)' }}>من</label>
            <input type="date" value={from} onChange={e => setFrom(e.target.value)}
              style={{ backgroundColor: '#1a1a1a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, padding: '7px 10px', color: '#fff', fontSize: '0.8rem', outline: 'none' }} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <label style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.3)' }}>إلى</label>
            <input type="date" value={to} onChange={e => setTo(e.target.value)}
              style={{ backgroundColor: '#1a1a1a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, padding: '7px 10px', color: '#fff', fontSize: '0.8rem', outline: 'none' }} />
          </div>
          <button onClick={applyFilter}
            style={{ backgroundColor: '#C9A55A', color: '#1a1a1a', border: 'none', borderRadius: 8, padding: '8px 18px', fontWeight: 700, fontSize: '0.8rem', cursor: 'pointer' }}>
            تصفية
          </button>
          {(from || to) && (
            <button onClick={() => { setFrom(''); setTo(''); setPage(1); load(1, '', '') }}
              style={{ backgroundColor: 'transparent', color: 'rgba(255,255,255,0.35)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, padding: '8px 14px', fontSize: '0.8rem', cursor: 'pointer' }}>
              مسح
            </button>
          )}
        </div>

        {/* Table */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: 'rgba(255,255,255,0.25)', fontSize: '0.85rem' }}>جارٍ التحميل...</div>
        ) : rows.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: 'rgba(255,255,255,0.2)', fontSize: '0.85rem' }}>لا توجد نتائج</div>
        ) : (
          <div style={{ overflowX: 'auto', borderRadius: 14, border: '1px solid rgba(255,255,255,0.07)' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
              <thead>
                <tr style={{ backgroundColor: '#111113', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
                  {['#', 'العميل', 'الجوال', 'الخدمات', 'الحلاق', 'التاريخ', 'الحالة', 'الدفع', 'المبلغ', ''].map((h, i) => (
                    <th key={i} style={{ padding: '10px 12px', color: 'rgba(255,255,255,0.35)', fontWeight: 600, textAlign: 'right', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((b, i) => {
                  const total = b.services.reduce((s, sv) => s + (sv.price ?? 0), 0)
                  const rowN = (page - 1) * PAGE_SIZE + i + 1
                  return (
                    <tr key={b.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', backgroundColor: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.015)' }}>
                      <td style={{ padding: '10px 12px', color: 'rgba(255,255,255,0.2)' }}>{rowN}</td>
                      <td style={{ padding: '10px 12px', color: '#fff', fontWeight: 600, whiteSpace: 'nowrap' }}>{b.customers?.name ?? '—'}</td>
                      <td style={{ padding: '10px 12px', color: 'rgba(255,255,255,0.5)', direction: 'ltr', textAlign: 'right' }}>{b.customers?.phone ?? '—'}</td>
                      <td style={{ padding: '10px 12px', color: 'rgba(255,255,255,0.6)', maxWidth: 180 }}>
                        {b.services.length > 0 ? b.services.map(s => s.name_ar).join('، ') : '—'}
                      </td>
                      <td style={{ padding: '10px 12px', color: 'rgba(255,255,255,0.55)', whiteSpace: 'nowrap' }}>{b.barbers?.name ?? '—'}</td>
                      <td style={{ padding: '10px 12px', color: 'rgba(255,255,255,0.5)', whiteSpace: 'nowrap', direction: 'ltr', textAlign: 'right' }}>{fmt(b.starts_at)}</td>
                      <td style={{ padding: '10px 12px' }}>
                        <span style={{ fontSize: '0.72rem', padding: '2px 8px', borderRadius: 20, fontWeight: 600, color: STATUS_COLOR[b.status] ?? '#9ca3af', backgroundColor: `${STATUS_COLOR[b.status] ?? '#9ca3af'}18` }}>
                          {STATUS_LABEL[b.status] ?? b.status}
                        </span>
                      </td>
                      <td style={{ padding: '10px 12px' }}>
                        <span style={{ fontSize: '0.72rem', padding: '2px 8px', borderRadius: 20, fontWeight: 600, color: b.payment_status === 'paid' ? '#4ade80' : '#f87171', backgroundColor: b.payment_status === 'paid' ? '#4ade8018' : '#f8717118' }}>
                          {b.payment_status === 'paid' ? 'مدفوع' : 'غير مدفوع'}
                        </span>
                      </td>
                      <td style={{ padding: '10px 12px', color: '#C9A55A', fontWeight: 700, whiteSpace: 'nowrap' }}>{total} ر.س</td>
                      <td style={{ padding: '10px 12px' }}>
                        <button onClick={() => deleteBooking(b.id)} disabled={deletingId === b.id}
                          style={{ background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.25)', borderRadius: 7, padding: '4px 10px', color: '#f87171', fontSize: '0.72rem', cursor: 'pointer', fontWeight: 600 }}>
                          {deletingId === b.id ? '...' : 'حذف'}
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 6, marginTop: 16, flexWrap: 'wrap' }}>
            <button onClick={() => goPage(page - 1)} disabled={page === 1}
              style={{ padding: '6px 14px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)', backgroundColor: 'transparent', color: page === 1 ? 'rgba(255,255,255,0.15)' : '#fff', cursor: page === 1 ? 'default' : 'pointer', fontSize: '0.8rem' }}>
              السابق
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter(p => p === 1 || p === totalPages || Math.abs(p - page) <= 2)
              .reduce<(number | '...')[]>((acc, p, idx, arr) => {
                if (idx > 0 && p - (arr[idx - 1] as number) > 1) acc.push('...')
                acc.push(p)
                return acc
              }, [])
              .map((p, i) => p === '...' ? (
                <span key={`dots-${i}`} style={{ color: 'rgba(255,255,255,0.2)', fontSize: '0.8rem' }}>...</span>
              ) : (
                <button key={p} onClick={() => goPage(p as number)}
                  style={{ padding: '6px 12px', borderRadius: 8, border: '1px solid', borderColor: page === p ? '#C9A55A' : 'rgba(255,255,255,0.1)', backgroundColor: page === p ? 'rgba(201,165,90,0.15)' : 'transparent', color: page === p ? '#C9A55A' : 'rgba(255,255,255,0.5)', cursor: 'pointer', fontSize: '0.8rem', fontWeight: page === p ? 700 : 400 }}>
                  {p}
                </button>
              ))
            }
            <button onClick={() => goPage(page + 1)} disabled={page === totalPages}
              style={{ padding: '6px 14px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)', backgroundColor: 'transparent', color: page === totalPages ? 'rgba(255,255,255,0.15)' : '#fff', cursor: page === totalPages ? 'default' : 'pointer', fontSize: '0.8rem' }}>
              التالي
            </button>
          </div>
        )}

        {/* Page info */}
        {total > 0 && (
          <p style={{ textAlign: 'center', fontSize: '0.7rem', color: 'rgba(255,255,255,0.2)', marginTop: 10 }}>
            صفحة {page} من {totalPages} — إجمالي {total} حجز
          </p>
        )}

      </div>
    </div>
  )
}
