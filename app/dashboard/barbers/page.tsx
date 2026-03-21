'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Cairo } from 'next/font/google'

const cairo = Cairo({ subsets: ['arabic'], display: 'swap' })

interface Barber {
  id: string
  name: string
  avatar_url: string | null
  is_available: boolean
}

const inputCls = 'w-full rounded-xl px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:ring-1 border border-white/10 bg-[#1a1a1a] focus:ring-[#D4A843]'

export default function BarbersPage() {
  const router = useRouter()
  const supabase = createClient()

  const [salonId, setSalonId] = useState<string | null>(null)
  const [barbers, setBarbers] = useState<Barber[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Add form
  const [name, setName] = useState('')
  const [avatarUrl, setAvatarUrl] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [formSuccess, setFormSuccess] = useState(false)

  // Edit modal
  const [editBarber, setEditBarber] = useState<Barber | null>(null)
  const [editName, setEditName] = useState('')
  const [editAvatarUrl, setEditAvatarUrl] = useState('')
  const [saving, setSaving] = useState(false)
  const [editError, setEditError] = useState<string | null>(null)

  // Delete
  const [deletingId, setDeletingId] = useState<string | null>(null)

  useEffect(() => {
    async function init() {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) { router.push('/dashboard/login'); return }

        const { data: member, error: memberError } = await supabase
          .from('salon_members')
          .select('salon_id')
          .eq('user_id', user.id)
          .single()

        if (memberError || !member?.salon_id) {
          setError('تعذّر تحديد الصالون المرتبط بهذا الحساب')
          return
        }

        const sid = member.salon_id
        setSalonId(sid)
        await loadBarbers(sid)
      } catch {
        setError('حدث خطأ أثناء تحميل البيانات')
      } finally {
        setLoading(false)
      }
    }
    init()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function loadBarbers(sid: string) {
    const { data } = await supabase
      .from('barbers')
      .select('id, name, avatar_url, is_available')
      .eq('salon_id', sid)
      .order('name')
    setBarbers(data ?? [])
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) { setFormError('اسم الحلاق مطلوب'); return }

    setSubmitting(true)
    setFormError(null)
    setFormSuccess(false)

    const res = await fetch('/api/dashboard/barbers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: name.trim(), avatar_url: avatarUrl.trim() || undefined }),
    })
    const json = await res.json()

    if (!res.ok) {
      setFormError(json.error ?? 'تعذّر إضافة الحلاق')
    } else {
      setName('')
      setAvatarUrl('')
      setFormSuccess(true)
      if (salonId) await loadBarbers(salonId)
    }
    setSubmitting(false)
  }

  function openEdit(b: Barber) {
    setEditBarber(b)
    setEditName(b.name)
    setEditAvatarUrl(b.avatar_url ?? '')
    setEditError(null)
  }

  async function handleUpdate(e: React.FormEvent) {
    e.preventDefault()
    if (!editName.trim()) { setEditError('الاسم مطلوب'); return }
    if (!editBarber || !salonId) return

    setSaving(true)
    setEditError(null)

    const { error: updateError } = await supabase
      .from('barbers')
      .update({ name: editName.trim(), avatar_url: editAvatarUrl.trim() || null })
      .eq('id', editBarber.id)
      .eq('salon_id', salonId)

    if (updateError) {
      setEditError('تعذّر تحديث بيانات الحلاق: ' + updateError.message)
    } else {
      setEditBarber(null)
      await loadBarbers(salonId)
    }
    setSaving(false)
  }

  async function handleDelete(id: string) {
    if (!salonId) return
    setDeletingId(id)
    await supabase.from('barbers').delete().eq('id', id).eq('salon_id', salonId)
    setDeletingId(null)
    await loadBarbers(salonId)
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

        <h1 className="text-lg font-bold text-white">الحلاقون</h1>

        {error && (
          <div className="rounded-xl px-4 py-3 text-sm text-red-400 border border-red-900/40 bg-red-900/20">{error}</div>
        )}

        {/* Add form */}
        <div className="rounded-2xl border border-white/10 overflow-hidden" style={{ backgroundColor: '#242424' }}>
          <div className="px-4 py-3 border-b border-white/10">
            <h2 className="text-sm font-semibold" style={{ color: '#D4A843' }}>إضافة حلاق</h2>
          </div>
          <form onSubmit={handleSubmit} className="p-4 space-y-3">
            <div>
              <label className="block text-xs text-gray-500 mb-1">الاسم <span className="text-red-400">*</span></label>
              <input value={name} onChange={e => setName(e.target.value)} placeholder="اسم الحلاق" className={inputCls} />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">رابط الصورة (اختياري)</label>
              <input value={avatarUrl} onChange={e => setAvatarUrl(e.target.value)} placeholder="https://..." className={inputCls} dir="ltr" />
            </div>
            {formError && <p className="text-xs text-red-400">{formError}</p>}
            {formSuccess && <p className="text-xs text-green-400">تمت الإضافة بنجاح</p>}
            <div className="flex justify-end pt-1">
              <button type="submit" disabled={submitting}
                className="px-5 py-2 text-sm font-medium rounded-xl disabled:opacity-40 transition-colors"
                style={{ backgroundColor: '#D4A843', color: '#1a1a1a' }}>
                {submitting ? 'جارٍ الإضافة...' : 'إضافة'}
              </button>
            </div>
          </form>
        </div>

        {/* Barbers list */}
        <div className="rounded-2xl border border-white/10 overflow-hidden" style={{ backgroundColor: '#242424' }}>
          <div className="px-4 py-3 border-b border-white/10">
            <h2 className="text-sm font-semibold" style={{ color: '#D4A843' }}>القائمة</h2>
          </div>
          <div className="p-4">
            {barbers.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-4">لا يوجد حلاقون بعد</p>
            ) : (
              <div className="space-y-1">
                {barbers.map(b => (
                  <div key={b.id} className="flex items-center gap-3 py-2.5 border-b border-white/5 last:border-0">
                    {/* Avatar */}
                    {b.avatar_url ? (
                      <img src={b.avatar_url} alt={b.name} className="w-8 h-8 rounded-full object-cover shrink-0" />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center shrink-0">
                        <span className="text-xs text-gray-400">{b.name.charAt(0)}</span>
                      </div>
                    )}

                    {/* Name */}
                    <span className="flex-1 text-sm font-medium text-white">{b.name}</span>

                    {/* Status */}
                    <span className={`text-xs ${b.is_available ? 'text-green-400' : 'text-gray-500'}`}>
                      {b.is_available ? 'متاح' : 'مشغول'}
                    </span>

                    {/* Edit button */}
                    <button
                      onClick={() => openEdit(b)}
                      className="px-3 py-1 text-xs rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
                    >
                      تعديل
                    </button>

                    {/* Delete button */}
                    <button
                      onClick={() => handleDelete(b.id)}
                      disabled={deletingId === b.id}
                      className="px-3 py-1 text-xs rounded-lg text-gray-400 hover:text-red-400 hover:bg-red-900/20 transition-colors disabled:opacity-40"
                    >
                      {deletingId === b.id ? '...' : 'حذف'}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Edit modal */}
      {editBarber && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,.7)' }}
          onClick={e => { if (e.target === e.currentTarget) setEditBarber(null) }}>
          <div className="w-full max-w-sm rounded-2xl border border-white/10 overflow-hidden" style={{ backgroundColor: '#242424' }}>
            <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between">
              <h2 className="text-sm font-semibold" style={{ color: '#D4A843' }}>تعديل الحلاق</h2>
              <button onClick={() => setEditBarber(null)} className="text-gray-500 hover:text-white text-lg leading-none">×</button>
            </div>
            <form onSubmit={handleUpdate} className="p-4 space-y-3">
              <div>
                <label className="block text-xs text-gray-500 mb-1">الاسم <span className="text-red-400">*</span></label>
                <input autoFocus value={editName} onChange={e => setEditName(e.target.value)} placeholder="اسم الحلاق" className={inputCls} />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">رابط الصورة (اختياري)</label>
                <input value={editAvatarUrl} onChange={e => setEditAvatarUrl(e.target.value)} placeholder="https://..." className={inputCls} dir="ltr" />
              </div>
              {editError && <p className="text-xs text-red-400">{editError}</p>}
              <div className="flex items-center justify-end gap-2 pt-1">
                <button type="button" onClick={() => setEditBarber(null)} className="px-4 py-2 text-sm text-gray-500 hover:text-gray-300">إلغاء</button>
                <button type="submit" disabled={saving}
                  className="px-5 py-2 text-sm font-medium rounded-xl disabled:opacity-40 transition-colors"
                  style={{ backgroundColor: '#D4A843', color: '#1a1a1a' }}>
                  {saving ? 'جارٍ الحفظ...' : 'حفظ'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
