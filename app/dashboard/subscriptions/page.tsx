'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

// ── Types ────────────────────────────────────────────────────

interface Plan {
  id: string
  name: string
  price: number
  duration_months: number
  is_active: boolean
}

interface Subscriber {
  id: string
  name: string
  phone: string
  start_date: string
  end_date: string
  plan_id: string | null
  subscription_plans: { name: string; duration_months: number } | null
}

// ── Helpers ──────────────────────────────────────────────────

function calcEndDate(startDate: string, durationMonths: number): string {
  const d = new Date(startDate)
  d.setMonth(d.getMonth() + durationMonths)
  d.setDate(d.getDate() - 1)
  return d.toISOString().split('T')[0]
}

function formatDate(iso: string) {
  const d = new Date(iso)
  return d.toLocaleDateString('ar-SA', { year: 'numeric', month: 'short', day: 'numeric' })
}

const today = new Date().toISOString().split('T')[0]

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

function IconChevronRight() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="9 18 15 12 9 6" />
    </svg>
  )
}

function IconChevronLeft() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="15 18 9 12 15 6" />
    </svg>
  )
}

// ── Toggle ───────────────────────────────────────────────────

function Toggle({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  return (
    <button type="button" onClick={() => onChange(!value)}
      className="relative w-10 h-5 rounded-full transition-colors shrink-0"
      style={{ backgroundColor: value ? '#D4A843' : '#374151' }}>
      <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${value ? 'translate-x-5' : 'translate-x-0.5'}`} />
    </button>
  )
}

// ── Input style ───────────────────────────────────────────────

const inputCls = 'w-full rounded-xl px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:ring-1 border border-white/10 bg-[#1a1a1a] focus:ring-[#D4A843]'
const selectCls = 'w-full rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 border border-white/10 bg-[#1a1a1a] focus:ring-[#D4A843]'

// ── Page ──────────────────────────────────────────────────────

const PAGE_SIZE = 10

export default function SubscriptionsPage() {
  const router = useRouter()
  const supabase = createClient()

  const [salonId, setSalonId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [plans, setPlans] = useState<Plan[]>([])
  const [editingPlanId, setEditingPlanId] = useState<string | null>(null)
  const [editPlanForm, setEditPlanForm] = useState({ name: '', price: '', duration_months: '12', is_active: true })
  const [savingPlanId, setSavingPlanId] = useState<string | null>(null)
  const [deletingPlanId, setDeletingPlanId] = useState<string | null>(null)
  const [addingPlan, setAddingPlan] = useState(false)
  const [newPlanForm, setNewPlanForm] = useState({ name: '', price: '', duration_months: '12' })
  const [savingNewPlan, setSavingNewPlan] = useState(false)

  const [subscribers, setSubscribers] = useState<Subscriber[]>([])
  const [tab, setTab] = useState<'monthly' | 'yearly'>('monthly')
  const [subPage, setSubPage] = useState(1)
  const [addingSub, setAddingSub] = useState(false)
  const [newSubForm, setNewSubForm] = useState({ name: '', phone: '', plan_id: '', start_date: today })
  const [savingNewSub, setSavingNewSub] = useState(false)
  const [deletingSubId, setDeletingSubId] = useState<string | null>(null)

  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/dashboard/login'); return }
      const { data: member } = await supabase.from('salon_members').select('salon_id').eq('user_id', user.id).single()
      const sid = member?.salon_id ?? null
      setSalonId(sid)
      await Promise.all([loadPlans(sid), loadSubscribers(sid)])
      setLoading(false)
    }
    init()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function loadPlans(sid: string | null) {
    let q = supabase.from('subscription_plans').select('id, name, price, duration_months, is_active').order('duration_months', { ascending: true })
    if (sid) q = q.eq('salon_id', sid)
    const { data, error: e } = await q
    if (e) { setError('تعذّر تحميل الباقات'); return }
    if (!data || data.length === 0) {
      const def = { name: 'الباقة الذهبية - سنة', price: 0, duration_months: 12, is_active: true, ...(sid ? { salon_id: sid } : {}) }
      const { data: inserted } = await supabase.from('subscription_plans').insert(def).select('id, name, price, duration_months, is_active')
      setPlans(inserted ?? [])
    } else {
      setPlans(data)
    }
  }

  function startEditPlan(p: Plan) {
    setEditingPlanId(p.id)
    setEditPlanForm({ name: p.name, price: String(p.price), duration_months: String(p.duration_months), is_active: p.is_active })
    setDeletingPlanId(null); setAddingPlan(false)
  }

  async function saveEditPlan(id: string) {
    if (!editPlanForm.name.trim() || !editPlanForm.price) return
    setSavingPlanId(id)
    const { error: e } = await supabase.from('subscription_plans').update({ name: editPlanForm.name.trim(), price: Number(editPlanForm.price), duration_months: Number(editPlanForm.duration_months), is_active: editPlanForm.is_active }).eq('id', id)
    if (!e) {
      setPlans(prev => prev.map(p => p.id === id ? { ...p, name: editPlanForm.name.trim(), price: Number(editPlanForm.price), duration_months: Number(editPlanForm.duration_months), is_active: editPlanForm.is_active } : p))
      setEditingPlanId(null)
    }
    setSavingPlanId(null)
  }

  async function deletePlan(id: string) {
    const { error: e } = await supabase.from('subscription_plans').delete().eq('id', id)
    if (!e) { setPlans(prev => prev.filter(p => p.id !== id)); setDeletingPlanId(null) }
  }

  async function saveNewPlan() {
    if (!newPlanForm.name.trim() || !newPlanForm.price) return
    setSavingNewPlan(true)
    const payload: Record<string, unknown> = { name: newPlanForm.name.trim(), price: Number(newPlanForm.price), duration_months: Number(newPlanForm.duration_months), is_active: true }
    if (salonId) payload.salon_id = salonId
    const { data, error: e } = await supabase.from('subscription_plans').insert(payload).select('id, name, price, duration_months, is_active').single()
    if (!e && data) { setPlans(prev => [...prev, data]); setAddingPlan(false); setNewPlanForm({ name: '', price: '', duration_months: '12' }) }
    setSavingNewPlan(false)
  }

  async function loadSubscribers(sid: string | null) {
    let q = supabase.from('subscribers').select('id, name, phone, start_date, end_date, plan_id, subscription_plans(name, duration_months)').gte('end_date', today).order('start_date', { ascending: false })
    if (sid) q = q.eq('salon_id', sid)
    const { data, error: e } = await q
    if (e) { setError('تعذّر تحميل المشتركين'); return }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    setSubscribers((data ?? []).map((r: any) => ({ ...r, subscription_plans: Array.isArray(r.subscription_plans) ? (r.subscription_plans[0] ?? null) : r.subscription_plans })) as Subscriber[])
  }

  async function saveNewSub() {
    if (!newSubForm.name.trim() || !newSubForm.phone.trim() || !newSubForm.plan_id || !newSubForm.start_date) return
    setSavingNewSub(true)
    const plan = plans.find(p => p.id === newSubForm.plan_id)
    const endDate = plan ? calcEndDate(newSubForm.start_date, plan.duration_months) : newSubForm.start_date
    const payload: Record<string, unknown> = { name: newSubForm.name.trim(), phone: newSubForm.phone.trim(), plan_id: newSubForm.plan_id, start_date: newSubForm.start_date, end_date: endDate }
    if (salonId) payload.salon_id = salonId
    const { data, error: e } = await supabase.from('subscribers').insert(payload).select('id, name, phone, start_date, end_date, plan_id, subscription_plans(name, duration_months)').single()
    if (!e && data) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const r = data as any
      const normalized: Subscriber = { ...r, subscription_plans: Array.isArray(r.subscription_plans) ? (r.subscription_plans[0] ?? null) : r.subscription_plans }
      setSubscribers(prev => [normalized, ...prev]); setAddingSub(false); setNewSubForm({ name: '', phone: '', plan_id: '', start_date: today })
    }
    setSavingNewSub(false)
  }

  async function deleteSub(id: string) {
    const { error: e } = await supabase.from('subscribers').delete().eq('id', id)
    if (!e) { setSubscribers(prev => prev.filter(s => s.id !== id)); setDeletingSubId(null) }
  }

  const tabMonths = tab === 'monthly' ? 1 : 12
  const filtered = subscribers.filter(s => (s.subscription_plans?.duration_months ?? 0) === tabMonths)
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const paginated = filtered.slice((subPage - 1) * PAGE_SIZE, subPage * PAGE_SIZE)

  function switchTab(t: 'monthly' | 'yearly') { setTab(t); setSubPage(1) }

  if (loading) {
    return (
      <div dir="rtl" className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#1a1a1a' }}>
        <p className="text-sm text-gray-500">جارٍ التحميل...</p>
      </div>
    )
  }

  return (
    <div dir="rtl" className="min-h-screen" style={{ backgroundColor: '#1a1a1a' }}>
      <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">

        {error && <div className="rounded-xl px-4 py-3 text-sm text-red-400 border border-red-900/40 bg-red-900/20">{error}</div>}

        {/* PLANS */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h1 className="text-lg font-bold text-white">الباقات</h1>
            {!addingPlan && (
              <button onClick={() => { setAddingPlan(true); setNewPlanForm({ name: '', price: '', duration_months: '12' }); setEditingPlanId(null) }}
                className="flex items-center gap-1.5 text-sm font-medium px-4 py-2 rounded-xl transition-colors"
                style={{ backgroundColor: '#D4A843', color: '#1a1a1a' }}>
                <span className="text-base leading-none">+</span>إضافة باقة
              </button>
            )}
          </div>

          {addingPlan && (
            <div className="rounded-2xl border border-white/10 p-4 space-y-3" style={{ backgroundColor: '#242424' }}>
              <p className="text-sm font-semibold" style={{ color: '#D4A843' }}>باقة جديدة</p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-1">
                  <label className="block text-xs text-gray-500 mb-1">اسم الباقة</label>
                  <input autoFocus value={newPlanForm.name} onChange={e => setNewPlanForm(f => ({ ...f, name: e.target.value }))} placeholder="الباقة الذهبية" className={inputCls} />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">السعر (ر.س)</label>
                  <input type="number" min="0" value={newPlanForm.price} onChange={e => setNewPlanForm(f => ({ ...f, price: e.target.value }))} placeholder="200" className={inputCls} />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">المدة</label>
                  <select value={newPlanForm.duration_months} onChange={e => setNewPlanForm(f => ({ ...f, duration_months: e.target.value }))} className={selectCls}>
                    <option value="1">شهري</option>
                    <option value="12">سنوي</option>
                  </select>
                </div>
              </div>
              <div className="flex items-center justify-end gap-2">
                <button onClick={() => setAddingPlan(false)} className="px-4 py-2 text-sm text-gray-500 hover:text-gray-300">إلغاء</button>
                <button onClick={saveNewPlan} disabled={savingNewPlan || !newPlanForm.name.trim() || !newPlanForm.price}
                  className="px-5 py-2 text-sm font-medium rounded-xl disabled:opacity-40 transition-colors"
                  style={{ backgroundColor: '#D4A843', color: '#1a1a1a' }}>
                  {savingNewPlan ? 'جارٍ الحفظ...' : 'حفظ'}
                </button>
              </div>
            </div>
          )}

          {plans.length === 0 && !addingPlan ? (
            <div className="rounded-2xl border border-white/10 p-8 text-center" style={{ backgroundColor: '#242424' }}>
              <p className="text-gray-500 text-sm">لا توجد باقات</p>
            </div>
          ) : (
            <div className="space-y-2">
              {plans.map(p => (
                <div key={p.id} className="rounded-2xl border border-white/10 overflow-hidden" style={{ backgroundColor: '#242424' }}>
                  {editingPlanId === p.id ? (
                    <div className="p-4 space-y-3">
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div className="sm:col-span-1">
                          <label className="block text-xs text-gray-500 mb-1">اسم الباقة</label>
                          <input autoFocus value={editPlanForm.name} onChange={e => setEditPlanForm(f => ({ ...f, name: e.target.value }))} className={inputCls} />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-500 mb-1">السعر (ر.س)</label>
                          <input type="number" min="0" value={editPlanForm.price} onChange={e => setEditPlanForm(f => ({ ...f, price: e.target.value }))} className={inputCls} />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-500 mb-1">المدة</label>
                          <select value={editPlanForm.duration_months} onChange={e => setEditPlanForm(f => ({ ...f, duration_months: e.target.value }))} className={selectCls}>
                            <option value="1">شهري</option>
                            <option value="12">سنوي</option>
                          </select>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <label className="flex items-center gap-2 cursor-pointer select-none">
                          <Toggle value={editPlanForm.is_active} onChange={v => setEditPlanForm(f => ({ ...f, is_active: v }))} />
                          <span className="text-sm text-gray-400">{editPlanForm.is_active ? 'نشطة' : 'غير نشطة'}</span>
                        </label>
                        <div className="flex items-center gap-2">
                          <button onClick={() => setEditingPlanId(null)} className="px-3 py-1.5 text-sm text-gray-500 hover:text-gray-300">إلغاء</button>
                          <button onClick={() => saveEditPlan(p.id)} disabled={savingPlanId === p.id || !editPlanForm.name.trim() || !editPlanForm.price}
                            className="px-5 py-1.5 text-sm font-medium rounded-xl disabled:opacity-40 transition-colors"
                            style={{ backgroundColor: '#D4A843', color: '#1a1a1a' }}>
                            {savingPlanId === p.id ? 'جارٍ الحفظ...' : 'حفظ'}
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="px-4 py-3 flex items-center gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white truncate">{p.name}</p>
                        <p className="text-xs mt-0.5" style={{ color: '#D4A843' }}>
                          {p.price} ر.س · {p.duration_months === 1 ? 'شهري' : p.duration_months === 12 ? 'سنوي' : `${p.duration_months} أشهر`}
                        </p>
                      </div>
                      <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium shrink-0 ${p.is_active ? 'bg-green-900/40 text-green-400' : 'bg-white/5 text-gray-500'}`}>
                        {p.is_active ? 'نشطة' : 'غير نشطة'}
                      </span>
                      {deletingPlanId === p.id ? (
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-xs text-gray-500 whitespace-nowrap">تأكيد الحذف؟</span>
                          <button onClick={() => deletePlan(p.id)} className="text-xs font-semibold text-red-400 px-1">نعم</button>
                          <button onClick={() => setDeletingPlanId(null)} className="text-xs text-gray-500 px-1">لا</button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-0.5 shrink-0">
                          <button onClick={() => startEditPlan(p)} className="p-2 text-gray-600 hover:text-gray-300 rounded-lg hover:bg-white/5 transition-colors"><IconEdit /></button>
                          <button onClick={() => { setDeletingPlanId(p.id); setEditingPlanId(null) }} className="p-2 text-gray-600 hover:text-red-400 rounded-lg hover:bg-red-900/20 transition-colors"><IconTrash /></button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* SUBSCRIBERS */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-white">المشتركون</h2>
            {!addingSub && (
              <button onClick={() => { setAddingSub(true); setNewSubForm({ name: '', phone: '', plan_id: plans[0]?.id ?? '', start_date: today }); setDeletingSubId(null) }}
                className="flex items-center gap-1.5 text-sm font-medium px-4 py-2 rounded-xl transition-colors"
                style={{ backgroundColor: '#D4A843', color: '#1a1a1a' }}>
                <span className="text-base leading-none">+</span>إضافة مشترك
              </button>
            )}
          </div>

          {addingSub && (
            <div className="rounded-2xl border border-white/10 p-4 space-y-3" style={{ backgroundColor: '#242424' }}>
              <p className="text-sm font-semibold" style={{ color: '#D4A843' }}>مشترك جديد</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">الاسم</label>
                  <input autoFocus value={newSubForm.name} onChange={e => setNewSubForm(f => ({ ...f, name: e.target.value }))} placeholder="محمد أحمد" className={inputCls} />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">الجوال</label>
                  <input value={newSubForm.phone} onChange={e => setNewSubForm(f => ({ ...f, phone: e.target.value }))} placeholder="05XXXXXXXX" className={inputCls} />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">الباقة</label>
                  <select value={newSubForm.plan_id} onChange={e => setNewSubForm(f => ({ ...f, plan_id: e.target.value }))} className={selectCls}>
                    <option value="">— اختر باقة —</option>
                    {plans.filter(p => p.is_active).map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">تاريخ البدء</label>
                  <input type="date" value={newSubForm.start_date} onChange={e => setNewSubForm(f => ({ ...f, start_date: e.target.value }))} className={inputCls} />
                </div>
              </div>
              {newSubForm.plan_id && newSubForm.start_date && (
                <p className="text-xs text-gray-500">
                  تاريخ الانتهاء: {formatDate(calcEndDate(newSubForm.start_date, plans.find(p => p.id === newSubForm.plan_id)?.duration_months ?? 1))}
                </p>
              )}
              <div className="flex items-center justify-end gap-2">
                <button onClick={() => setAddingSub(false)} className="px-4 py-2 text-sm text-gray-500 hover:text-gray-300">إلغاء</button>
                <button onClick={saveNewSub} disabled={savingNewSub || !newSubForm.name.trim() || !newSubForm.phone.trim() || !newSubForm.plan_id || !newSubForm.start_date}
                  className="px-5 py-2 text-sm font-medium rounded-xl disabled:opacity-40 transition-colors"
                  style={{ backgroundColor: '#D4A843', color: '#1a1a1a' }}>
                  {savingNewSub ? 'جارٍ الحفظ...' : 'حفظ'}
                </button>
              </div>
            </div>
          )}

          {/* Tabs */}
          <div className="rounded-2xl border border-white/10 p-1 flex" style={{ backgroundColor: '#242424' }}>
            <button onClick={() => switchTab('monthly')}
              className="flex-1 py-2 rounded-xl text-sm font-medium transition-all"
              style={tab === 'monthly' ? { backgroundColor: '#D4A843', color: '#1a1a1a' } : { color: '#6b7280' }}>
              شهري ({subscribers.filter(s => s.subscription_plans?.duration_months === 1).length})
            </button>
            <button onClick={() => switchTab('yearly')}
              className="flex-1 py-2 rounded-xl text-sm font-medium transition-all"
              style={tab === 'yearly' ? { backgroundColor: '#D4A843', color: '#1a1a1a' } : { color: '#6b7280' }}>
              سنوي ({subscribers.filter(s => s.subscription_plans?.duration_months === 12).length})
            </button>
          </div>

          {filtered.length === 0 ? (
            <div className="rounded-2xl border border-white/10 p-10 text-center" style={{ backgroundColor: '#242424' }}>
              <p className="text-gray-500 text-sm">لا يوجد مشتركون نشطون</p>
            </div>
          ) : (
            <>
              <div className="space-y-2">
                {paginated.map(s => (
                  <div key={s.id} className="rounded-2xl border border-white/10 px-4 py-3" style={{ backgroundColor: '#242424' }}>
                    <div className="flex items-start gap-3">
                      <div className="flex-1 min-w-0 space-y-1">
                        <p className="text-sm font-semibold text-white">{s.name}</p>
                        <p className="text-xs text-gray-500">{s.phone}</p>
                        <div className="flex flex-wrap gap-x-4 gap-y-0.5 text-xs text-gray-500">
                          <span>الباقة: <span className="font-medium" style={{ color: '#D4A843' }}>{s.subscription_plans?.name ?? '—'}</span></span>
                          <span>من: <span className="text-gray-300">{formatDate(s.start_date)}</span></span>
                          <span>إلى: <span className={s.end_date < today ? 'text-red-400' : 'text-gray-300'}>{formatDate(s.end_date)}</span></span>
                        </div>
                      </div>
                      {deletingSubId === s.id ? (
                        <div className="flex items-center gap-2 shrink-0 pt-0.5">
                          <span className="text-xs text-gray-500 whitespace-nowrap">حذف؟</span>
                          <button onClick={() => deleteSub(s.id)} className="text-xs font-semibold text-red-400 px-1">نعم</button>
                          <button onClick={() => setDeletingSubId(null)} className="text-xs text-gray-500 px-1">لا</button>
                        </div>
                      ) : (
                        <button onClick={() => setDeletingSubId(s.id)} className="p-2 text-gray-600 hover:text-red-400 rounded-lg hover:bg-red-900/20 transition-colors shrink-0">
                          <IconTrash />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-3 pt-1">
                  <button onClick={() => setSubPage(p => Math.max(1, p - 1))} disabled={subPage === 1}
                    className="p-2 rounded-xl border border-white/10 text-gray-400 hover:bg-white/5 disabled:opacity-30 transition-colors"
                    style={{ backgroundColor: '#242424' }}>
                    <IconChevronRight />
                  </button>
                  <span className="text-sm text-gray-400">{subPage} / {totalPages}</span>
                  <button onClick={() => setSubPage(p => Math.min(totalPages, p + 1))} disabled={subPage === totalPages}
                    className="p-2 rounded-xl border border-white/10 text-gray-400 hover:bg-white/5 disabled:opacity-30 transition-colors"
                    style={{ backgroundColor: '#242424' }}>
                    <IconChevronLeft />
                  </button>
                </div>
              )}
            </>
          )}
        </div>

      </div>
    </div>
  )
}
