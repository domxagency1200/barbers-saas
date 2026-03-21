'use client'

import { useEffect, useState } from 'react'

interface Salon {
  id: string
  name: string
  slug: string
  city: string | null
  plan: string | null
  created_at: string
}

export default function AdminSalonsPage() {
  const [salons, setSalons] = useState<Salon[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)

  const [salonName, setSalonName] = useState('')
  const [slug, setSlug] = useState('')
  const [city, setCity] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState('')

  function loadSalons() {
    fetch('/api/admin/salons')
      .then(r => r.json())
      .then(data => { setSalons(data ?? []); setLoading(false) })
      .catch(() => setLoading(false))
  }

  useEffect(() => { loadSalons() }, [])

  function closeModal() {
    setModalOpen(false)
    setSalonName(''); setSlug(''); setCity(''); setEmail(''); setPassword(''); setFormError('')
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setFormError('')
    try {
      const res = await fetch('/api/admin/salons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: salonName, slug, city, email, password }),
      })
      const json = await res.json()
      if (!res.ok) { setFormError(json.error ?? 'حدث خطأ'); return }
      closeModal()
      setLoading(true)
      loadSalons()
    } catch { setFormError('حدث خطأ، يرجى المحاولة مرة أخرى') }
    finally { setSubmitting(false) }
  }

  return (
    <div className="min-h-screen p-6 md:p-10" style={{ backgroundColor: '#1a1a1a' }}>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold text-white">الصالونات</h1>
        <button
          onClick={() => setModalOpen(true)}
          className="rounded-xl px-5 py-2.5 text-sm font-bold text-black"
          style={{ backgroundColor: '#D4A843' }}
        >
          إضافة صالون
        </button>
      </div>

      <div className="rounded-2xl border border-white/10 overflow-hidden" style={{ backgroundColor: '#242424' }}>
        {loading ? (
          <p className="text-center text-gray-500 text-sm py-12">جاري التحميل...</p>
        ) : salons.length === 0 ? (
          <p className="text-center text-gray-500 text-sm py-12">لا توجد صالونات</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-right">
              <thead>
                <tr className="border-b border-white/10 text-gray-400 text-xs">
                  <th className="px-5 py-3 font-semibold">الاسم</th>
                  <th className="px-5 py-3 font-semibold">الرابط</th>
                  <th className="px-5 py-3 font-semibold">المدينة</th>
                  <th className="px-5 py-3 font-semibold">الخطة</th>
                  <th className="px-5 py-3 font-semibold">تاريخ الإنشاء</th>
                </tr>
              </thead>
              <tbody>
                {salons.map(s => (
                  <tr key={s.id} className="border-b border-white/5 hover:bg-white/3 transition-colors">
                    <td className="px-5 py-3 text-white font-medium">{s.name}</td>
                    <td className="px-5 py-3 text-gray-400">{s.slug}</td>
                    <td className="px-5 py-3 text-gray-400">{s.city ?? '—'}</td>
                    <td className="px-5 py-3">
                      <span className="rounded-full px-2.5 py-0.5 text-xs font-medium" style={{ backgroundColor: 'rgba(212,168,67,0.15)', color: '#D4A843' }}>
                        {s.plan ?? 'free'}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-gray-400">{new Date(s.created_at).toLocaleDateString('ar-SA')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {modalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backgroundColor: 'rgba(0,0,0,0.75)' }}
          onClick={e => { if (e.target === e.currentTarget) closeModal() }}
        >
          <div className="w-full max-w-sm rounded-2xl border border-white/10 p-6" style={{ backgroundColor: '#242424' }}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-base font-bold text-white">إضافة صالون</h2>
              <button onClick={closeModal} className="text-gray-500 hover:text-white text-xl leading-none">×</button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-3">
              {[
                { label: 'اسم الصالون', value: salonName, set: setSalonName, type: 'text', placeholder: 'صالون الفخامة' },
                { label: 'الرابط (slug)', value: slug, set: setSlug, type: 'text', placeholder: 'al-fakhama' },
                { label: 'المدينة', value: city, set: setCity, type: 'text', placeholder: 'الرياض' },
                { label: 'البريد الإلكتروني للمالك', value: email, set: setEmail, type: 'email', placeholder: 'owner@example.com' },
                { label: 'كلمة المرور', value: password, set: setPassword, type: 'password', placeholder: '••••••••' },
              ].map(f => (
                <label key={f.label} className="block space-y-1">
                  <span className="text-xs text-gray-400">{f.label}</span>
                  <input
                    required
                    type={f.type}
                    value={f.value}
                    placeholder={f.placeholder}
                    onChange={e => f.set(e.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-[#1a1a1a] px-3 py-2 text-sm text-white placeholder:text-gray-600 focus:border-[#D4A843]/60 focus:outline-none"
                  />
                </label>
              ))}
              {formError && <p className="text-xs text-red-400">{formError}</p>}
              <div className="flex gap-2 pt-1">
                <button type="button" onClick={closeModal} className="flex-1 rounded-xl py-2.5 text-sm text-gray-400 border border-white/10" style={{ backgroundColor: '#1a1a1a' }}>إلغاء</button>
                <button type="submit" disabled={submitting} className="flex-1 rounded-xl py-2.5 text-sm font-bold text-black disabled:opacity-50" style={{ backgroundColor: '#D4A843' }}>
                  {submitting ? '...' : 'إضافة'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
