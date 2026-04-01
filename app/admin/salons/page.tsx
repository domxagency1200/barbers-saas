'use client'

import { useEffect, useState } from 'react'

interface Salon {
  id: string
  name: string
  slug: string
  city: string | null
  plan: string | null
  is_active: boolean | null
  created_at: string
}

export default function AdminSalonsPage() {
  const [salons, setSalons] = useState<Salon[]>([])
  const [loading, setLoading] = useState(true)

  // Add modal
  const [addOpen, setAddOpen] = useState(false)
  const [salonName, setSalonName] = useState('')
  const [slug, setSlug] = useState('')
  const [city, setCity] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [addError, setAddError] = useState('')
  const [addSubmitting, setAddSubmitting] = useState(false)

  // Edit modal
  const [editTarget, setEditTarget] = useState<Salon | null>(null)
  const [editName, setEditName] = useState('')
  const [editSlug, setEditSlug] = useState('')
  const [editCity, setEditCity] = useState('')
  const [editPlan, setEditPlan] = useState('')
  const [editError, setEditError] = useState('')
  const [editSubmitting, setEditSubmitting] = useState(false)

  // Transfer ownership modal
  const [transferTarget, setTransferTarget] = useState<Salon | null>(null)
  const [transferEmail, setTransferEmail] = useState('')
  const [transferPassword, setTransferPassword] = useState('')
  const [transferError, setTransferError] = useState('')
  const [transferSubmitting, setTransferSubmitting] = useState(false)

  // Delete modal
  const [deleteTarget, setDeleteTarget] = useState<Salon | null>(null)
  const [delEmail, setDelEmail] = useState('')
  const [delPassword, setDelPassword] = useState('')
  const [delError, setDelError] = useState('')
  const [delSubmitting, setDelSubmitting] = useState(false)

  function loadSalons() {
    fetch('/api/admin/salons')
      .then(r => r.json())
      .then(data => { setSalons(data ?? []); setLoading(false) })
      .catch(() => setLoading(false))
  }

  useEffect(() => { loadSalons() }, [])

  useEffect(() => { if (salons.length > 0) console.log('[salons]', salons) }, [salons])

  function openEdit(s: Salon) {
    setEditTarget(s); setEditName(s.name); setEditSlug(s.slug); setEditCity(s.city ?? ''); setEditPlan(s.plan ?? ''); setEditError('')
  }

  function closeEdit() {
    setEditTarget(null); setEditName(''); setEditSlug(''); setEditCity(''); setEditPlan(''); setEditError('')
  }

  function openTransfer(s: Salon) {
    setEditTarget(null)
    setTransferTarget(s); setTransferEmail(''); setTransferPassword(''); setTransferError('')
  }

  function closeTransfer() {
    setTransferTarget(null); setTransferEmail(''); setTransferPassword(''); setTransferError('')
  }

  async function handleTransfer(e: React.FormEvent) {
    e.preventDefault()
    if (!transferTarget) return
    setTransferSubmitting(true); setTransferError('')
    try {
      const res = await fetch(`/api/admin/salons/${transferTarget.id}/transfer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: transferEmail, password: transferPassword }),
      })
      const json = await res.json()
      if (!res.ok) { setTransferError(json.error ?? 'حدث خطأ'); return }
      closeTransfer()
    } catch { setTransferError('حدث خطأ، يرجى المحاولة مرة أخرى') }
    finally { setTransferSubmitting(false) }
  }

  async function handleEdit(e: React.FormEvent) {
    e.preventDefault()
    if (!editTarget) return
    setEditSubmitting(true); setEditError('')
    try {
      const res = await fetch(`/api/admin/salons/${editTarget.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: editName, slug: editSlug, city: editCity, plan: editPlan }),
      })
      const json = await res.json()
      if (!res.ok) { setEditError(json.error ?? 'حدث خطأ'); return }
      setSalons(prev => prev.map(s => s.id === editTarget.id ? { ...s, name: editName, slug: editSlug, city: editCity || null, plan: editPlan || null } : s))
      closeEdit()
    } catch { setEditError('حدث خطأ، يرجى المحاولة مرة أخرى') }
    finally { setEditSubmitting(false) }
  }

  function closeAdd() {
    setAddOpen(false)
    setSalonName(''); setSlug(''); setCity(''); setPhone(''); setPassword(''); setAddError('')
  }

  function closeDelete() {
    setDeleteTarget(null)
    setDelEmail(''); setDelPassword(''); setDelError('')
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    setAddSubmitting(true); setAddError('')
    try {
      const res = await fetch('/api/admin/salons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: salonName, slug, city, phone, password }),
      })
      const json = await res.json()
      if (!res.ok) { setAddError(json.error ?? 'حدث خطأ'); return }
      closeAdd(); setLoading(true); loadSalons()
    } catch { setAddError('حدث خطأ، يرجى المحاولة مرة أخرى') }
    finally { setAddSubmitting(false) }
  }

  async function handleToggle(salon: Salon) {
    const newValue = salon.is_active === false ? true : false
    if (!newValue && !confirm('هل أنت متأكد من إيقاف هذا الصالون؟')) return
    const res = await fetch(`/api/admin/salons/${salon.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_active: newValue }),
    })
    if (res.ok) {
      setSalons(prev => prev.map(s => s.id === salon.id ? { ...s, is_active: newValue } : s))
    }
  }

  async function handleDelete(e: React.FormEvent) {
    e.preventDefault()
    if (!deleteTarget) return
    setDelSubmitting(true); setDelError('')
    try {
      const res = await fetch(`/api/admin/salons/${deleteTarget.id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: delEmail, password: delPassword }),
      })
      const json = await res.json()
      if (!res.ok) { setDelError(json.error ?? 'حدث خطأ'); return }
      closeDelete()
      setSalons(prev => prev.filter(s => s.id !== deleteTarget.id))
    } catch { setDelError('حدث خطأ، يرجى المحاولة مرة أخرى') }
    finally { setDelSubmitting(false) }
  }

  const inputCls = 'w-full rounded-xl border border-white/10 bg-[#1a1a1a] px-3 py-2 text-sm text-white placeholder:text-gray-600 focus:border-[#D4A843]/60 focus:outline-none'

  return (
    <div className="min-h-screen p-6 md:p-10" style={{ backgroundColor: '#1a1a1a' }}>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold text-white">الصالونات</h1>
        <button onClick={() => setAddOpen(true)} className="rounded-xl px-5 py-2.5 text-sm font-bold text-black" style={{ backgroundColor: '#D4A843' }}>
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
                  <th className="px-5 py-3 font-semibold">إجراءات</th>
                </tr>
              </thead>
              <tbody>
                {salons.map(s => {
                  const active = s.is_active !== false
                  return (
                    <tr key={s.id} className="border-b border-white/5">
                      <td className="px-5 py-3 text-white font-medium">{s.name}</td>
                      <td className="px-5 py-3 text-gray-400">{s.slug}</td>
                      <td className="px-5 py-3 text-gray-400">{s.city ?? '—'}</td>
                      <td className="px-5 py-3">
                        <span className="rounded-full px-2.5 py-0.5 text-xs font-medium" style={{ backgroundColor: 'rgba(212,168,67,0.15)', color: '#D4A843' }}>
                          {s.plan ?? 'free'}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-gray-400">{new Date(s.created_at).toLocaleDateString('ar-SA')}</td>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => openEdit(s)}
                            className="rounded-lg px-3 py-1 text-xs font-medium border"
                            style={{ backgroundColor: 'rgba(99,102,241,0.1)', color: '#818cf8', borderColor: 'rgba(99,102,241,0.25)' }}
                          >
                            تعديل
                          </button>
                          <button
                            onClick={() => handleToggle(s)}
                            className="rounded-lg px-3 py-1 text-xs font-medium border"
                            style={active
                              ? { backgroundColor: 'rgba(234,179,8,0.1)', color: '#facc15', borderColor: 'rgba(234,179,8,0.25)' }
                              : { backgroundColor: 'rgba(34,197,94,0.1)', color: '#4ade80', borderColor: 'rgba(34,197,94,0.25)' }}
                          >
                            {active ? 'إيقاف' : 'تفعيل'}
                          </button>
                          <button
                            onClick={() => setDeleteTarget(s)}
                            className="rounded-lg px-3 py-1 text-xs font-medium border"
                            style={{ backgroundColor: 'rgba(239,68,68,0.1)', color: '#f87171', borderColor: 'rgba(239,68,68,0.25)' }}
                          >
                            حذف
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Edit modal */}
      {editTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.75)' }} onClick={e => { if (e.target === e.currentTarget) closeEdit() }}>
          <div className="w-full max-w-sm rounded-2xl border border-white/10 p-6" style={{ backgroundColor: '#242424' }}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-base font-bold text-white">تعديل الصالون</h2>
              <button onClick={closeEdit} className="text-gray-500 hover:text-white text-xl leading-none">×</button>
            </div>
            <form onSubmit={handleEdit} className="space-y-3">
              <label className="block space-y-1">
                <span className="text-xs text-gray-400">اسم الصالون</span>
                <input required type="text" value={editName} onChange={e => setEditName(e.target.value)} className={inputCls} />
              </label>
              <label className="block space-y-1">
                <span className="text-xs text-gray-400">الرابط (slug)</span>
                <input required type="text" value={editSlug} onChange={e => setEditSlug(e.target.value.toLowerCase().replace(/\s+/g, '-'))} placeholder="al-fakhama" dir="ltr" className={inputCls} />
              </label>
              <label className="block space-y-1">
                <span className="text-xs text-gray-400">المدينة</span>
                <input type="text" value={editCity} onChange={e => setEditCity(e.target.value)} placeholder="الرياض" className={inputCls} />
              </label>
              <label className="block space-y-1">
                <span className="text-xs text-gray-400">الخطة</span>
                <select value={editPlan} onChange={e => setEditPlan(e.target.value)} className={inputCls}>
                  <option value="free">free</option>
                  <option value="basic">basic</option>
                  <option value="pro">pro</option>
                </select>
              </label>
              {editError && <p className="text-xs text-red-400">{editError}</p>}
              <div className="flex gap-2 pt-1">
                <button type="button" onClick={closeEdit} className="flex-1 rounded-xl py-2.5 text-sm text-gray-400 border border-white/10" style={{ backgroundColor: '#1a1a1a' }}>إلغاء</button>
                <button type="submit" disabled={editSubmitting} className="flex-1 rounded-xl py-2.5 text-sm font-bold text-black disabled:opacity-50" style={{ backgroundColor: '#D4A843' }}>
                  {editSubmitting ? '...' : 'حفظ'}
                </button>
              </div>
              <button type="button" onClick={() => openTransfer(editTarget!)} className="w-full rounded-xl py-2.5 text-sm font-medium border border-white/10 text-gray-300 hover:text-white" style={{ backgroundColor: '#1a1a1a' }}>
                نقل الملكية
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Transfer ownership modal */}
      {transferTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.75)' }} onClick={e => { if (e.target === e.currentTarget) closeTransfer() }}>
          <div className="w-full max-w-sm rounded-2xl border border-white/10 p-6" style={{ backgroundColor: '#242424' }}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-white">نقل الملكية</h2>
              <button onClick={closeTransfer} className="text-gray-500 hover:text-white text-xl leading-none">×</button>
            </div>
            <p className="text-sm text-gray-400 mb-4">نقل ملكية صالون <span className="text-white font-semibold">"{transferTarget.name}"</span> إلى مالك جديد.</p>
            <form onSubmit={handleTransfer} className="space-y-3">
              <label className="block space-y-1">
                <span className="text-xs text-gray-400">بريد المالك الجديد</span>
                <input required type="email" value={transferEmail} onChange={e => setTransferEmail(e.target.value)} placeholder="newowner@example.com" className={inputCls} />
              </label>
              <label className="block space-y-1">
                <span className="text-xs text-gray-400">كلمة مرور المالك الجديد</span>
                <input required type="password" value={transferPassword} onChange={e => setTransferPassword(e.target.value)} placeholder="••••••••" className={inputCls} />
              </label>
              {transferError && <p className="text-xs text-red-400">{transferError}</p>}
              <div className="flex gap-2 pt-1">
                <button type="button" onClick={closeTransfer} className="flex-1 rounded-xl py-2.5 text-sm text-gray-400 border border-white/10" style={{ backgroundColor: '#1a1a1a' }}>إلغاء</button>
                <button type="submit" disabled={transferSubmitting} className="flex-1 rounded-xl py-2.5 text-sm font-bold text-black disabled:opacity-50" style={{ backgroundColor: '#D4A843' }}>
                  {transferSubmitting ? '...' : 'تأكيد النقل'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add modal */}
      {addOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.75)' }} onClick={e => { if (e.target === e.currentTarget) closeAdd() }}>
          <div className="w-full max-w-sm rounded-2xl border border-white/10 p-6" style={{ backgroundColor: '#242424' }}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-base font-bold text-white">إضافة صالون</h2>
              <button onClick={closeAdd} className="text-gray-500 hover:text-white text-xl leading-none">×</button>
            </div>
            <form onSubmit={handleAdd} className="space-y-3">
              {[
                { label: 'اسم الصالون', value: salonName, set: setSalonName, type: 'text', placeholder: 'صالون الفخامة' },
                { label: 'الرابط (slug)', value: slug, set: setSlug, type: 'text', placeholder: 'al-fakhama' },
                { label: 'المدينة', value: city, set: setCity, type: 'text', placeholder: 'الرياض' },
                { label: 'رقم جوال المالك', value: phone, set: setPhone, type: 'tel', placeholder: '05XXXXXXXX' },
                { label: 'كلمة المرور', value: password, set: setPassword, type: 'password', placeholder: '••••••••' },
              ].map(f => (
                <label key={f.label} className="block space-y-1">
                  <span className="text-xs text-gray-400">{f.label}</span>
                  <input required type={f.type} value={f.value} placeholder={f.placeholder} onChange={e => f.set(e.target.value)} className={inputCls} />
                </label>
              ))}
              {addError && <p className="text-xs text-red-400">{addError}</p>}
              <div className="flex gap-2 pt-1">
                <button type="button" onClick={closeAdd} className="flex-1 rounded-xl py-2.5 text-sm text-gray-400 border border-white/10" style={{ backgroundColor: '#1a1a1a' }}>إلغاء</button>
                <button type="submit" disabled={addSubmitting} className="flex-1 rounded-xl py-2.5 text-sm font-bold text-black disabled:opacity-50" style={{ backgroundColor: '#D4A843' }}>
                  {addSubmitting ? '...' : 'إضافة'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete confirmation modal */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.75)' }} onClick={e => { if (e.target === e.currentTarget) closeDelete() }}>
          <div className="w-full max-w-sm rounded-2xl border border-white/10 p-6" style={{ backgroundColor: '#242424' }}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-white">تأكيد الحذف</h2>
              <button onClick={closeDelete} className="text-gray-500 hover:text-white text-xl leading-none">×</button>
            </div>
            <p className="text-sm text-gray-400 mb-1">سيتم حذف صالون <span className="text-white font-semibold">"{deleteTarget.name}"</span> مع جميع البيانات المرتبطة به نهائياً.</p>
            <p className="text-xs text-red-400 mb-4">هذا الإجراء لا يمكن التراجع عنه.</p>
            <form onSubmit={handleDelete} className="space-y-3">
              <label className="block space-y-1">
                <span className="text-xs text-gray-400">بريد المشرف</span>
                <input required type="email" value={delEmail} onChange={e => setDelEmail(e.target.value)} placeholder="admin@salony.com" className={inputCls} />
              </label>
              <label className="block space-y-1">
                <span className="text-xs text-gray-400">كلمة مرور المشرف</span>
                <input required type="password" value={delPassword} onChange={e => setDelPassword(e.target.value)} placeholder="••••••••" className={inputCls} />
              </label>
              {delError && <p className="text-xs text-red-400">{delError}</p>}
              <div className="flex gap-2 pt-1">
                <button type="button" onClick={closeDelete} className="flex-1 rounded-xl py-2.5 text-sm text-gray-400 border border-white/10" style={{ backgroundColor: '#1a1a1a' }}>إلغاء</button>
                <button type="submit" disabled={delSubmitting} className="flex-1 rounded-xl py-2.5 text-sm font-bold text-white disabled:opacity-50" style={{ backgroundColor: '#dc2626' }}>
                  {delSubmitting ? '...' : 'حذف نهائي'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
