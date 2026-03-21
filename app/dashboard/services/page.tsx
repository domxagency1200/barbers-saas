'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

// ── Types ────────────────────────────────────────────────────

interface Service {
  id: string
  name_ar: string
  price: number
  duration_min: number
  is_active: boolean
}

// ── Icons ────────────────────────────────────────────────────

function IconEdit() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4Z" />
    </svg>
  )
}

function IconTrash() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
      <path d="M10 11v6M14 11v6" />
      <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
    </svg>
  )
}

// ── Toggle ────────────────────────────────────────────────────

function Toggle({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!value)}
      className="relative w-10 h-5 rounded-full transition-colors shrink-0"
      style={{ backgroundColor: value ? '#D4A843' : '#374151' }}
    >
      <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${value ? 'translate-x-5' : 'translate-x-0.5'}`} />
    </button>
  )
}

// ── Input style ───────────────────────────────────────────────

const inputCls = 'w-full rounded-xl px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:ring-1 border border-white/10 bg-[#1a1a1a] focus:ring-[#D4A843]'

// ── Page ──────────────────────────────────────────────────────

export default function ServicesPage() {
  const router = useRouter()
  const supabase = createClient()

  const [salonId, setSalonId] = useState<string | null>(null)
  const [services, setServices] = useState<Service[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [editingId, setEditingId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState({ name_ar: '', price: '', is_active: true })
  const [savingId, setSavingId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const [adding, setAdding] = useState(false)
  const [newForm, setNewForm] = useState({ name_ar: '', price: '' })
  const [savingNew, setSavingNew] = useState(false)

  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/dashboard/login'); return }
      const { data: member } = await supabase.from('salon_members').select('salon_id').eq('user_id', user.id).single()
      const sid = member?.salon_id ?? null
      setSalonId(sid)
      await loadServices(sid)
    }
    init()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function loadServices(sid: string | null) {
    setLoading(true); setError(null)
    let q = supabase.from('services').select('id, name_ar, price, duration_min, is_active').order('name_ar', { ascending: true })
    if (sid) q = q.eq('salon_id', sid)
    const { data, error: fetchError } = await q
    if (fetchError) { setError('تعذّر تحميل الخدمات'); setLoading(false); return }
    if (!data || data.length === 0) {
      const defaults = [
        { name_ar: 'قص شعر',   price: 50, duration_min: 30, is_active: true, ...(sid ? { salon_id: sid } : {}) },
        { name_ar: 'حلاقة دقن', price: 30, duration_min: 20, is_active: true, ...(sid ? { salon_id: sid } : {}) },
      ]
      const { data: inserted, error: insertError } = await supabase.from('services').insert(defaults).select('id, name_ar, price, duration_min, is_active')
      if (insertError) { setError('تعذّر إضافة الخدمات الافتراضية'); setLoading(false); return }
      setServices(inserted ?? [])
    } else {
      setServices(data)
    }
    setLoading(false)
  }

  function startEdit(s: Service) {
    setEditingId(s.id); setEditForm({ name_ar: s.name_ar, price: String(s.price), is_active: s.is_active })
    setDeletingId(null); setAdding(false)
  }

  async function saveEdit(id: string) {
    if (!editForm.name_ar.trim() || !editForm.price) return
    setSavingId(id)
    const { error: e } = await supabase.from('services').update({ name_ar: editForm.name_ar.trim(), price: Number(editForm.price), is_active: editForm.is_active }).eq('id', id)
    if (!e) {
      setServices(prev => prev.map(s => s.id === id ? { ...s, name_ar: editForm.name_ar.trim(), price: Number(editForm.price), is_active: editForm.is_active } : s))
      setEditingId(null)
    }
    setSavingId(null)
  }

  async function confirmDelete(id: string) {
    const { error: e } = await supabase.from('services').delete().eq('id', id)
    if (!e) { setServices(prev => prev.filter(s => s.id !== id)); setDeletingId(null) }
  }

  async function saveNew() {
    if (!newForm.name_ar.trim() || !newForm.price) return
    setSavingNew(true)
    const payload: Record<string, unknown> = { name_ar: newForm.name_ar.trim(), price: Number(newForm.price), duration_min: 30, is_active: true }
    if (salonId) payload.salon_id = salonId
    const { data, error: e } = await supabase.from('services').insert(payload).select('id, name_ar, price, duration_min, is_active').single()
    if (!e && data) { setServices(prev => [...prev, data]); setAdding(false) }
    setSavingNew(false)
  }

  if (loading) {
    return (
      <div dir="rtl" className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#1a1a1a' }}>
        <p className="text-sm text-gray-500">جارٍ التحميل...</p>
      </div>
    )
  }

  return (
    <div dir="rtl" className="min-h-screen" style={{ backgroundColor: '#1a1a1a' }}>
      <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">

        <div className="flex items-center justify-between">
          <h1 className="text-lg font-bold text-white">الخدمات</h1>
          {!adding && (
            <button onClick={() => { setAdding(true); setEditingId(null); setDeletingId(null) }}
              className="flex items-center gap-1.5 text-sm font-medium px-4 py-2 rounded-xl transition-colors"
              style={{ backgroundColor: '#D4A843', color: '#1a1a1a' }}>
              <span className="text-base leading-none">+</span>إضافة خدمة
            </button>
          )}
        </div>

        {error && (
          <div className="rounded-xl px-4 py-3 text-sm text-red-400 border border-red-900/40 bg-red-900/20">{error}</div>
        )}

        {adding && (
          <div className="rounded-2xl border border-white/10 p-4 space-y-3" style={{ backgroundColor: '#242424' }}>
            <p className="text-sm font-semibold" style={{ color: '#D4A843' }}>خدمة جديدة</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-gray-500 mb-1">اسم الخدمة</label>
                <input autoFocus value={newForm.name_ar} onChange={e => setNewForm(f => ({ ...f, name_ar: e.target.value }))}
                  onKeyDown={e => e.key === 'Enter' && saveNew()} placeholder="مثال: قص شعر" className={inputCls} />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">السعر (ر.س)</label>
                <input type="number" min="0" value={newForm.price} onChange={e => setNewForm(f => ({ ...f, price: e.target.value }))}
                  onKeyDown={e => e.key === 'Enter' && saveNew()} placeholder="50" className={inputCls} />
              </div>
            </div>
            <div className="flex items-center justify-end gap-2">
              <button onClick={() => setAdding(false)} className="px-4 py-2 text-sm text-gray-500 hover:text-gray-300">إلغاء</button>
              <button onClick={saveNew} disabled={savingNew || !newForm.name_ar.trim() || !newForm.price}
                className="px-5 py-2 text-sm font-medium rounded-xl disabled:opacity-40 transition-colors"
                style={{ backgroundColor: '#D4A843', color: '#1a1a1a' }}>
                {savingNew ? 'جارٍ الحفظ...' : 'حفظ'}
              </button>
            </div>
          </div>
        )}

        {services.length === 0 && !adding ? (
          <div className="rounded-2xl border border-white/10 p-10 text-center" style={{ backgroundColor: '#242424' }}>
            <p className="text-gray-500 text-sm">لا توجد خدمات</p>
          </div>
        ) : (
          <div className="space-y-2">
            {services.map(s => (
              <div key={s.id} className="rounded-2xl border border-white/10 overflow-hidden" style={{ backgroundColor: '#242424' }}>
                {editingId === s.id ? (
                  <div className="p-4 space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">اسم الخدمة</label>
                        <input autoFocus value={editForm.name_ar} onChange={e => setEditForm(f => ({ ...f, name_ar: e.target.value }))}
                          onKeyDown={e => e.key === 'Enter' && saveEdit(s.id)} className={inputCls} />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">السعر (ر.س)</label>
                        <input type="number" min="0" value={editForm.price} onChange={e => setEditForm(f => ({ ...f, price: e.target.value }))}
                          onKeyDown={e => e.key === 'Enter' && saveEdit(s.id)} className={inputCls} />
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <label className="flex items-center gap-2 cursor-pointer select-none">
                        <Toggle value={editForm.is_active} onChange={v => setEditForm(f => ({ ...f, is_active: v }))} />
                        <span className="text-sm text-gray-400">{editForm.is_active ? 'نشط' : 'غير نشط'}</span>
                      </label>
                      <div className="flex items-center gap-2">
                        <button onClick={() => setEditingId(null)} className="px-3 py-1.5 text-sm text-gray-500 hover:text-gray-300">إلغاء</button>
                        <button onClick={() => saveEdit(s.id)} disabled={savingId === s.id || !editForm.name_ar.trim() || !editForm.price}
                          className="px-5 py-1.5 text-sm font-medium rounded-xl disabled:opacity-40 transition-colors"
                          style={{ backgroundColor: '#D4A843', color: '#1a1a1a' }}>
                          {savingId === s.id ? 'جارٍ الحفظ...' : 'حفظ'}
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="px-4 py-3 flex items-center gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white truncate">{s.name_ar}</p>
                      <p className="text-xs text-gray-500 mt-0.5" style={{ color: '#D4A843' }}>{s.price} ر.س</p>
                    </div>
                    <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium shrink-0 ${s.is_active ? 'bg-green-900/40 text-green-400' : 'bg-white/5 text-gray-500'}`}>
                      {s.is_active ? 'نشط' : 'غير نشط'}
                    </span>
                    {deletingId === s.id ? (
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-xs text-gray-500 whitespace-nowrap">تأكيد الحذف؟</span>
                        <button onClick={() => confirmDelete(s.id)} className="text-xs font-semibold text-red-400 px-1">نعم</button>
                        <button onClick={() => setDeletingId(null)} className="text-xs text-gray-500 px-1">لا</button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-0.5 shrink-0">
                        <button onClick={() => startEdit(s)} className="p-2 text-gray-600 hover:text-gray-300 rounded-lg hover:bg-white/5 transition-colors"><IconEdit /></button>
                        <button onClick={() => { setDeletingId(s.id); setEditingId(null) }} className="p-2 text-gray-600 hover:text-red-400 rounded-lg hover:bg-red-900/20 transition-colors"><IconTrash /></button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  )
}
