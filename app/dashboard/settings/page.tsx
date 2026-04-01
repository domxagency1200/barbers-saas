'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { getTabSalonId, setTabSalonId } from '@/lib/tabSalonId'
import { Cairo } from 'next/font/google'
import { THEMES, ThemeKey } from '@/app/lib/themes'

const cairo = Cairo({ subsets: ['arabic'], display: 'swap' })

function extractMapSrc(input: string): string {
  const trimmed = input.trim()
  if (trimmed.startsWith('<iframe')) {
    const match = trimmed.match(/src="([^"]+)"/)
    return match ? match[1] : trimmed
  }
  return trimmed
}

// ── Types ────────────────────────────────────────────────────

interface Salon {
  id: string
  name: string
  whatsapp_number: string | null
  meta?: { hero_title?: string; tagline?: string; neighborhood?: string; hero_image?: string; feature_image?: string; map_place_url?: string; map_embed_url?: string; card_theme?: string; custom_color?: string; features?: { title: string; description: string }[]; features_title?: string; features_subtitle?: string; about_title?: string; about_description?: string; years_experience?: number; rating?: number; happy_clients?: number; reviews_title?: string; reviews_subtitle?: string; reviews?: { name: string; text: string }[] } | null
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
      style={{ backgroundColor: value ? '#C9A55A' : 'rgba(255,255,255,0.1)' }}>
      <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${value ? 'translate-x-5' : 'translate-x-0.5'}`} />
    </button>
  )
}

// ── Input style ───────────────────────────────────────────────

const inputCls = 'w-full rounded-xl px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:ring-1 border border-white/10 bg-[#1a1a1a] focus:ring-[#C9A55A]'

// ── Section wrapper ───────────────────────────────────────────

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-white/10 overflow-hidden" style={{ backgroundColor: 'rgba(255,255,255,0.03)' }}>
      <div className="px-4 py-3 border-b border-white/10">
        <h2 className="text-sm font-semibold" style={{ color: '#C9A55A' }}>{title}</h2>
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

  const [metaForm, setMetaForm] = useState({ hero_title: '', tagline: '', booking_button_hero_text: '', neighborhood: '', hero_image: '', feature_image: '', map_place_url: '', map_embed_url: '' })
  const [metaEditing, setMetaEditing] = useState(false)
  const [savingMeta, setSavingMeta] = useState(false)
  const [uploadingImage, setUploadingImage] = useState(false)
  const [uploadingFeatureImage, setUploadingFeatureImage] = useState(false)

  const [features, setFeatures] = useState<{ title: string; description: string }[]>([
    { title: '', description: '' }, { title: '', description: '' },
    { title: '', description: '' }, { title: '', description: '' },
  ])
  const [featuresTitle, setFeaturesTitle] = useState('')
  const [featuresSubtitle, setFeaturesSubtitle] = useState('')
  const [savingFeatures, setSavingFeatures] = useState(false)

  const [reviewsTitle, setReviewsTitle] = useState('')
  const [reviewsSubtitle, setReviewsSubtitle] = useState('')
  const [reviews, setReviews] = useState<{ name: string; text: string }[]>([])
  const [reviewForm, setReviewForm] = useState({ name: '', text: '' })
  const [savingReviews, setSavingReviews] = useState(false)

  const [aboutTitle, setAboutTitle] = useState('')
  const [aboutDescription, setAboutDescription] = useState('')
  const [yearsExperience, setYearsExperience] = useState('')
  const [rating, setRating] = useState('')
  const [happyClients, setHappyClients] = useState('')
  const [savingAbout, setSavingAbout] = useState(false)

  const [bookingHeroTitle, setBookingHeroTitle] = useState('')
  const [bookingHeroDescription, setBookingHeroDescription] = useState('')
  const [bookingCardTitle, setBookingCardTitle] = useState('')
  const [bookingCardSubtitle, setBookingCardSubtitle] = useState('')
  const [bookingStep1, setBookingStep1] = useState('')
  const [bookingStep2, setBookingStep2] = useState('')
  const [bookingStep3, setBookingStep3] = useState('')
  const [bookingButtonText, setBookingButtonText] = useState('')
  const [logoUrl, setLogoUrl] = useState('')
  const [uploadingLogo, setUploadingLogo] = useState(false)
  const [deletingLogo, setDeletingLogo] = useState(false)
  const [useAutoLogo, setUseAutoLogo] = useState(false)
  const [logoLetter, setLogoLetter] = useState('')
  const [savingAutoLogo, setSavingAutoLogo] = useState(false)
  const [savingBookingHero, setSavingBookingHero] = useState(false)

  const [cardTheme, setCardTheme] = useState<string>('gold')
  const [customColor, setCustomColor] = useState<string>('#FFAA00')
  const [savingTheme, setSavingTheme] = useState(false)

  const [pageTheme, setPageTheme] = useState<string>('gold')
  const [pagePrimaryColor, setPagePrimaryColor] = useState<string>('#D4AF37')
  const [pageBgColor, setPageBgColor] = useState<string>('#0f0f0f')
  const [savingPageTheme, setSavingPageTheme] = useState(false)

  const [salonSlug, setSalonSlug] = useState<string | null>(null)

  const [salonId, setSalonId] = useState<string | null>(null)

  useEffect(() => {
    async function init() {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) { router.push('/dashboard/login'); return }

        let sid = getTabSalonId()
        if (!sid) {
          sid = (user.app_metadata?.salon_id as string | undefined) ?? null
        }
        if (!sid) {
          const res = await fetch('/api/dashboard/fix-salon-metadata', { method: 'POST' })
          if (res.ok) { const j = await res.json(); sid = j.salon_id ?? null }
        }
        if (sid) setTabSalonId(sid)
        if (!sid) {
          setError('تعذّر تحديد الصالون المرتبط بهذا الحساب')
          return
        }
        setSalonId(sid)
        await Promise.all([loadSalon(sid), loadHours(sid), loadBarbers(sid)])
      } catch {
        setError('حدث خطأ أثناء تحميل البيانات')
      } finally {
        setLoading(false)
      }
    }
    init()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function loadSalon(sid: string | null) {
    if (!sid) return
    const { data, error: e } = await supabase.from('salons').select('id, name, whatsapp_number, slug').eq('id', sid).single()
    if (e || !data) { setError('تعذّر تحميل بيانات الصالون'); return }
    setSalon(data)
    setSalonForm({ name: data.name ?? '', whatsapp_number: data.whatsapp_number ?? '' })
    setSalonSlug((data as any).slug ?? null)

    // Load meta separately — column may not exist yet
    const { data: metaRow } = await supabase.from('salons').select('meta').eq('id', sid).single()
    const m = (metaRow as any)?.meta ?? {}
    setMetaForm({ hero_title: m.hero_title ?? '', tagline: m.tagline ?? '', booking_button_hero_text: m.booking_button_hero_text ?? '', neighborhood: m.neighborhood ?? '', hero_image: m.hero_image ?? '', feature_image: m.feature_image ?? '', map_place_url: m.map_place_url ?? '', map_embed_url: m.map_embed_url ?? '' })
    setCardTheme(m.card_theme ?? 'gold')
    setReviewsTitle(m.reviews_title ?? '')
    setReviewsSubtitle(m.reviews_subtitle ?? '')
    setReviews(m.reviews ?? [])
    setAboutTitle(m.about_title ?? '')
    setAboutDescription(m.about_description ?? '')
    setYearsExperience(m.years_experience != null ? String(m.years_experience) : '')
    setRating(m.rating != null ? String(m.rating) : '')
    setHappyClients(m.happy_clients != null ? String(m.happy_clients) : '')
    setFeaturesTitle(m.features_title ?? '')
    setFeaturesSubtitle(m.features_subtitle ?? '')
    if (m.features?.length) {
      const padded = [...m.features, { title: '', description: '' }, { title: '', description: '' }, { title: '', description: '' }, { title: '', description: '' }].slice(0, 4)
      setFeatures(padded)
    }
    setBookingHeroTitle(m.booking_hero_title ?? '')
    setBookingHeroDescription(m.booking_hero_description ?? '')
    setBookingCardTitle(m.booking_card_title ?? '')
    setBookingCardSubtitle(m.booking_card_subtitle ?? '')
    setBookingStep1(m.booking_step1 ?? '')
    setBookingStep2(m.booking_step2 ?? '')
    setBookingStep3(m.booking_step3 ?? '')
    setBookingButtonText(m.booking_button_text ?? '')
    setLogoUrl(m.logo_url ?? '')
    setUseAutoLogo(m.use_auto_logo ?? false)
    setLogoLetter(m.logo_letter ?? '')
    setCustomColor(m.custom_color ?? '#FFAA00')
    setPageTheme(m.page_theme ?? 'gold')
    setPagePrimaryColor(m.page_primary_color ?? '#D4AF37')
    setPageBgColor(m.page_bg_color ?? '#0f0f0f')
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

  async function uploadHeroImage(file: File) {
    const id = salonId ?? salon?.id ?? null
    if (!id) return
    setUploadingImage(true)
    const ext = file.name.split('.').pop()
    const path = `${id}/${Date.now()}.${ext}`
    const { error: upErr } = await supabase.storage.from('salon-images').upload(path, file, { upsert: true })
    if (upErr) { setError('تعذّر رفع الصورة: ' + upErr.message); setUploadingImage(false); return }
    const { data: urlData } = supabase.storage.from('salon-images').getPublicUrl(path)
    setMetaForm(f => ({ ...f, hero_image: urlData.publicUrl }))
    setUploadingImage(false)
  }

  async function uploadFeatureImage(file: File) {
    const id = salonId ?? salon?.id ?? null
    if (!id) return
    setUploadingFeatureImage(true)
    const ext = file.name.split('.').pop()
    const path = `${id}/${Date.now()}.${ext}`
    const { error: upErr } = await supabase.storage.from('salon-images').upload(path, file, { upsert: true })
    if (upErr) { setError('تعذّر رفع الصورة: ' + upErr.message); setUploadingFeatureImage(false); return }
    const { data: urlData } = supabase.storage.from('salon-images').getPublicUrl(path)
    setMetaForm(f => ({ ...f, feature_image: urlData.publicUrl }))
    setUploadingFeatureImage(false)
  }

  async function saveMeta() {
    const id = salonId ?? salon?.id ?? null
    if (!id) { setError('لم يتم تحديد الصالون'); return }
    setSavingMeta(true)
    setError(null)
    const { data: current } = await supabase.from('salons').select('meta').eq('id', id).single()
    const existingMeta = (current as any)?.meta ?? {}
    const metaPayload = {
      ...existingMeta,
      hero_title: metaForm.hero_title.trim(),
      tagline: metaForm.tagline.trim(),
      booking_button_hero_text: metaForm.booking_button_hero_text.trim(),
      neighborhood: metaForm.neighborhood.trim(),
      hero_image: metaForm.hero_image.trim(),
      feature_image: metaForm.feature_image.trim(),
      map_place_url: metaForm.map_place_url.trim(),
      map_embed_url: extractMapSrc(metaForm.map_embed_url.trim()),
    }
    const { error: e } = await supabase.from('salons').update({ meta: metaPayload }).eq('id', id)
    if (e) {
      setError('تعذّر حفظ إعدادات الصفحة: ' + e.message)
    } else {
      setSalon(s => s ? { ...s, meta: metaPayload } : s)
      setMetaEditing(false)
    }
    setSavingMeta(false)
  }

  async function loadBarbers(sid: string | null) {
    let q = supabase.from('barbers').select('id, name, is_available').eq('is_deleted', false).order('name')
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
    const res = await fetch(`/api/dashboard/barbers?id=${id}`, { method: 'DELETE' })
    if (res.ok) { setBarbers(prev => prev.filter(b => b.id !== id)); setDeletingBarberId(null) }
  }

  async function saveNewBarber() {
    if (!newBarberName.trim()) return
    setSavingNewBarber(true)
    const res = await fetch('/api/dashboard/barbers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newBarberName.trim() }),
    })
    const json = await res.json()
    if (!res.ok) {
      setError(json.error ?? 'تعذّر إضافة الحلاق')
    } else {
      setBarbers(prev => [...prev, json.barber])
      setNewBarberName('')
      setAddingBarber(false)
    }
    setSavingNewBarber(false)
  }

  async function saveCardTheme(theme: string, color?: string) {
    if (!salonId) return
    setSavingTheme(true)
    const { data: current } = await supabase.from('salons').select('meta').eq('id', salonId).single()
    const existingMeta = (current as any)?.meta ?? {}
    const patch: Record<string, string> = { card_theme: theme }
    if (color) patch.custom_color = color
    const { error: e } = await supabase.from('salons').update({ meta: { ...existingMeta, ...patch } }).eq('id', salonId)
    if (!e) setCardTheme(theme)
    setSavingTheme(false)
  }

  async function saveReviews() {
    if (!salonId) return
    setSavingReviews(true)
    const { data: current } = await supabase.from('salons').select('meta').eq('id', salonId).single()
    const existingMeta = (current as any)?.meta ?? {}
    const { error: e } = await supabase.from('salons').update({ meta: { ...existingMeta, reviews_title: reviewsTitle.trim(), reviews_subtitle: reviewsSubtitle.trim(), reviews } }).eq('id', salonId)
    if (e) setError('تعذّر حفظ قسم التقييمات: ' + e.message)
    setSavingReviews(false)
  }

  async function saveAbout() {
    if (!salonId) return
    setSavingAbout(true)
    const { data: current } = await supabase.from('salons').select('meta').eq('id', salonId).single()
    const existingMeta = (current as any)?.meta ?? {}
    const { error: e } = await supabase.from('salons').update({ meta: { ...existingMeta, about_title: aboutTitle.trim(), about_description: aboutDescription.trim(), years_experience: yearsExperience !== '' ? Number(yearsExperience) : undefined, rating: rating !== '' ? Number(rating) : undefined, happy_clients: happyClients !== '' ? Number(happyClients) : undefined } }).eq('id', salonId)
    if (e) setError('تعذّر حفظ قسم من نحن: ' + e.message)
    setSavingAbout(false)
  }

  async function saveAutoLogo(newUseAutoLogo: boolean, newLogoLetter: string) {
    const id = salonId ?? salon?.id ?? null
    if (!id) return
    setSavingAutoLogo(true)
    const { data: current } = await supabase.from('salons').select('meta').eq('id', id).single()
    const existingMeta = (current as any)?.meta ?? {}
    const { error: e } = await supabase.from('salons').update({ meta: { ...existingMeta, use_auto_logo: newUseAutoLogo, logo_letter: newLogoLetter.trim() } }).eq('id', id)
    if (e) setError('تعذّر حفظ إعدادات الشعار: ' + e.message)
    setSavingAutoLogo(false)
  }

  async function deleteLogo() {
    const id = salonId ?? salon?.id ?? null
    if (!id || !logoUrl) return
    setDeletingLogo(true)
    const path = logoUrl.split('/salon-images/').pop()
    if (path) await supabase.storage.from('salon-images').remove([path])
    const { data: current } = await supabase.from('salons').select('meta').eq('id', id).single()
    const existingMeta = (current as any)?.meta ?? {}
    const { error: e } = await supabase.from('salons').update({ meta: { ...existingMeta, logo_url: null } }).eq('id', id)
    if (e) setError('تعذّر حذف الشعار: ' + e.message)
    else setLogoUrl('')
    setDeletingLogo(false)
  }

  async function uploadLogo(file: File) {
    const id = salonId ?? salon?.id ?? null
    if (!id) return
    setUploadingLogo(true)
    const ext = file.name.split('.').pop()
    const path = `${id}/logo.${ext}`
    const { error: upErr } = await supabase.storage.from('salon-images').upload(path, file, { upsert: true })
    if (upErr) { setError('تعذّر رفع الشعار: ' + upErr.message); setUploadingLogo(false); return }
    const { data: urlData } = supabase.storage.from('salon-images').getPublicUrl(path)
    const url = `${urlData.publicUrl}?t=${Date.now()}`
    const { data: current } = await supabase.from('salons').select('meta').eq('id', id).single()
    const existingMeta = (current as any)?.meta ?? {}
    await supabase.from('salons').update({ meta: { ...existingMeta, logo_url: url } }).eq('id', id)
    setLogoUrl(url)
    setUploadingLogo(false)
  }

  async function saveBookingHero() {
    if (!salonId) return
    setSavingBookingHero(true)
    const { data: current } = await supabase.from('salons').select('meta').eq('id', salonId).single()
    const existingMeta = (current as any)?.meta ?? {}
    const { error: e } = await supabase.from('salons').update({ meta: { ...existingMeta, booking_hero_title: bookingHeroTitle.trim(), booking_hero_description: bookingHeroDescription.trim(), booking_card_title: bookingCardTitle.trim(), booking_card_subtitle: bookingCardSubtitle.trim(), booking_step1: bookingStep1.trim(), booking_step2: bookingStep2.trim(), booking_step3: bookingStep3.trim(), booking_button_text: bookingButtonText.trim() } }).eq('id', salonId)
    if (e) setError('تعذّر حفظ قسم الحجز: ' + e.message)
    setSavingBookingHero(false)
  }

  async function saveFeatures() {
    if (!salonId) return
    setSavingFeatures(true)
    const { data: current } = await supabase.from('salons').select('meta').eq('id', salonId).single()
    const existingMeta = (current as any)?.meta ?? {}
    const filled = features.filter(f => f.title.trim() || f.description.trim())
    const { error: e } = await supabase.from('salons').update({ meta: { ...existingMeta, features: filled, features_title: featuresTitle.trim(), features_subtitle: featuresSubtitle.trim() } }).eq('id', salonId)
    if (e) setError('تعذّر حفظ المميزات: ' + e.message)
    setSavingFeatures(false)
  }

  async function savePageTheme() {
    if (!salonId) return
    setSavingPageTheme(true)
    const { data: current } = await supabase.from('salons').select('meta').eq('id', salonId).single()
    const existingMeta = (current as any)?.meta ?? {}
    const update: Record<string, string> = { page_theme: pageTheme }
    if (pageTheme === 'custom') {
      update.page_primary_color = pagePrimaryColor
      update.page_bg_color = pageBgColor
    }
    const { error: e } = await supabase.from('salons').update({ meta: { ...existingMeta, ...update } }).eq('id', salonId)
    if (e) setError('تعذّر حفظ الثيم: ' + e.message)
    setSavingPageTheme(false)
  }

  if (loading) {
    return (
      <div dir="rtl" className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#0a0a0c' }}>
        <p className="text-sm text-gray-500">جارٍ التحميل...</p>
      </div>
    )
  }

  return (
    <div dir="rtl" className={`min-h-screen ${cairo.className}`} style={{ backgroundColor: '#0a0a0c' }}>
      <div className="max-w-2xl mx-auto px-4 py-6 space-y-5">

        <div>
          <h1 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#fff', margin: 0, letterSpacing: '-0.02em' }}>الإعدادات</h1>
          <p style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.28)', marginTop: 2 }}>إدارة الصالون والتخصيصات</p>
        </div>

        {error && <div className="rounded-xl px-4 py-3 text-sm text-red-400 border border-red-900/40 bg-red-900/20">{error}</div>}

        {/* Page Theme */}
        <Section title="الثيم العام">
          <div className="space-y-4">
            <div className="flex flex-wrap gap-3">
              {([
                { key: 'gold',  color: '#D4AF37', label: 'ذهبي' },
                { key: 'white', color: '#c8a96e', label: 'فاتح', bg: '#f9f9f9' },
                { key: 'gray',  color: '#9CA3AF', label: 'رمادي' },
                { key: 'blue',  color: '#3B82F6', label: 'أزرق' },
                { key: 'pink',  color: '#E879A0', label: 'وردي' },
                { key: 'custom', color: pagePrimaryColor, label: 'مخصص' },
              ] as { key: string; color: string; label: string; bg?: string }[]).map(t => (
                <button
                  key={t.key}
                  type="button"
                  onClick={() => setPageTheme(t.key)}
                  className="flex flex-col items-center gap-1.5"
                >
                  <span
                    className="flex h-9 w-9 rounded-full border-2 transition-all"
                    style={{
                      backgroundColor: t.color,
                      borderColor: pageTheme === t.key ? '#fff' : 'transparent',
                      boxShadow: pageTheme === t.key ? `0 0 0 3px ${t.color}55` : 'none',
                    }}
                  />
                  <span className="text-[10px] text-gray-400">{t.label}</span>
                </button>
              ))}
            </div>

            {pageTheme === 'custom' && (
              <div className="flex flex-wrap gap-4 pt-1">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">اللون الرئيسي</label>
                  <input type="color" value={pagePrimaryColor} onChange={e => setPagePrimaryColor(e.target.value)}
                    className="h-9 w-16 cursor-pointer rounded-lg border border-white/10 bg-transparent p-0.5" />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">لون الخلفية</label>
                  <input type="color" value={pageBgColor} onChange={e => setPageBgColor(e.target.value)}
                    className="h-9 w-16 cursor-pointer rounded-lg border border-white/10 bg-transparent p-0.5" />
                </div>
              </div>
            )}

            {/* Live preview */}
            {(() => {
              const preview = pageTheme === 'custom'
                ? { primary: pagePrimaryColor, bg: pageBgColor, cardBg: 'rgba(255,255,255,0.06)', text: '#ffffff', textMuted: 'rgba(255,255,255,0.5)', border: `${pagePrimaryColor}33` }
                : (THEMES[(pageTheme as ThemeKey)] ?? THEMES.gold)
              const hex = preview.primary.replace('#', '')
              const isLight = hex.match(/^[0-9a-fA-F]{6}$/)
                ? (0.299 * parseInt(hex.slice(0,2),16) + 0.587 * parseInt(hex.slice(2,4),16) + 0.114 * parseInt(hex.slice(4,6),16)) / 255 > 0.55
                : true
              const btnText = isLight ? '#000' : '#fff'
              return (
                <div className="rounded-xl overflow-hidden border border-white/10" style={{ background: preview.bg }}>
                  <div className="px-3 py-1.5 border-b border-white/10">
                    <span className="text-[10px] text-gray-500 uppercase tracking-widest">معاينة</span>
                  </div>
                  <div className="p-4 flex flex-col gap-3">
                    {/* Sample card */}
                    <div className="rounded-xl p-3 border" style={{ background: preview.cardBg, borderColor: preview.border }}>
                      <div className="text-xs font-bold mb-1" style={{ color: preview.text }}>اسم الخدمة</div>
                      <div className="text-[11px]" style={{ color: preview.textMuted }}>وصف مختصر للخدمة أو العرض</div>
                      <div className="mt-1.5 text-sm font-extrabold" style={{ color: preview.primary }}>120 ر.س</div>
                    </div>
                    {/* Sample button */}
                    <button type="button" className="rounded-xl px-4 py-2 text-sm font-bold w-full" style={{ background: preview.primary, color: btnText }}>
                      احجز الآن
                    </button>
                  </div>
                </div>
              )
            })()}

            <button
              type="button"
              onClick={savePageTheme}
              disabled={savingPageTheme}
              className="rounded-xl px-5 py-2 text-sm font-semibold text-black disabled:opacity-60"
              style={{ background: 'linear-gradient(135deg,#e8c97a,#C9A55A)', color: '#1a0f00' }}
            >
              {savingPageTheme ? 'جارٍ الحفظ...' : 'حفظ الثيم'}
            </button>
          </div>
        </Section>

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

        {/* Page meta */}
        <Section title="إعدادات الصفحة">
          {metaEditing ? (
            <div className="space-y-3">
              <div>
                <label className="block text-xs text-gray-500 mb-1">عنوان الهيرو (hero_title)</label>
                <input value={metaForm.hero_title} onChange={e => setMetaForm(f => ({ ...f, hero_title: e.target.value }))}
                  placeholder="مثال: العناية المثالية للحلاقة الفاخرة" className={inputCls} />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">وصف قصير</label>
                <input value={metaForm.tagline} onChange={e => setMetaForm(f => ({ ...f, tagline: e.target.value }))}
                  placeholder="مثال: أفضل صالون في الحي" className={inputCls} />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">نص زر الحجز الرئيسي</label>
                <input value={metaForm.booking_button_hero_text} onChange={e => setMetaForm(f => ({ ...f, booking_button_hero_text: e.target.value }))}
                  placeholder="احجز موعدك الآن" className={inputCls} />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">الحي</label>
                <input value={metaForm.neighborhood} onChange={e => setMetaForm(f => ({ ...f, neighborhood: e.target.value }))}
                  placeholder="مثال: حي النزهة" className={inputCls} />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">صورة الغلاف</label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <span className="px-4 py-2 text-sm rounded-xl border border-white/10 text-gray-300 hover:bg-white/5 transition-colors"
                    style={{ backgroundColor: '#0a0a0c' }}>
                    {uploadingImage ? 'جارٍ الرفع...' : 'اختر صورة'}
                  </span>
                  {metaForm.hero_image && !uploadingImage && (
                    <span className="text-xs text-gray-500 truncate max-w-[180px]" dir="ltr">{metaForm.hero_image}</span>
                  )}
                  <input type="file" accept="image/*" className="hidden"
                    disabled={uploadingImage}
                    onChange={e => { const f = e.target.files?.[0]; if (f) uploadHeroImage(f) }} />
                </label>
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">صورة القسم المميز</label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <span className="px-4 py-2 text-sm rounded-xl border border-white/10 text-gray-300 hover:bg-white/5 transition-colors"
                    style={{ backgroundColor: '#0a0a0c' }}>
                    {uploadingFeatureImage ? 'جارٍ الرفع...' : 'اختر صورة'}
                  </span>
                  {metaForm.feature_image && !uploadingFeatureImage && (
                    <span className="text-xs text-gray-500 truncate max-w-[180px]" dir="ltr">{metaForm.feature_image}</span>
                  )}
                  <input type="file" accept="image/*" className="hidden"
                    disabled={uploadingFeatureImage}
                    onChange={e => { const f = e.target.files?.[0]; if (f) uploadFeatureImage(f) }} />
                </label>
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">رابط Google Maps (map_place_url)</label>
                <input value={metaForm.map_place_url} onChange={e => setMetaForm(f => ({ ...f, map_place_url: e.target.value }))}
                  placeholder="https://maps.google.com/..." className={inputCls} dir="ltr" />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">رابط تضمين الخريطة (map_embed_url)</label>
                <input value={metaForm.map_embed_url} onChange={e => setMetaForm(f => ({ ...f, map_embed_url: e.target.value }))}
                  placeholder="https://www.google.com/maps/embed?... أو كود iframe" className={inputCls} dir="ltr" />
              </div>
              <div className="flex items-center justify-end gap-2 pt-1">
                <button onClick={() => setMetaEditing(false)} className="px-4 py-2 text-sm text-gray-500 hover:text-gray-300">إلغاء</button>
                <button onClick={saveMeta} disabled={savingMeta}
                  className="px-5 py-2 text-sm font-medium rounded-xl disabled:opacity-40 transition-colors"
                  style={{ backgroundColor: '#D4A843', color: '#1a1a1a' }}>
                  {savingMeta ? 'جارٍ الحفظ...' : 'حفظ'}
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-1.5">
                <div className="flex items-center gap-3">
                  <span className="text-xs text-gray-500 w-24 shrink-0">عنوان الهيرو</span>
                  <span className="text-sm text-white">{salon?.meta?.hero_title || '—'}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-gray-500 w-24 shrink-0">وصف قصير</span>
                  <span className="text-sm text-white">{salon?.meta?.tagline || '—'}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-gray-500 w-24 shrink-0">الحي</span>
                  <span className="text-sm text-white">{salon?.meta?.neighborhood || '—'}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-gray-500 w-24 shrink-0">صورة الغلاف</span>
                  <span className="text-sm text-gray-400 truncate max-w-[200px]" dir="ltr">{salon?.meta?.hero_image || '—'}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-gray-500 w-24 shrink-0">map_place_url</span>
                  <span className="text-sm text-gray-400 truncate max-w-[200px]" dir="ltr">{salon?.meta?.map_place_url || '—'}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-gray-500 w-24 shrink-0">map_embed_url</span>
                  <span className="text-sm text-gray-400 truncate max-w-[200px]" dir="ltr">{salon?.meta?.map_embed_url || '—'}</span>
                </div>
              </div>
              <button onClick={() => setMetaEditing(true)}
                className="p-2 text-gray-600 hover:text-gray-300 rounded-lg hover:bg-white/5 transition-colors shrink-0"><IconEdit /></button>
            </div>
          )}
        </Section>

        {/* Barbers */}
        <Section title="الموظفين">
          <div className="space-y-2">
            {addingBarber && (
              <div className="flex items-center gap-2 pb-2 border-b border-white/10 mb-3">
                <input autoFocus value={newBarberName} onChange={e => setNewBarberName(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && saveNewBarber()} placeholder="اسم الحلاق"
                  className="flex-1 rounded-xl px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:ring-1 border border-white/10 bg-[#1a1a1a] focus:ring-[#C9A55A]" />
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
                      className="flex-1 rounded-xl px-3 py-1.5 text-sm text-white focus:outline-none focus:ring-1 border border-white/10 bg-[#1a1a1a] focus:ring-[#C9A55A]" />
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

        {/* Features */}
        {/* About */}
        <Section title="من نحن">
          <div className="space-y-3">
            <div>
              <label className="block text-xs text-gray-500 mb-1">عنوان القسم</label>
              <input value={aboutTitle} onChange={e => setAboutTitle(e.target.value)}
                placeholder="لماذا تختارنا" className={inputCls} />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">وصف القسم</label>
              <textarea value={aboutDescription} onChange={e => setAboutDescription(e.target.value)}
                placeholder="نص تعريفي..." rows={4}
                className={inputCls + ' resize-none'} />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs text-gray-500 mb-1">سنوات الخبرة</label>
                <input type="number" min="0" value={yearsExperience} onChange={e => setYearsExperience(e.target.value)}
                  placeholder="10" className={inputCls} />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">التقييم</label>
                <input type="number" min="0" max="5" step="0.1" value={rating} onChange={e => setRating(e.target.value)}
                  placeholder="4.9" className={inputCls} />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">عدد العملاء الراضين</label>
                <input type="number" min="0" value={happyClients} onChange={e => setHappyClients(e.target.value)}
                  placeholder="500" className={inputCls} />
              </div>
            </div>
            <div className="flex justify-end pt-1">
              <button onClick={saveAbout} disabled={savingAbout}
                className="px-5 py-2 text-sm font-medium rounded-xl disabled:opacity-40 transition-colors"
                style={{ backgroundColor: '#D4A843', color: '#1a1a1a' }}>
                {savingAbout ? 'جارٍ الحفظ...' : 'حفظ'}
              </button>
            </div>
          </div>
        </Section>

        <Section title="التقييمات">
          <div className="space-y-3">
            <div>
              <label className="block text-xs text-gray-500 mb-1">عنوان القسم</label>
              <input value={reviewsTitle} onChange={e => setReviewsTitle(e.target.value)}
                placeholder="مثال: التقييمات" className={inputCls} />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">النص التوضيحي</label>
              <input value={reviewsSubtitle} onChange={e => setReviewsSubtitle(e.target.value)}
                placeholder="مثال: آراء عملائنا تعكس مستوى الخدمة" className={inputCls} />
            </div>
            {reviews.length > 0 && (
              <div className="space-y-2">
                {reviews.map((r, i) => (
                  <div key={i} className="flex items-start justify-between gap-2 rounded-xl border border-white/8 p-3" style={{ backgroundColor: '#0a0a0c' }}>
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-white/80 truncate">{r.name}</p>
                      <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{r.text}</p>
                    </div>
                    <button onClick={() => setReviews(prev => prev.filter((_, j) => j !== i))}
                      className="shrink-0 p-1 text-gray-600 hover:text-red-400 rounded-lg hover:bg-red-900/20 transition-colors">
                      <IconTrash />
                    </button>
                  </div>
                ))}
              </div>
            )}
            <div className="rounded-xl border border-white/8 p-3 space-y-2" style={{ backgroundColor: '#0a0a0c' }}>
              <p className="text-xs text-gray-500">إضافة تقييم جديد</p>
              <div>
                <label className="block text-xs text-gray-500 mb-1">الاسم</label>
                <input value={reviewForm.name} onChange={e => setReviewForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="مثال: أحمد العمري" className={inputCls} />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">نص التقييم</label>
                <textarea value={reviewForm.text} onChange={e => setReviewForm(f => ({ ...f, text: e.target.value }))}
                  placeholder="اكتب التقييم هنا..." rows={3}
                  className={inputCls + ' resize-none'} />
              </div>
              <button
                onClick={() => {
                  if (!reviewForm.name.trim() || !reviewForm.text.trim()) return
                  setReviews(prev => [...prev, { name: reviewForm.name.trim(), text: reviewForm.text.trim() }])
                  setReviewForm({ name: '', text: '' })
                }}
                className="flex items-center gap-1 px-4 py-2 text-sm font-medium rounded-xl transition-colors"
                style={{ backgroundColor: '#D4A843', color: '#1a1a1a' }}>
                + إضافة
              </button>
            </div>
            <div className="flex justify-end pt-1">
              <button onClick={saveReviews} disabled={savingReviews}
                className="px-5 py-2 text-sm font-medium rounded-xl disabled:opacity-40 transition-colors"
                style={{ backgroundColor: '#D4A843', color: '#1a1a1a' }}>
                {savingReviews ? 'جارٍ الحفظ...' : 'حفظ'}
              </button>
            </div>
          </div>
        </Section>

        <Section title="ما يميزنا">
          <div className="space-y-3">
            <div>
              <label className="block text-xs text-gray-500 mb-1">عنوان القسم</label>
              <input value={featuresTitle} onChange={e => setFeaturesTitle(e.target.value)}
                placeholder="ماذا يميزنا" className={inputCls} />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">وصف القسم</label>
              <input value={featuresSubtitle} onChange={e => setFeaturesSubtitle(e.target.value)}
                placeholder="نحن لسنا مجرد صالون..." className={inputCls} />
            </div>
            <p className="text-xs text-gray-500">أضف مميزات تظهر في صفحة الصالون</p>
            {features.map((f, i) => (
              <div key={i} className="rounded-xl border border-white/8 p-3 space-y-2" style={{ backgroundColor: '#0a0a0c' }}>
                <div className="flex items-center justify-between">
                  <p className="text-xs text-gray-600">الميزة {i + 1}</p>
                  <button onClick={() => setFeatures(prev => prev.filter((_, j) => j !== i))}
                    className="p-1 text-gray-600 hover:text-red-400 rounded-lg hover:bg-red-900/20 transition-colors">
                    <IconTrash />
                  </button>
                </div>
                <input
                  value={f.title}
                  onChange={e => setFeatures(prev => prev.map((x, j) => j === i ? { ...x, title: e.target.value } : x))}
                  placeholder="العنوان"
                  className={inputCls}
                />
                <input
                  value={f.description}
                  onChange={e => setFeatures(prev => prev.map((x, j) => j === i ? { ...x, description: e.target.value } : x))}
                  placeholder="الوصف"
                  className={inputCls}
                />
              </div>
            ))}
            <button onClick={() => setFeatures(prev => [...prev, { title: '', description: '' }])}
              className="w-full flex items-center justify-center gap-1.5 py-2 rounded-xl text-sm transition-colors border border-dashed border-white/10 text-gray-500 hover:border-white/20 hover:text-gray-300">
              <span className="text-base leading-none">+</span>إضافة ميزة
            </button>
            <div className="flex justify-end pt-1">
              <button onClick={saveFeatures} disabled={savingFeatures}
                className="px-5 py-2 text-sm font-medium rounded-xl disabled:opacity-40 transition-colors"
                style={{ backgroundColor: '#D4A843', color: '#1a1a1a' }}>
                {savingFeatures ? 'جارٍ الحفظ...' : 'حفظ'}
              </button>
            </div>
          </div>
        </Section>

        <Section title="قسم الحجز — الهيرو">
          <div className="space-y-3">
            <div>
              <label className="block text-xs text-gray-500 mb-1">العنوان الكبير</label>
              <textarea value={bookingHeroTitle} onChange={e => setBookingHeroTitle(e.target.value)}
                placeholder={"تفاصيل دقيقة\nأجواء راقية"} rows={3}
                className={inputCls + ' resize-none'} />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">وصف الهيرو</label>
              <textarea value={bookingHeroDescription} onChange={e => setBookingHeroDescription(e.target.value)}
                placeholder="حلاقة رجالية فاخرة في قلب المدينة، بالحجز المسبق فقط." rows={3}
                className={inputCls + ' resize-none'} />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">عنوان كارت الحجز</label>
              <input value={bookingCardTitle} onChange={e => setBookingCardTitle(e.target.value)}
                placeholder="حجز سريع" className={inputCls} />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">وصف الكارت</label>
              <input value={bookingCardSubtitle} onChange={e => setBookingCardSubtitle(e.target.value)}
                placeholder="اختر الحلاق والخدمة والوقت… والباقي علينا." className={inputCls} />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">الخطوة الأولى</label>
              <input value={bookingStep1} onChange={e => setBookingStep1(e.target.value)}
                placeholder="اختر الحلاق" className={inputCls} />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">الخطوة الثانية</label>
              <input value={bookingStep2} onChange={e => setBookingStep2(e.target.value)}
                placeholder="حدّد الخدمات" className={inputCls} />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">الخطوة الثالثة</label>
              <input value={bookingStep3} onChange={e => setBookingStep3(e.target.value)}
                placeholder="ثبّت موعدك" className={inputCls} />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">نص زر الحجز</label>
              <input value={bookingButtonText} onChange={e => setBookingButtonText(e.target.value)}
                placeholder="ابدأ الحجز" className={inputCls} />
            </div>
            <div className="flex justify-end pt-1">
              <button onClick={saveBookingHero} disabled={savingBookingHero}
                className="px-5 py-2 text-sm font-medium rounded-xl disabled:opacity-40 transition-colors"
                style={{ backgroundColor: '#D4A843', color: '#1a1a1a' }}>
                {savingBookingHero ? 'جارٍ الحفظ...' : 'حفظ'}
              </button>
            </div>
          </div>
        </Section>

        <Section title="الشعار">
          <div className="space-y-3">
            {logoUrl && (
              <div className="flex items-center gap-3">
                <img src={logoUrl} alt="الشعار الحالي" className="h-16 w-auto rounded-xl object-contain border border-white/10" />
                <button onClick={deleteLogo} disabled={deletingLogo}
                  className="px-3 py-1.5 text-xs font-medium rounded-xl disabled:opacity-40 transition-colors border border-red-500/40 text-red-400 hover:bg-red-900/20">
                  {deletingLogo ? 'جارٍ الحذف...' : 'حذف'}
                </button>
              </div>
            )}
            <div>
              <label className="block text-xs text-gray-500 mb-1">رفع الشعار</label>
              <input type="file" accept="image/*" disabled={uploadingLogo}
                onChange={e => { const f = e.target.files?.[0]; if (f) uploadLogo(f) }}
                className={inputCls} />
            </div>
            {uploadingLogo && <p className="text-xs text-gray-500">جارٍ الرفع...</p>}
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-400">استخدام الشعار التلقائي</span>
              <Toggle value={useAutoLogo} onChange={v => { setUseAutoLogo(v); saveAutoLogo(v, logoLetter) }} />
            </div>
            {useAutoLogo && (
              <div>
                <label className="block text-xs text-gray-500 mb-1">الحرف</label>
                <input value={logoLetter} maxLength={1}
                  onChange={e => { setLogoLetter(e.target.value); saveAutoLogo(useAutoLogo, e.target.value) }}
                  placeholder={salon?.name?.[0] ?? 'ف'} className={inputCls} />
              </div>
            )}
            <div className="flex justify-end pt-1">
              <button onClick={async () => {
                const id = salonId ?? salon?.id ?? null
                if (!id) return
                setSavingAutoLogo(true)
                const { data: current } = await supabase.from('salons').select('meta').eq('id', id).single()
                const existingMeta = (current as any)?.meta ?? {}
                const { error: e } = await supabase.from('salons').update({ meta: { ...existingMeta, logo_url: logoUrl, use_auto_logo: useAutoLogo, logo_letter: logoLetter.trim() } }).eq('id', id)
                if (e) setError('تعذّر حفظ الشعار: ' + e.message)
                setSavingAutoLogo(false)
              }} disabled={savingAutoLogo}
                className="px-5 py-2 text-sm font-medium rounded-xl disabled:opacity-40 transition-colors"
                style={{ backgroundColor: '#D4A843', color: '#1a1a1a' }}>
                {savingAutoLogo ? 'جارٍ الحفظ...' : 'حفظ'}
              </button>
            </div>
          </div>
        </Section>

        {salonSlug && (
          <a href={`/${salonSlug}`} target="_blank" rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 w-full py-3 rounded-2xl text-sm font-medium transition-colors"
            style={{ backgroundColor: '#C9A84C', color: '#000' }}>
            <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/>
            </svg>
            زيارة موقعي
          </a>
        )}

      </div>
    </div>
  )
}
