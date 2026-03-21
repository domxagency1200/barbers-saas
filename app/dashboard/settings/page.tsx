'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Cairo } from 'next/font/google'

const cairo = Cairo({ subsets: ['arabic'], display: 'swap' })

// ── Types ────────────────────────────────────────────────────

interface Salon {
  id: string
  name: string
  whatsapp_number: string | null
}

interface WorkingHours {
  id: string | null
  open_at: string
  close_at: string
}

interface Barber {
  id: string
  name: string
  is_available: boolean
}

// ── Icons ────────────────────────────────────────────────────

function IconEdit() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4Z" />
    </svg>
  )
}

function IconTrash() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
      <path d="M10 11v6M14 11v6" />
      <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
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

// ── Section wrapper ───────────────────────────────────────────

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-white/10 overflow-hidden" style={{ backgroundColor: '#242424' }}>
      <div className="px-4 py-3 border-b border-white/10">
        <h2 className="text-sm font-semibold" style={{ color: '#D4A843' }}>{title}</h2>
      </div>
      <div className="p-4">{children}</div>
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────

export default function SettingsPage() {
  const router = useRouter()
  const supabase = createClient()

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [salon, setSalon] = useState<Salon | null>(null)
  const [salonForm, setSalonForm] = useState({ name: '', whatsapp_number: '' })
  const [salonEditing, setSalonEditing] = useState(false)
  const [savingSalon, setSavingSalon] = useState(false)

  const [hours, setHours] = useState<WorkingHours>({ id: null, open_at: '09:00', close_at: '21:00' })
  const [hoursForm, setHoursForm] = useState({ open_at: '09:00', close_at: '21:00' })
  const [hoursEditing, setHoursEditing] = useState(false)
  const [savingHours, setSavingHours] = useState(false)

  const [barbers, setBarbers] = useState<Barber[]>([])
  const [editingBarberId, setEditingBarberId] = useState<string | null>(null)
  const [editBarberName, setEditBarberName] = useState('')
  const [savingBarberId, setSavingBarberId] = useState<string | null>(null)
  const [deletingBarberId, setDeletingBarberId] = useState<string | null>(null)
  const [addingBarber, setAddingBarber] = useState(false)
  const [newBarberName, setNewBarberName] = useState('')
  const [savingNewBarber, setSavingNewBarber] = useState(false)

  const [salonId, setSalonId] = useState<string | null>(null)

  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/dashboard/login'); return }
      const { data: member } = await supabase.from('salon_members').select('salon_id').eq('user_id', user.id).single()
      const sid = member?.salon_id ?? null
      setSalonId(sid)
      await Promise.all([loadSalon(sid), loadHours(sid), loadBarbers(sid)])
      setLoading(false)
    }
    init()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function loadSalon(sid: string | null) {
    if (!sid) return
    const { data, error: e } = await supabase.from('salons').select('id, name, whatsapp_number').eq('id', sid).single()
    if (e || !data) { setError('تعذّر تحميل بيانات الصالون'); return }
    setSalon(data)
    setSalonForm({ name: data.name ?? '', whatsapp_number: data.whatsapp_number ?? '' })
  }

  function startEditSalon() {
    setSalonForm({ name: salon?.name ?? '', whatsapp_number: salon?.whatsapp_number ?? '' })
    setSalonEditing(true)
  }

  async function saveSalon() {
    const id = salonId ?? salon?.id ?? null
    if (!id) { setError('لم يتم تحديد الصالون'); return }
    setSavingSalon(true)
    setError(null)
    const name = salonForm.name.trim()
    const wa = salonForm.whatsapp_number.trim()
    const { error: e } = await supabase
      .from('salons')
      .update({ name: name || salon?.name, whatsapp_number: wa.length >= 10 ? wa : null })
      .eq('id', id)
    if (e) {
      setError('تعذّر حفظ بيانات الصالون: ' + e.message)
    } else {
      setSalonId(id)
      setSalon(s => ({ ...(s ?? { id, name: name || '', whatsapp_number: null }), name: name || s?.name || '', whatsapp_number: wa.length >= 10 ? wa : null }))
      setSalonEditing(false)
    }
    setSavingSalon(false)
  }

  async function loadHours(sid: string | null) {
    if (!sid) return
    const { data } = await supabase
      .from('working_hours')
      .select('id, open_at, close_at')
      .eq('salon_id', sid)
      .single()
    if (data) {
      const h = { id: data.id, open_at: data.open_at.slice(0, 5), close_at: data.close_at.slice(0, 5) }
      setHours(h); setHoursForm({ open_at: h.open_at, close_at: h.close_at })
    }
  }

  async function saveHours() {
    const id = salonId ?? salon?.id ?? null
    if (!id) { setError('لم يتم تحديد الصالون'); return }
    setSavingHours(true)
    setError(null)
    const { error: e } = await supabase
      .from('working_hours')
      .upsert({ salon_id: id, open_at: hoursForm.open_at, close_at: hoursForm.close_at }, { onConflict: 'salon_id' })
    if (e) {
      setError('تعذّر حفظ ساعات العمل: ' + e.message)
    } else {
      setHours(h => ({ ...h, open_at: hoursForm.open_at, close_at: hoursForm.close_at }))
      setHoursEditing(false)
    }
    setSavingHours(false)
  }

  async function loadBarbers(sid: string | null) {
    let q = supabase.from('barbers').select('id, name, is_available').order('name')
    if (sid) q = q.eq('salon_id', sid)
    const { data } = await q
    setBarbers(data ?? [])
  }

  function startEditBarber(b: Barber) { setEditingBarberId(b.id); setEditBarberName(b.name); setDeletingBarberId(null); setAddingBarber(false) }

  async function saveBarberName(id: string) {
    if (!editBarberName.trim()) return
    setSavingBarberId(id)
    const { error: e } = await supabase.from('barbers').update({ name: editBarberName.trim() }).eq('id', id)
    if (!e) { setBarbers(prev => prev.map(b => b.id === id ? { ...b, name: editBarberName.trim() } : b)); setEditingBarberId(null) }
    setSavingBarberId(null)
  }

  async function toggleBarberStatus(b: Barber) {
    const { error: e } = await supabase.from('barbers').update({ is_available: !b.is_available }).eq('id', b.id)
    if (!e) setBarbers(prev => prev.map(x => x.id === b.id ? { ...x, is_available: !x.is_available } : x))
  }

  async function deleteBarber(id: string) {
    const { error: e } = await supabase.from('barbers').delete().eq('id', id)
    if (!e) { setBarbers(prev => prev.filter(b => b.id !== id)); setDeletingBarberId(null) }
  }

  async function saveNewBarber() {
    if (!newBarberName.trim()) return
    setSavingNewBarber(true)
    const payload: Record<string, unknown> = { name: newBarberName.trim(), is_available: true }
    if (salonId) payload.salon_id = salonId
    const { data, error: e } = await supabase.from('barbers').insert(payload).select('id, name, is_available').single()
    if (!e && data) { setBarbers(prev => [...prev, data]); setNewBarberName(''); setAddingBarber(false) }
    setSavingNewBarber(false)
  }

  if (loading) {
    return (
      <div dir="rtl" className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#1a1a1a' }}>
        <p className="text-sm text-gray-500">جارٍ التحميل...</p>
      </div>
    )
  }

  return (
    <div dir="rtl" className={`min-h-screen ${cairo.className}`} style={{ backgroundColor: '#1a1a1a' }}>
      <div className="max-w-2xl mx-auto px-4 py-6 space-y-5">

        <h1 className="text-lg font-bold text-white">الإعدادات</h1>

        {error && <div className="rounded-xl px-4 py-3 text-sm text-red-400 border border-red-900/40 bg-red-900/20">{error}</div>}

        {/* Salon info */}
        <Section title="معلومات الصالون">
          {salonEditing ? (
            <div className="space-y-3">
              <div>
                <label className="block text-xs text-gray-500 mb-1">اسم الصالون</label>
                <input autoFocus value={salonForm.name} onChange={e => setSalonForm(f => ({ ...f, name: e.target.value }))} className={inputCls} />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">رقم واتساب</label>
                <input
                  value={salonForm.whatsapp_number}
                  onFocus={() => {
                    if (!salonForm.whatsapp_number.startsWith('05'))
                      setSalonForm(f => ({ ...f, whatsapp_number: '05' }))
                  }}
                  onChange={e => {
                    let v = e.target.value.replace(/\D/g, '')
                    if (!v.startsWith('05')) v = '05' + v.replace(/^0*5?/, '')
                    if (v.length > 10) v = v.slice(0, 10)
                    setSalonForm(f => ({ ...f, whatsapp_number: v }))
                  }}
                  placeholder="05XXXXXXXX"
                  inputMode="numeric"
                  maxLength={10}
                  className={inputCls}
                />
              </div>
              <div className="flex items-center justify-end gap-2 pt-1">
                <button onClick={() => setSalonEditing(false)} className="px-4 py-2 text-sm text-gray-500 hover:text-gray-300">إلغاء</button>
                <button onClick={saveSalon}
                  className="px-5 py-2 text-sm font-medium rounded-xl disabled:opacity-40 transition-colors"
                  style={{ backgroundColor: '#D4A843', color: '#1a1a1a' }}>
                  {savingSalon ? 'جارٍ الحفظ...' : 'حفظ'}
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <div className="flex items-center gap-3">
                  <span className="text-xs text-gray-500 w-20 shrink-0">اسم الصالون</span>
                  <span className="text-sm font-medium text-white">{salon?.name ?? '—'}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-gray-500 w-20 shrink-0">واتساب</span>
                  <span className="text-sm text-gray-300">{salon?.whatsapp_number ?? '—'}</span>
                </div>
              </div>
              <button onClick={startEditSalon} className="p-2 text-gray-600 hover:text-gray-300 rounded-lg hover:bg-white/5 transition-colors"><IconEdit /></button>
            </div>
          )}
        </Section>

        {/* Working hours */}
        <Section title="ساعات العمل">
          {hoursEditing ? (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">وقت الفتح</label>
                  <input type="time" value={hoursForm.open_at} onChange={e => setHoursForm(f => ({ ...f, open_at: e.target.value }))} className={inputCls} />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">وقت الإغلاق</label>
                  <input type="time" value={hoursForm.close_at} onChange={e => setHoursForm(f => ({ ...f, close_at: e.target.value }))} className={inputCls} />
                </div>
              </div>
              <div className="flex items-center justify-end gap-2 pt-1">
                <button onClick={() => setHoursEditing(false)} className="px-4 py-2 text-sm text-gray-500 hover:text-gray-300">إلغاء</button>
                <button onClick={saveHours} disabled={savingHours}
                  className="px-5 py-2 text-sm font-medium rounded-xl disabled:opacity-40 transition-colors"
                  style={{ backgroundColor: '#D4A843', color: '#1a1a1a' }}>
                  {savingHours ? 'جارٍ الحفظ...' : 'حفظ'}
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-6">
                <div>
                  <p className="text-xs text-gray-500 mb-0.5">الفتح</p>
                  <p className="text-sm font-medium text-white">{hours.open_at}</p>
                </div>
                <div className="text-gray-700 text-lg">—</div>
                <div>
                  <p className="text-xs text-gray-500 mb-0.5">الإغلاق</p>
                  <p className="text-sm font-medium text-white">{hours.close_at}</p>
                </div>
              </div>
              <button onClick={() => { setHoursForm({ open_at: hours.open_at, close_at: hours.close_at }); setHoursEditing(true) }}
                className="p-2 text-gray-600 hover:text-gray-300 rounded-lg hover:bg-white/5 transition-colors"><IconEdit /></button>
            </div>
          )}
        </Section>

        {/* Barbers */}
        <Section title="الحلاقون">
          <div className="space-y-2">
            {addingBarber && (
              <div className="flex items-center gap-2 pb-2 border-b border-white/10 mb-3">
                <input autoFocus value={newBarberName} onChange={e => setNewBarberName(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && saveNewBarber()} placeholder="اسم الحلاق"
                  className="flex-1 rounded-xl px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:ring-1 border border-white/10 bg-[#1a1a1a] focus:ring-[#D4A843]" />
                <button onClick={() => setAddingBarber(false)} className="px-3 py-2 text-sm text-gray-500 hover:text-gray-300">إلغاء</button>
                <button onClick={saveNewBarber} disabled={savingNewBarber || !newBarberName.trim()}
                  className="px-4 py-2 text-sm font-medium rounded-xl disabled:opacity-40 transition-colors"
                  style={{ backgroundColor: '#D4A843', color: '#1a1a1a' }}>
                  {savingNewBarber ? '...' : 'إضافة'}
                </button>
              </div>
            )}

            {barbers.length === 0 && !addingBarber && (
              <p className="text-sm text-gray-500 text-center py-4">لا يوجد حلاقون</p>
            )}

            {barbers.map(b => (
              <div key={b.id} className="flex items-center gap-3 py-2 border-b border-white/5 last:border-0">
                {editingBarberId === b.id ? (
                  <>
                    <input autoFocus value={editBarberName} onChange={e => setEditBarberName(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && saveBarberName(b.id)}
                      className="flex-1 rounded-xl px-3 py-1.5 text-sm text-white focus:outline-none focus:ring-1 border border-white/10 bg-[#1a1a1a] focus:ring-[#D4A843]" />
                    <button onClick={() => setEditingBarberId(null)} className="text-xs text-gray-500 hover:text-gray-300 px-2">إلغاء</button>
                    <button onClick={() => saveBarberName(b.id)} disabled={savingBarberId === b.id || !editBarberName.trim()}
                      className="px-3 py-1.5 text-xs font-medium rounded-lg disabled:opacity-40 transition-colors"
                      style={{ backgroundColor: '#D4A843', color: '#1a1a1a' }}>
                      {savingBarberId === b.id ? '...' : 'حفظ'}
                    </button>
                  </>
                ) : (
                  <>
                    <span className="flex-1 text-sm font-medium text-white truncate">{b.name}</span>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <Toggle value={b.is_available} onChange={() => toggleBarberStatus(b)} />
                      <span className={`text-xs font-medium ${b.is_available ? 'text-green-400' : 'text-gray-500'}`}>
                        {b.is_available ? 'متاح' : 'مشغول'}
                      </span>
                    </div>
                    {deletingBarberId === b.id ? (
                      <div className="flex items-center gap-1.5 shrink-0">
                        <span className="text-xs text-gray-500">حذف؟</span>
                        <button onClick={() => deleteBarber(b.id)} className="text-xs font-semibold text-red-400 px-1">نعم</button>
                        <button onClick={() => setDeletingBarberId(null)} className="text-xs text-gray-500 px-1">لا</button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-0.5 shrink-0">
                        <button onClick={() => startEditBarber(b)} className="p-1.5 text-gray-600 hover:text-gray-300 rounded-lg hover:bg-white/5 transition-colors"><IconEdit /></button>
                        <button onClick={() => { setDeletingBarberId(b.id); setEditingBarberId(null) }} className="p-1.5 text-gray-600 hover:text-red-400 rounded-lg hover:bg-red-900/20 transition-colors"><IconTrash /></button>
                      </div>
                    )}
                  </>
                )}
              </div>
            ))}

            {!addingBarber && (
              <button onClick={() => { setAddingBarber(true); setNewBarberName(''); setEditingBarberId(null) }}
                className="w-full mt-2 flex items-center justify-center gap-1.5 py-2 rounded-xl text-sm transition-colors border border-dashed border-white/10 text-gray-500 hover:border-white/20 hover:text-gray-300">
                <span className="text-base leading-none">+</span>إضافة حلاق
              </button>
            )}
          </div>
        </Section>

      </div>
    </div>
  )
}
