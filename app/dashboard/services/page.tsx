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

interface Offer {
  id: string
  title: string
  badge: string
  description: string
  price_current: string
  price_old: string
  is_active: boolean
  service_ids: string[]
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

const inputCls = 'w-full rounded-2xl px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#D4A843]/50 focus:border-[#D4A843]/40 border border-white/10 bg-[#1a1a1a] transition-colors duration-150'

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

  const [salonServices, setSalonServices] = useState<Service[]>([])
  const [offers, setOffers] = useState<Offer[]>([])
  const [offerForm, setOfferForm] = useState({ title: '', badge: '', description: '', price_current: '', price_old: '', is_active: true, service_ids: [] as string[] })
  const [addingOffer, setAddingOffer] = useState(false)
  const [editingOfferId, setEditingOfferId] = useState<string | null>(null)
  const [savingOffer, setSavingOffer] = useState(false)
  const [deletingOfferId, setDeletingOfferId] = useState<string | null>(null)

  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/dashboard/login'); return }
      const { data: member } = await supabase.from('salon_members').select('salon_id').eq('user_id', user.id).single()
      const sid = member?.salon_id ?? null
      setSalonId(sid)
      await loadServices(sid)
      if (sid) {
        const { data: svcs } = await supabase.from('services').select('id, name_ar, price, duration_min, is_active').eq('salon_id', sid).eq('is_active', true).order('name_ar')
        setSalonServices(svcs ?? [])
        const { data: metaRow } = await supabase.from('salons').select('meta').eq('id', sid).single()
        const m = (metaRow as any)?.meta ?? {}
        setOffers(m.offers ?? [])
      }
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

  async function saveOffers(updatedOffers: Offer[]) {
    if (!salonId) return
    setSavingOffer(true)
    setError(null)
    const { data: current } = await supabase.from('salons').select('meta').eq('id', salonId).single()
    const existingMeta = (current as any)?.meta ?? {}
    const { error: e } = await supabase.from('salons').update({ meta: { ...existingMeta, offers: updatedOffers } }).eq('id', salonId)
    if (e) { setError('تعذّر حفظ العروض: ' + e.message) } else { setOffers(updatedOffers) }
    setSavingOffer(false)
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

        {/* Offers */}
        <div className="pt-2">
          <div className="rounded-2xl border border-white/10 overflow-hidden" style={{ backgroundColor: '#242424' }}>
            <div className="px-4 py-3 border-b border-white/10">
              <h2 className="text-sm font-semibold" style={{ color: '#D4A843' }}>العروض</h2>
            </div>
            <div className="p-4">
              <div className="space-y-3">
                {offers.map(offer => (
                  <div key={offer.id} className="rounded-xl border border-white/8 p-3 space-y-2" style={{ backgroundColor: '#1a1a1a' }}>
                    {editingOfferId === offer.id ? (
                      <div className="space-y-3">
                        <input value={offerForm.title} onChange={e => setOfferForm(f => ({ ...f, title: e.target.value }))} placeholder="العنوان" className={inputCls} />
                        <input value={offerForm.badge} onChange={e => setOfferForm(f => ({ ...f, badge: e.target.value }))} placeholder="الشارة (مثال: VIP)" className={inputCls} />
                        <input value={offerForm.description} onChange={e => setOfferForm(f => ({ ...f, description: e.target.value }))} placeholder="الوصف" className={inputCls} />
                        {salonServices.length > 0 && (
                          <div>
                            <label className="block text-xs text-gray-500 mb-1">الخدمات المشمولة</label>
                            <div className="rounded-xl border border-white/10 p-2 space-y-1 max-h-36 overflow-y-auto">
                              {salonServices.map(svc => (
                                <label key={svc.id} className="flex items-center gap-2 cursor-pointer px-1 py-0.5 rounded hover:bg-white/5">
                                  <input type="checkbox" checked={offerForm.service_ids.includes(svc.id)}
                                    onChange={e => setOfferForm(f => ({ ...f, service_ids: e.target.checked ? [...f.service_ids, svc.id] : f.service_ids.filter(id => id !== svc.id) }))}
                                    className="accent-[#D4A843]" />
                                  <span className="text-sm text-gray-300">{svc.name_ar}</span>
                                </label>
                              ))}
                            </div>
                          </div>
                        )}
                        <div className="grid grid-cols-2 gap-2">
                          <input value={offerForm.price_current} onChange={e => setOfferForm(f => ({ ...f, price_current: e.target.value }))} placeholder="السعر الحالي" className={inputCls} />
                          <input value={offerForm.price_old} onChange={e => setOfferForm(f => ({ ...f, price_old: e.target.value }))} placeholder="السعر القديم" className={inputCls} />
                        </div>
                        <div className="flex items-center gap-2">
                          <Toggle value={offerForm.is_active} onChange={v => setOfferForm(f => ({ ...f, is_active: v }))} />
                          <span className="text-xs text-gray-500">نشط</span>
                        </div>
                        <div className="flex justify-end gap-2 pt-1">
                          <button onClick={() => setEditingOfferId(null)} className="px-3 py-1.5 text-sm text-gray-500 hover:text-gray-300">إلغاء</button>
                          <button disabled={savingOffer} onClick={async () => {
                            const updated = offers.map(o => o.id === offer.id ? { ...o, ...offerForm } : o)
                            await saveOffers(updated)
                            setEditingOfferId(null)
                          }} className="px-5 py-1.5 text-sm font-bold rounded-xl disabled:opacity-40 transition-all duration-200 hover:scale-[1.03] hover:shadow-[0_0_14px_rgba(212,168,67,0.45)]" style={{ background: 'linear-gradient(135deg,#E8BC5A 0%,#D4A843 50%,#B8922E 100%)', color: '#1a1a1a' }}>
                            {savingOffer ? '...' : 'حفظ'}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold text-white">{offer.title || '—'}</span>
                            {offer.badge && <span className="text-xs px-2 py-0.5 rounded-full border border-white/10 text-gray-400">{offer.badge}</span>}
                            <span className={`text-xs ${offer.is_active ? 'text-green-400' : 'text-gray-600'}`}>{offer.is_active ? 'نشط' : 'مخفي'}</span>
                          </div>
                          {offer.description && <p className="text-xs text-gray-500 mt-0.5">{offer.description}</p>}
                          <div className="flex items-center gap-2 mt-1">
                            {offer.price_current && <span className="text-xs font-bold" style={{ color: '#D4A843' }}>{offer.price_current} ر.س</span>}
                            {offer.price_old && <span className="text-xs text-gray-600 line-through">{offer.price_old} ر.س</span>}
                          </div>
                        </div>
                        {deletingOfferId === offer.id ? (
                          <div className="flex items-center gap-1.5 shrink-0">
                            <span className="text-xs text-gray-500">حذف؟</span>
                            <button onClick={async () => { await saveOffers(offers.filter(o => o.id !== offer.id)); setDeletingOfferId(null) }} className="text-xs font-semibold text-red-400 px-1">نعم</button>
                            <button onClick={() => setDeletingOfferId(null)} className="text-xs text-gray-500 px-1">لا</button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-0.5 shrink-0">
                            <button onClick={() => { setOfferForm({ title: offer.title, badge: offer.badge, description: offer.description, price_current: offer.price_current, price_old: offer.price_old, is_active: offer.is_active, service_ids: offer.service_ids ?? [] }); setEditingOfferId(offer.id); setAddingOffer(false) }} className="p-1.5 text-gray-600 hover:text-gray-300 rounded-lg hover:bg-white/5 transition-colors"><IconEdit /></button>
                            <button onClick={() => setDeletingOfferId(offer.id)} className="p-1.5 text-gray-600 hover:text-red-400 rounded-lg hover:bg-red-900/20 transition-colors"><IconTrash /></button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}

                {addingOffer && (
                  <div className="rounded-xl border border-white/8 p-4 space-y-3" style={{ backgroundColor: '#1a1a1a' }}>
                    <input autoFocus value={offerForm.title} onChange={e => setOfferForm(f => ({ ...f, title: e.target.value }))} placeholder="العنوان" className={inputCls} />
                    <input value={offerForm.badge} onChange={e => setOfferForm(f => ({ ...f, badge: e.target.value }))} placeholder="الشارة (مثال: VIP)" className={inputCls} />
                    <input value={offerForm.description} onChange={e => setOfferForm(f => ({ ...f, description: e.target.value }))} placeholder="الوصف" className={inputCls} />
                    {salonServices.length > 0 && (
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">الخدمات المشمولة</label>
                        <div className="rounded-xl border border-white/10 p-2 space-y-1 max-h-36 overflow-y-auto">
                          {salonServices.map(svc => (
                            <label key={svc.id} className="flex items-center gap-2 cursor-pointer px-1 py-0.5 rounded hover:bg-white/5">
                              <input type="checkbox" checked={offerForm.service_ids.includes(svc.id)}
                                onChange={e => setOfferForm(f => ({ ...f, service_ids: e.target.checked ? [...f.service_ids, svc.id] : f.service_ids.filter(id => id !== svc.id) }))}
                                className="accent-[#D4A843]" />
                              <span className="text-sm text-gray-300">{svc.name_ar}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    )}
                    <div className="grid grid-cols-2 gap-2">
                      <input value={offerForm.price_current} onChange={e => setOfferForm(f => ({ ...f, price_current: e.target.value }))} placeholder="السعر الحالي" className={inputCls} />
                      <input value={offerForm.price_old} onChange={e => setOfferForm(f => ({ ...f, price_old: e.target.value }))} placeholder="السعر القديم" className={inputCls} />
                    </div>
                    <div className="flex items-center gap-2">
                      <Toggle value={offerForm.is_active} onChange={v => setOfferForm(f => ({ ...f, is_active: v }))} />
                      <span className="text-xs text-gray-500">نشط</span>
                    </div>
                    <div className="flex justify-end gap-2 pt-1">
                      <button onClick={() => setAddingOffer(false)} className="px-3 py-1.5 text-sm text-gray-500 hover:text-gray-300">إلغاء</button>
                      <button disabled={savingOffer || !offerForm.title.trim()} onClick={async () => {
                        const newOffer: Offer = { id: Date.now().toString(), ...offerForm }
                        await saveOffers([...offers, newOffer])
                        setOfferForm({ title: '', badge: '', description: '', price_current: '', price_old: '', is_active: true, service_ids: [] })
                        setAddingOffer(false)
                      }} className="px-5 py-1.5 text-sm font-bold rounded-xl disabled:opacity-40 transition-all duration-200 hover:scale-[1.03] hover:shadow-[0_0_14px_rgba(212,168,67,0.45)]" style={{ background: 'linear-gradient(135deg,#E8BC5A 0%,#D4A843 50%,#B8922E 100%)', color: '#1a1a1a' }}>
                        {savingOffer ? '...' : 'إضافة'}
                      </button>
                    </div>
                  </div>
                )}

                {!addingOffer && (
                  <button onClick={() => { setAddingOffer(true); setEditingOfferId(null); setOfferForm({ title: '', badge: '', description: '', price_current: '', price_old: '', is_active: true, service_ids: [] }) }}
                    className="w-full mt-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-sm transition-colors border border-dashed border-white/10 text-gray-500 hover:border-white/20 hover:text-gray-300">
                    <span className="text-base leading-none">+</span>إضافة عرض
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}
