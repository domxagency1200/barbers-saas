'use client'

import { useState, useEffect, useRef } from 'react'

function toEmbedUrl(url: string): string {
  if (!url) return ''
  if (url.includes('/maps/embed')) return url
  const coord = url.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/)
  if (coord) return `https://www.google.com/maps?q=${coord[1]},${coord[2]}&output=embed`
  try {
    const u = new URL(url)
    u.searchParams.set('output', 'embed')
    return u.toString()
  } catch { return url }
}

interface Barber { id: string; name: string }
interface Service { id: string; name_ar: string; price: number; duration_min: number }
interface Props {
  salon: { id: string; name: string; whatsapp_number: string | null; city: string | null; working_hours?: string | null; meta?: { hero_title?: string; tagline?: string; neighborhood?: string; hero_image?: string; feature_image?: string; map_url?: string; map_embed_url?: string; map_place_url?: string } | null }
  barbers: Barber[]
  services: Service[]
  slug: string
}

function pad2(n: number) { return String(n).padStart(2, '0') }
function toArabicTimeLabel(h24: number, min: number) {
  const suffix = h24 < 12 ? 'صباحاً' : 'مساءً'
  const h12 = h24 % 12 === 0 ? 12 : h24 % 12
  return `${h12}:${pad2(min)} ${suffix}`
}
const SB_URL = 'https://vkemzfyenxxbjwferyms.supabase.co'
const SB_KEY = 'sb_publishable_3T-Bz6_RheK-wikV9kO9jg_-rjQ0gua'
const TENANT_ID = '4619cc68-fc96-4fec-bee7-bb4046b0fc1a'

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Tajawal:wght@300;400;500;700;800&display=swap');
  :root { color-scheme: dark; --gold: #C9A84C; --gold-light: #E8C96B; --gold-dark: #A07830; --hero-image: url('/hero.jpg'); }
  html { scroll-behavior: smooth; }
  @media (prefers-reduced-motion: reduce) {
    html { scroll-behavior: auto; }
    *, *::before, *::after { animation-duration: 0.001ms !important; animation-iteration-count: 1 !important; transition-duration: 0.001ms !important; }
  }
  .btn-gold { background: linear-gradient(135deg,#E8C96B 0%,#C9A84C 45%,#A87C2A 100%); box-shadow: 0 0 0 1px rgba(201,168,76,.35),0 4px 20px rgba(201,168,76,.25),0 8px 32px rgba(0,0,0,.4); transition: transform .25s cubic-bezier(.4,0,.2,1),box-shadow .25s cubic-bezier(.4,0,.2,1),filter .25s ease; position: relative; overflow: hidden; }
  .btn-gold::after { content:''; position:absolute; inset:0; background:linear-gradient(135deg,rgba(255,255,255,.22) 0%,transparent 55%); opacity:0; transition:opacity .25s ease; }
  .btn-gold:hover { transform:translateY(-2px); box-shadow:0 0 0 1px rgba(201,168,76,.55),0 0 32px rgba(201,168,76,.3),0 12px 44px rgba(0,0,0,.5); filter:brightness(1.06); }
  .btn-gold:hover::after { opacity:1; }
  .btn-gold:active { transform:translateY(0); }
  .glass-card { background:rgba(255,255,255,.04); backdrop-filter:blur(14px); -webkit-backdrop-filter:blur(14px); border:1px solid rgba(255,255,255,.08); transition:transform .35s cubic-bezier(.4,0,.2,1),box-shadow .35s cubic-bezier(.4,0,.2,1),border-color .35s ease,background .35s ease; position:relative; overflow:hidden; }
  .glass-card::before { content:''; position:absolute; top:0; left:0; right:0; height:2px; background:linear-gradient(90deg,transparent,var(--gold),transparent); opacity:0; transition:opacity .35s ease; }
  .glass-card:hover { background:rgba(255,255,255,.07); border-color:rgba(201,168,76,.28); transform:translateY(-5px); box-shadow:0 0 0 1px rgba(201,168,76,.15),0 24px 64px rgba(0,0,0,.55); }
  .glass-card:hover::before { opacity:1; }
  .reveal { opacity:0; transform:translateY(30px); transition:opacity .75s cubic-bezier(.4,0,.2,1),transform .75s cubic-bezier(.4,0,.2,1); }
  .reveal.visible { opacity:1; transform:translateY(0); }
  .reveal-d1{transition-delay:.1s}.reveal-d2{transition-delay:.2s}.reveal-d3{transition-delay:.3s}.reveal-d4{transition-delay:.45s}
  .sec-label { display:inline-flex; align-items:center; gap:8px; font-size:.7rem; font-weight:700; letter-spacing:.14em; color:var(--gold); text-transform:uppercase; margin-bottom:.6rem; }
  .sec-label::before { content:''; display:inline-block; width:22px; height:1px; background:var(--gold); }
  #siteHeader { transition:background .4s ease,border-color .4s ease,box-shadow .4s ease,backdrop-filter .4s ease; }
  #siteHeader.scrolled { background:rgba(0,0,0,.88)!important; border-color:rgba(201,168,76,.2)!important; box-shadow:0 4px 32px rgba(0,0,0,.45); backdrop-filter:blur(24px); }
  .headline-gold { background:linear-gradient(120deg,#fff 0%,#E8C96B 45%,#C9A84C 100%); -webkit-background-clip:text; -webkit-text-fill-color:transparent; background-clip:text; }
  @keyframes floatY { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-7px)} }
  .float-anim { animation:floatY 4s ease-in-out infinite; }
  @keyframes scrollBounce { 0%,100%{transform:translateY(0) translateX(-50%);opacity:.4} 50%{transform:translateY(6px) translateX(-50%);opacity:.9} }
  .scroll-dot { animation:scrollBounce 2s ease-in-out infinite; }
  .star-pop{display:inline-block;animation:starIn .4s ease both}
  .star-pop:nth-child(1){animation-delay:.05s}.star-pop:nth-child(2){animation-delay:.12s}.star-pop:nth-child(3){animation-delay:.19s}.star-pop:nth-child(4){animation-delay:.26s}.star-pop:nth-child(5){animation-delay:.33s}
  @keyframes starIn{from{opacity:0;transform:scale(.4) rotate(-20deg)}to{opacity:1;transform:scale(1) rotate(0deg)}}
  .field-input:focus { border-color:rgba(201,168,76,.65)!important; box-shadow:0 0 0 3px rgba(201,168,76,.14)!important; outline:none; }
  #heroBg { will-change:transform; }
  .sec-light { background:#FAF7F0!important; }
  section.sec-light { border-color:rgba(201,168,76,.18)!important; }
  .sec-light h2,.sec-light td.font-bold,.sec-light th.font-extrabold { color:#1E1608!important; }
  .sec-light .glass-card { background:rgba(255,255,255,.7)!important; border-color:rgba(201,168,76,.2)!important; }
  .sec-light .glass-card:hover { background:rgba(255,255,255,.95)!important; border-color:rgba(201,168,76,.38)!important; }
  .text-gold{color:#C9A84C}
  .border-gold\\/10{border-color:rgba(201,168,76,.10)}.border-gold\\/15{border-color:rgba(201,168,76,.15)}.border-gold\\/20{border-color:rgba(201,168,76,.20)}.border-gold\\/22{border-color:rgba(201,168,76,.22)}.border-gold\\/25{border-color:rgba(201,168,76,.25)}.border-gold\\/28{border-color:rgba(201,168,76,.28)}.border-gold\\/30{border-color:rgba(201,168,76,.30)}.border-gold\\/40{border-color:rgba(201,168,76,.40)}.border-gold\\/55{border-color:rgba(201,168,76,.55)}
  .bg-gold\\/5{background-color:rgba(201,168,76,.05)}.bg-gold\\/6{background-color:rgba(201,168,76,.06)}.bg-gold\\/7{background-color:rgba(201,168,76,.07)}.bg-gold\\/8{background-color:rgba(201,168,76,.08)}.bg-gold\\/10{background-color:rgba(201,168,76,.10)}.bg-gold\\/12{background-color:rgba(201,168,76,.12)}.bg-gold\\/25{background-color:rgba(201,168,76,.25)}
  .hover\\:text-gold:hover{color:#C9A84C}.hover\\:border-gold\\/25:hover{border-color:rgba(201,168,76,.25)}.hover\\:border-gold\\/30:hover{border-color:rgba(201,168,76,.30)}.hover\\:border-gold\\/40:hover{border-color:rgba(201,168,76,.40)}.hover\\:border-gold\\/55:hover{border-color:rgba(201,168,76,.55)}.hover\\:bg-gold\\/5:hover{background-color:rgba(201,168,76,.05)}
  .hover\\:bg-white\\/3:hover{background-color:rgba(255,255,255,.03)}.hover\\:bg-white\\/5:hover{background-color:rgba(255,255,255,.05)}.hover\\:bg-white\\/10:hover{background-color:rgba(255,255,255,.10)}
  .focus\\:ring-gold\\/60:focus{box-shadow:0 0 0 3px rgba(201,168,76,.60);outline:none}
  .shadow-glow{box-shadow:0 0 0 1px rgba(201,168,76,.28),0 18px 50px rgba(0,0,0,.55)}.shadow-glow-lg{box-shadow:0 0 0 1px rgba(201,168,76,.4),0 0 40px rgba(201,168,76,.2),0 24px 60px rgba(0,0,0,.6)}.shadow-soft{box-shadow:0 14px 45px rgba(0,0,0,.55)}
  .accent-\\[\\#C9A84C\\]{accent-color:#C9A84C}
  .bg-ink{background-color:#0f0f0f}
`

export default function SalonPage({ salon, barbers, services, slug }: Props) {
  const [bookingOpen, setBookingOpen] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const heroBgRef = useRef<HTMLDivElement>(null)

  // form
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('05')
  const [barber, setBarber] = useState('')
  const [date, setDate] = useState('')
  const [time, setTime] = useState('')
  const [checkedServices, setCheckedServices] = useState<Set<string>>(new Set())
  const [timeOpts, setTimeOpts] = useState<{ value: string; label: string; booked: boolean }[]>([])
  const [formMsg, setFormMsg] = useState<{ text: string; error: boolean } | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const today = (() => { const n = new Date(); return `${n.getFullYear()}-${pad2(n.getMonth()+1)}-${pad2(n.getDate())}` })()

  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 50)
      if (heroBgRef.current) heroBgRef.current.style.transform = `translateY(${window.scrollY * 0.3}px)`
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    const els = document.querySelectorAll('.reveal')
    const obs = new IntersectionObserver(entries => {
      entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('visible'); obs.unobserve(e.target) } })
    }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' })
    els.forEach(el => obs.observe(el))
    return () => obs.disconnect()
  }, [])

  useEffect(() => {
    if (!bookingOpen) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setBookingOpen(false) }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [bookingOpen])

  useEffect(() => {
    document.body.classList.toggle('overflow-hidden', bookingOpen)
    return () => { document.body.classList.remove('overflow-hidden') }
  }, [bookingOpen])

  useEffect(() => {
    let cancelled = false
    async function fill() {
      if (!barber || !date) { if (!cancelled) setTimeOpts([]); return }
      const barberObj = barbers.find(b => b.name === barber)
      if (!barberObj) { if (!cancelled) setTimeOpts([]); return }
      try {
        const url = `/api/availability?barber_id=${barberObj.id}&date=${date}&duration=30&utcOffset=180&salon_id=${salon.id}`
        const res = await fetch(url)
        const json = await res.json()
        if (res.ok) {
          const slots: string[] = json.slots ?? []
          if (!cancelled) setTimeOpts(slots.map(s => {
            const [h, m] = s.split(':').map(Number)
            return { value: s, label: toArabicTimeLabel(h, m), booked: false }
          }))
        }
      } catch (err) { console.error('[availability] fetch error:', err); if (!cancelled) setTimeOpts([]) }
    }
    fill()
    return () => { cancelled = true }
  }, [barber, date, barbers])

  function openBooking(svc = '', brb = '') {
    setBookingOpen(true); setFormMsg(null)
    if (brb) setBarber(brb)
    if (svc) setCheckedServices(new Set([svc]))
  }

  function handlePhone(e: React.ChangeEvent<HTMLInputElement>) {
    let v = e.target.value.replace(/\D/g, '')
    if (!v.startsWith('05')) v = '05' + v.replace(/^0{0,1}5{0,1}/, '')
    if (v.length > 10) v = v.slice(0, 10)
    if (v.length < 2) v = '05'
    setPhone(v)
  }

  function toggleService(s: string) {
    setCheckedServices(prev => { const n = new Set(prev); n.has(s) ? n.delete(s) : n.add(s); return n })
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (checkedServices.size === 0) { setFormMsg({ text: 'يرجى اختيار خدمة واحدة على الأقل.', error: true }); return }
    if (!/^05\d{8}$/.test(phone)) { setFormMsg({ text: 'رقم الجوال يجب أن يبدأ بـ 05 ويتكون من 10 أرقام.', error: true }); return }
    const barberObj = barbers.find(b => b.name === barber)
    if (!barberObj) { setFormMsg({ text: 'يرجى اختيار الحلاق.', error: true }); return }
    const serviceObj = services.find(s => checkedServices.has(s.name_ar))
    if (!serviceObj) { setFormMsg({ text: 'يرجى اختيار خدمة.', error: true }); return }
    if (!date || !time) { setFormMsg({ text: 'يرجى اختيار التاريخ والوقت.', error: true }); return }
    const starts_at = new Date(`${date}T${time}:00+03:00`).toISOString()
    const ends_at = new Date(new Date(starts_at).getTime() + serviceObj.duration_min * 60 * 1000).toISOString()
    setSubmitting(true)
    try {
      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ salon_id: salon.id, barber_id: barberObj.id, service_id: serviceObj.id, customer_name: name, customer_phone: phone, starts_at, ends_at }),
      })
      const json = await res.json()
      if (!res.ok) { setFormMsg({ text: json.error ?? 'حدث خطأ أثناء الحجز، يرجى المحاولة مرة أخرى.', error: true }); return }
      setFormMsg({ text: 'تم الحجز بنجاح! سنتواصل معك قريباً.', error: false })
      setName(''); setPhone('05'); setBarber(''); setDate(''); setTime(''); setCheckedServices(new Set())
    } catch { setFormMsg({ text: 'حدث خطأ أثناء الحجز، يرجى المحاولة مرة أخرى.', error: true }) }
    finally { setSubmitting(false) }
  }

  function handleWhatsApp() {
    const svcs = Array.from(checkedServices)
    if (svcs.length === 0) { setFormMsg({ text: 'يرجى اختيار خدمة واحدة على الأقل لإرسالها عبر واتساب.', error: true }); return }
    const parts = ['أرغب بحجز خدمة:', svcs.join(' + '), barber ? `الحلاق: ${barber}` : '', date ? `التاريخ: ${date}` : '', time ? `الوقت: ${time}` : '', `صالون ${salon.name}`].filter(Boolean).join('\n')
    const wa = salon.whatsapp_number
    window.open(wa ? `https://wa.me/${wa}?text=${encodeURIComponent(parts)}` : `https://wa.me/?text=${encodeURIComponent(parts)}`, '_blank', 'noopener,noreferrer')
  }

  const city = salon.city ?? 'الرياض'
  const workingHours = salon.working_hours || '08:00–22:00'
  const tagline = salon.meta?.tagline || `مستوى جديد من العناية الرجالية في ${city} — تفاصيل دقيقة، أجواء راقية، بالحجز المسبق فقط.`
  const neighborhood = salon.meta?.neighborhood || city
  const heroImage = salon.meta?.hero_image || '/hero.jpg'
  const mapUrl = salon.meta?.map_url || null
  const mapHref = (() => {
    if (!mapUrl) return 'https://maps.google.com'
    const placeId = mapUrl.match(/!1s([^!]+)(?=!5e)/)?.[1]
    if (placeId) return `https://www.google.com/maps/place/?q=place_id:${placeId}`
    const lat = mapUrl.match(/!3d(-?\d+\.\d+)/)?.[1]
    const lng = mapUrl.match(/!2d(-?\d+\.\d+)/)?.[1]
    if (lat && lng) return `https://maps.google.com/?q=${lat},${lng}&ll=${lat},${lng}&z=19`
    return mapUrl.replace('maps/embed', 'maps')
  })()
  const featured = services.slice(0, 3)

  return (
    <div lang="ar" dir="rtl" style={{ fontFamily: "'Tajawal', ui-sans-serif, system-ui, sans-serif", backgroundColor: '#0f0f0f', color: 'white' }}>
      <style>{CSS}</style>

      {/* ── NAVBAR ── */}
      <header id="siteHeader" className={`fixed inset-x-0 top-0 z-50 border-b border-gold/10 bg-black/25 backdrop-blur-md${scrolled ? ' scrolled' : ''}`}>
        <nav className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 lg:px-6">
          <a href="#home" className="group inline-flex items-center gap-3">
            <span className="h-14 w-14 rounded-full overflow-hidden flex-shrink-0 transition-all duration-300 group-hover:shadow-glow" style={{ background: '#17120A', boxShadow: '0 0 0 1.5px rgba(200,169,110,.45)' }} aria-hidden="true">
              <div style={{ width: '100%', height: '100%', background: "url('/ref.png') no-repeat 50% 68%/160%", filter: 'invert(1) sepia(0.9) saturate(3) hue-rotate(5deg) brightness(0.92)', mixBlendMode: 'screen' }} />
            </span>
            <div className="leading-tight">
              <div className="text-lg font-extrabold tracking-tight">{salon.name}</div>
              <div className="text-[11px] tracking-wider text-gold" style={{ opacity: 0.7 }}>حجز مسبق • عناية فاخرة</div>
            </div>
          </a>

          <button onClick={() => setMobileOpen(o => !o)} className="inline-flex items-center justify-center rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/90 transition-all duration-200 hover:border-gold/30 hover:bg-white/10 lg:hidden" aria-label="فتح القائمة" aria-expanded={mobileOpen}>
            <span className="sr-only">القائمة</span>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
          </button>

          <div className="hidden items-center gap-7 lg:flex">
            <a className="text-sm text-white/65 transition-colors duration-200 hover:text-gold" href="#home">الرئيسية</a>
            <a className="text-sm text-white/65 transition-colors duration-200 hover:text-gold" href="#services">الخدمات</a>
            <a className="text-sm text-white/65 transition-colors duration-200 hover:text-gold" href="#why-us">المعرض</a>
            <a className="text-sm text-white/65 transition-colors duration-200 hover:text-gold" href="#reviews">التقييمات</a>
            <a className="text-sm text-white/65 transition-colors duration-200 hover:text-gold" href="#location">الموقع</a>
            <button type="button" onClick={() => openBooking()} className="btn-gold rounded-xl px-5 py-2.5 text-sm font-bold text-black focus:outline-none focus:ring-gold/60 focus:ring-offset-2 focus:ring-offset-black">احجز الآن</button>
          </div>
        </nav>

        {mobileOpen && (
          <div className="border-t border-gold/10 lg:hidden" style={{ background: 'rgba(0,0,0,.82)', backdropFilter: 'blur(20px)' }}>
            <div className="mx-auto grid max-w-6xl gap-1 px-4 py-4">
              {['#home:الرئيسية','#services:الخدمات والأسعار','#why-us:المعرض','#reviews:التقييمات','#location:الموقع'].map(item => {
                const [href, label] = item.split(':')
                return <a key={href} className="rounded-xl px-4 py-3 text-sm text-white/75 transition-colors hover:bg-white/5 hover:text-gold" href={href} onClick={() => setMobileOpen(false)}>{label}</a>
              })}
              <button type="button" onClick={() => { openBooking(); setMobileOpen(false) }} className="btn-gold mt-2 rounded-xl px-4 py-3 text-sm font-bold text-black">احجز الآن</button>
            </div>
          </div>
        )}
      </header>

      <main>
        {/* ── HERO ── */}
        <section id="home" className="relative isolate scroll-mt-24 overflow-hidden flex items-center" aria-label="القسم الرئيسي">
          <div className="absolute inset-0 -z-10 overflow-hidden">
            <div ref={heroBgRef} id="heroBg" className="absolute inset-[-10%]" style={{ backgroundImage: `url('${heroImage}')`, backgroundSize: 'cover', backgroundPosition: 'center center' }} />
            <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom,rgba(0,0,0,.18) 0%,rgba(15,15,15,.72) 55%,rgba(15,15,15,.98) 100%),radial-gradient(ellipse 90% 60% at 65% 5%,rgba(201,168,76,.13) 0%,transparent 65%),radial-gradient(ellipse 55% 75% at 5% 45%,rgba(255,255,255,.03) 0%,transparent 55%)' }} />
          </div>

          <div className="mx-auto w-full max-w-6xl px-4 pb-12 pt-28 lg:px-6 lg:pt-44 lg:pb-24">
            <div className="reveal">
              <div className="float-anim mb-8 inline-flex items-center gap-2.5 rounded-full border border-gold/30 px-5 py-2 text-sm bg-gold/7">
                <svg className="h-3.5 w-3.5 text-gold flex-shrink-0" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
                <span className="font-bold text-gold">4.9 / 5</span>
                <span className="text-white/35">•</span>
                <span className="text-white/70">+500 عميل راضٍ</span>
                <span className="text-white/35">•</span>
                <span className="text-white/70">+10 سنوات خبرة</span>
              </div>
              <h1 className="text-3xl font-extrabold leading-[1.1] tracking-tight sm:text-5xl lg:text-[4.5rem]">
                {salon.meta?.hero_title ? (
                  <span className="block" style={{ color: '#C9A84C' }}>{salon.meta.hero_title}</span>
                ) : (
                  <>
                    <span className="block text-white">العناية المثالية</span>
                    <span className="headline-gold block mt-1">للحلاقة الفاخرة</span>
                  </>
                )}
              </h1>
              <p className="mt-4 max-w-lg text-base leading-relaxed text-white/60 sm:text-lg lg:text-xl">{tagline}</p>
              <div className="mt-7 flex flex-wrap items-center gap-3 lg:mt-10 lg:gap-4">
                <button type="button" onClick={() => openBooking()} className="btn-gold rounded-2xl px-6 py-3 text-sm font-extrabold text-black sm:px-8 sm:py-4 sm:text-base focus:outline-none focus:ring-2 focus:ring-gold/60 focus:ring-offset-2 focus:ring-offset-black">احجز موعدك الآن</button>
                <a href="#offers" className="group flex items-center gap-2 rounded-2xl border border-white/15 px-6 py-3 text-sm font-bold text-white/80 transition-all duration-300 sm:px-8 sm:py-4 sm:text-base hover:border-gold/40 hover:text-white" style={{ background: 'rgba(255,255,255,.04)' }}>
                  عروضنا
                  <svg className="h-4 w-4 transition-transform duration-200 group-hover:-translate-x-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5m0 0l7-7m-7 7l7 7"/></svg>
                </a>
              </div>
              <div className="mt-8 flex items-center rounded-2xl border border-white/8 divide-x divide-x-reverse divide-white/8 overflow-hidden" style={{ background: 'rgba(255,255,255,.04)', backdropFilter: 'blur(10px)' }}>
                <div className="flex-1 min-w-0 px-2.5 py-2.5 sm:px-4 sm:py-3"><div className="text-[10px] sm:text-xs text-white/45 mb-0.5">الحجز</div><div className="text-xs sm:text-sm font-bold truncate">بالحجز المسبق فقط</div></div>
                <div className="flex-1 min-w-0 px-2.5 py-2.5 sm:px-4 sm:py-3"><div className="text-[10px] sm:text-xs text-white/45 mb-0.5">الموقع</div><div className="text-xs sm:text-sm font-bold truncate">{neighborhood}</div></div>
                <div className="flex-1 min-w-0 px-2.5 py-2.5 sm:px-4 sm:py-3"><div className="text-[10px] sm:text-xs text-white/45 mb-0.5">ساعات العمل</div><div className="text-xs sm:text-sm font-bold truncate">{workingHours}</div></div>
              </div>
            </div>

          </div>

          <div className="scroll-dot absolute bottom-8 left-1/2 flex flex-col items-center gap-2 text-white/30 pointer-events-none" style={{ transform: 'translateX(-50%)' }}>
            <div className="text-[10px] tracking-widest uppercase">اكتشف</div>
            <div className="h-7 w-px" style={{ background: 'linear-gradient(to bottom,rgba(255,255,255,.3),transparent)' }} />
          </div>
        </section>

        {/* ── QUICK BOOKING ── */}
        <section className="bg-ink">
          <div className="mx-auto max-w-6xl px-4 py-12 lg:px-6">
            <div className="relative overflow-hidden rounded-3xl border border-gold/20 shadow-glow reveal" style={{ background: 'rgba(11,11,11,.75)', backdropFilter: 'blur(22px)' }}>
              <div className="pointer-events-none absolute inset-0" style={{ background: 'radial-gradient(circle at 70% 15%,rgba(201,168,76,.1),transparent 55%)' }} />
              <div className="relative p-7 lg:flex lg:items-center lg:gap-12">
                <div className="lg:flex-1">
                  <div className="text-[11px] font-bold tracking-widest text-gold uppercase mb-1">{salon.name}</div>
                  <div className="text-2xl font-extrabold leading-snug mt-2">تفاصيل دقيقة<br /><span className="text-gold">أجواء راقية</span></div>
                  <p className="mt-3 text-sm leading-relaxed text-white/55">حلاقة رجالية فاخرة في قلب المدينة، بالحجز المسبق فقط.</p>
                </div>
                <div className="mt-6 lg:mt-0 lg:w-80 rounded-2xl border border-gold/15 p-5 bg-gold/6">
                  <div className="text-sm font-extrabold">حجز سريع</div>
                  <div className="mt-1 text-xs text-white/50">اختر الحلاق والخدمة والوقت… والباقي علينا.</div>
                  <div className="mt-4 grid gap-2.5 text-sm text-white/75">
                    {['اختر الحلاق','حدّد الخدمات','ثبّت موعدك'].map((s, i) => (
                      <div key={i} className="flex items-center gap-3">
                        <span className="inline-flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full text-xs font-extrabold text-black" style={{ background: 'linear-gradient(135deg,#E8C96B,#C9A84C)' }}>{i+1}</span>
                        <span>{s}</span>
                      </div>
                    ))}
                  </div>
                  <button type="button" onClick={() => openBooking()} className="btn-gold mt-5 w-full rounded-xl px-4 py-3 text-sm font-extrabold text-black">ابدأ الحجز</button>
                </div>
                {barbers.length > 0 && (
                  <div className="mt-5 lg:hidden flex flex-wrap gap-2">
                    {barbers.map(b => (
                      <button key={b.id} type="button" onClick={() => openBooking('', b.name)} className="rounded-full border border-white/10 px-4 py-1.5 text-xs text-white/65 transition-all duration-200 hover:border-gold/40 hover:text-gold" style={{ background: 'rgba(255,255,255,.05)' }}>{b.name}</button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* ── SERVICES LIST ── */}
        <section id="services" className="scroll-mt-24 border-y border-white/5 bg-[#FAF7F0] sec-light">
          <div className="mx-auto max-w-6xl px-4 py-20 lg:px-6">
            <div className="reveal">
              <div className="sec-label">قائمتنا الكاملة</div>
              <h2 className="text-3xl font-extrabold tracking-tight lg:text-4xl">قائمة الخدمات والأسعار</h2>
              <p className="mt-2 text-white/50 leading-relaxed">اختر الخدمة المناسبة—وسعرها متوفر عند الحجز أو في الصالون.</p>
            </div>
            {services.length === 0 ? (
              <p className="mt-12 text-center text-white/40 text-sm">لا توجد خدمات حالياً</p>
            ) : (
              <div className="mt-12 overflow-hidden rounded-3xl border border-white/8 shadow-soft reveal" style={{ background: 'rgba(255,255,255,.7)' }}>
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[520px] text-right text-sm">
                    <thead style={{ background: 'rgba(201,168,76,.06)' }}>
                      <tr className="text-white/65">
                        <th className="px-6 py-5 font-extrabold text-base">الخدمة</th>
                        <th className="px-6 py-5 font-extrabold text-base">السعر</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {services.map(svc => (
                        <tr key={svc.id} className="transition-colors duration-150 hover:bg-white/3">
                          <td className="px-6 py-4 font-bold">{svc.name_ar}</td>
                          <td className="px-6 py-4 font-extrabold text-gold">{svc.price} ر.س</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
            <div className="mt-8 flex justify-center reveal">
              <button type="button" onClick={() => openBooking()} className="btn-gold w-full max-w-xs rounded-xl px-6 py-3 text-center text-sm font-extrabold text-black focus:outline-none focus:ring-2 focus:ring-gold/60 focus:ring-offset-2 focus:ring-offset-black">احجز الآن</button>
            </div>
          </div>
        </section>

        {/* ── WHY US ── */}
        <section id="why-us" className="scroll-mt-24 bg-ink">
          <div className="mx-auto max-w-6xl px-4 py-20 lg:px-6">
            <div className="reveal mb-12">
              <div className="sec-label">ما يجعلنا مختلفين</div>
              <h2 className="text-3xl font-extrabold tracking-tight lg:text-4xl">ماذا يميزنا</h2>
              <p className="mt-2 text-white/50 leading-relaxed">نحن لسنا مجرد صالون حلاقة — نحن تجربة كاملة.</p>
            </div>
            <div className="grid gap-10 lg:grid-cols-12 lg:items-stretch">
              <div className="lg:col-span-5 reveal">
                <div className="overflow-hidden rounded-3xl border border-gold/15 shadow-glow h-full" style={{ minHeight: '420px' }}>
                  <img src={salon.meta?.feature_image || '/barber.jpg'} alt={`صالون ${salon.name}`} className="w-full h-full object-cover transition-transform duration-700 hover:scale-[1.03]" loading="lazy" />
                </div>
              </div>
              <div className="lg:col-span-7 grid gap-4 sm:grid-cols-2 reveal reveal-d1">
                {[
                  { title: 'دقة في التفاصيل', desc: 'كل قصة تُنفَّذ بدقة متناهية تناسب ملامح وجهك وأسلوبك.', icon: <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 3.104v5.714a2.25 2.25 0 0 1-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 0 1 4.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0 1 12 15a9.065 9.065 0 0 1-6.23-.693L5 14.5m14.8.8 1.402 1.402c1.232 1.232.65 3.318-1.067 3.611A48.309 48.309 0 0 1 12 21c-2.773 0-5.491-.235-8.135-.687-1.718-.293-2.3-2.379-1.067-3.61L5 14.5"/> },
                  { title: 'أدوات احترافية', desc: 'نستخدم أفضل الأدوات المعقمة لضمان نظافة وجودة عالية في كل جلسة.', icon: <path strokeLinecap="round" strokeLinejoin="round" d="M11.42 15.17 17.25 21A2.652 2.652 0 0 0 21 17.25l-5.877-5.877M11.42 15.17l2.496-3.03c.317-.384.74-.626 1.208-.766M11.42 15.17l-4.655 5.653a2.548 2.548 0 1 1-3.586-3.586l6.837-5.63m5.108-.233c.55-.164 1.163-.188 1.743-.14a4.5 4.5 0 0 0 4.486-6.336l-3.276 3.277a3.004 3.004 0 0 1-2.25-2.25l3.276-3.276a4.5 4.5 0 0 0-6.336 4.486c.091 1.076-.071 2.264-.904 2.95l-.102.085m-1.745 1.437L5.909 7.5H4.5L2.25 3.75l1.5-1.5L7.5 4.5v1.409l4.26 4.26m-1.745 1.437 1.745-1.437m6.615 8.206L15.75 15.75M4.867 19.125h.008v.008h-.008v-.008Z"/> },
                  { title: 'حجز سريع ومنظم', desc: 'نظام حجز سهل وسريع يُنظّم وقتك بدون انتظار أو ازدحام.', icon: <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5"/> },
                  { title: 'تجربة فاخرة للرجال', desc: 'أجواء راقية وهادئة صُمِّمت خصيصًا لتجعل زيارتك تجربة لا تُنسى.', icon: <path strokeLinecap="round" strokeLinejoin="round" d="M15.182 15.182a4.5 4.5 0 0 1-6.364 0M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0ZM9.75 9.75c0 .414-.168.75-.375.75S9 10.164 9 9.75 9.168 9 9.375 9s.375.336.375.75Zm-.375 0h.008v.015h-.008V9.75Zm5.625 0c0 .414-.168.75-.375.75s-.375-.336-.375-.75.168-.75.375-.75.375.336.375.75Zm-.375 0h.008v.015h-.008V9.75Z"/> },
                ].map((f, i) => (
                  <div key={i} className="glass-card rounded-3xl p-6">
                    <div className="mb-3 text-gold"><svg className="h-7 w-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">{f.icon}</svg></div>
                    <h3 className="text-lg font-extrabold mb-2">{f.title}</h3>
                    <p className="text-sm text-white/55 leading-relaxed">{f.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ── ABOUT ── */}
        <section id="about" className="scroll-mt-24 border-y border-white/5 bg-[#FAF7F0] sec-light">
          <div className="mx-auto max-w-6xl px-4 py-20 lg:px-6">
            <div className="grid gap-12 lg:grid-cols-12 lg:items-center">
              <div className="lg:col-span-6 reveal">
                <div className="sec-label">من نحن</div>
                <h2 className="text-3xl font-extrabold tracking-tight lg:text-4xl">عن {salon.name}</h2>
                <p className="mt-5 text-white/55 leading-loose">يقع صالون {salon.name} في مدينة {city}. نقدم تجربة حلاقة رجالية فاخرة مع اهتمام بالتفاصيل وجودة الخدمة. نؤمن أن الحلاقة ليست مجرد خدمة—بل تجربة كاملة تُكمل حضورك.</p>
                <div className="mt-8 grid gap-4 sm:grid-cols-3">
                  {[{v:'+10',l:'سنوات خبرة'},{v:'4.9',l:'تقييم من 5'},{v:'+500',l:'عميل راضٍ'}].map(s => (
                    <div key={s.l} className="glass-card rounded-3xl p-5 text-center">
                      <div className="text-3xl font-extrabold text-gold">{s.v}</div>
                      <div className="mt-1 text-xs text-white/45">{s.l}</div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="lg:col-span-6 reveal reveal-d2">
                <div className="rounded-3xl border border-gold/15 p-8 shadow-glow" style={{ background: 'rgba(255,255,255,.85)', backdropFilter: 'blur(14px)' }}>
                  <div className="flex items-start justify-between gap-6">
                    <div>
                      <div className="sec-label">ماذا يميزنا؟</div>
                      <div className="text-2xl font-extrabold mt-1">فخامة هادئة…<br /><span className="text-gold">ونتيجة واضحة</span></div>
                    </div>
                    <span className="flex-shrink-0 rounded-full border border-gold/25 px-3 py-1 text-xs font-bold text-gold bg-gold/8">Premium</span>
                  </div>
                  <div className="mt-7 grid gap-3 sm:grid-cols-2">
                    {['أدوات معقمة ومعايير نظافة عالية','تحديد لحية احترافي بتفاصيل دقيقة','حلاقة فاخرة تناسب مناسبتك','حجز سريع ووقت منظم بلا انتظار'].map(t => (
                      <div key={t} className="glass-card rounded-2xl px-4 py-4 text-sm text-white/65">{t}</div>
                    ))}
                  </div>
                  <div className="mt-8 flex flex-wrap gap-3">
                    <button type="button" onClick={() => openBooking()} className="btn-gold rounded-xl px-6 py-3 text-sm font-extrabold text-black">احجز الآن</button>
                    <a href="#location" className="rounded-xl border border-white/10 px-6 py-3 text-sm font-bold text-white/70 transition-all duration-200 hover:border-gold/30 hover:text-white" style={{ background: 'rgba(0,0,0,.04)' }}>اطلع على موقعنا</a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── REVIEWS ── */}
        <section id="reviews" className="scroll-mt-24 bg-ink">
          <div className="mx-auto max-w-6xl px-4 py-20 lg:px-6">
            <div className="reveal">
              <div className="sec-label">آراء العملاء</div>
              <h2 className="text-3xl font-extrabold tracking-tight lg:text-4xl">التقييمات</h2>
              <p className="mt-2 text-white/50 leading-relaxed">آراء عملائنا تعكس مستوى الخدمة—ومدى اهتمامنا بالتفاصيل.</p>
            </div>
            <div className="mt-12 grid gap-5 md:grid-cols-3">
              {['"حلاق على مستوى عالي، نظافة واحترام وخدمة ممتازة."','"من أفضل حلاقين الرياض وتعامل راقي."','"محل جميل ونظيف وخدمة احترافية."'].map((q, i) => (
                <figure key={i} className={`glass-card reveal reveal-d${i+1} rounded-3xl p-7`}>
                  <div className="text-xl text-gold mb-4" aria-label="★★★★★">
                    {'★★★★★'.split('').map((s, j) => <span key={j} className="star-pop">{s}</span>)}
                  </div>
                  <blockquote className="text-sm text-white/65 leading-relaxed">{q}</blockquote>
                </figure>
              ))}
            </div>
          </div>
        </section>

        {/* ── LOCATION ── */}
        {mapUrl && (
        <section id="location" className="scroll-mt-24 border-y border-white/5 bg-[#FAF7F0] sec-light">
          <div className="mx-auto max-w-6xl px-4 py-20 lg:px-6">
            <div className="flex flex-wrap items-end justify-between gap-6 reveal">
              <div>
                <div className="sec-label">زرنا</div>
                <h2 className="text-3xl font-extrabold tracking-tight lg:text-4xl">الموقع</h2>
                <p className="mt-2 text-white/50 leading-relaxed">زرنا في {city}—واستمتع بتجربة حلاقة فاخرة بالحجز المسبق.</p>
              </div>
            </div>
            <div className="mt-4 reveal">
              <a href={salon.meta?.map_place_url} target="_blank" rel="noopener noreferrer"
                className="btn-gold inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold text-black">
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/><circle cx="12" cy="9" r="2.5"/></svg>
                افتح في خرائط Google
              </a>
            </div>
            {salon.meta?.map_embed_url && (
            <div className="mt-12 overflow-hidden rounded-3xl border border-white/8 shadow-soft reveal">
              <iframe title={`موقع ${salon.name}`} className="h-[420px] w-full" loading="lazy" referrerPolicy="no-referrer-when-downgrade"
                src={salon.meta.map_embed_url} />
            </div>
            )}
          </div>
        </section>
        )}
      </main>

      {/* ── FOOTER ── */}
      <footer className="border-t border-white/5" style={{ background: 'rgba(0,0,0,.6)' }}>
        <div className="mx-auto max-w-6xl px-4 py-12 text-center lg:px-6">
          <div className="flex items-center justify-center gap-3 mb-4">
            <span className="h-px w-12" style={{ background: 'linear-gradient(to left,rgba(201,168,76,.4),transparent)' }} />
            <span className="text-gold/50 text-xs">✦</span>
            <span className="h-px w-12" style={{ background: 'linear-gradient(to right,rgba(201,168,76,.4),transparent)' }} />
          </div>
          <div className="font-extrabold text-lg text-white/85">{salon.name}</div>
          <div className="mt-1 text-sm text-white/40">حجز مسبق فقط • {workingHours} • جميع أيام الأسبوع</div>
          <div className="mt-5 text-xs text-white/25">© {new Date().getFullYear()} جميع الحقوق محفوظة</div>
        </div>
      </footer>

      <div className="py-8 text-center">
        <a href="/dashboard/login" className="btn-gold inline-block rounded-xl px-6 py-3 text-sm font-bold text-black">بوابة الإدارة</a>
      </div>

      {/* ── BOOKING MODAL ── */}
      {bookingOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,.78)', backdropFilter: 'blur(6px)' }} onClick={e => { if (e.target === e.currentTarget) setBookingOpen(false) }} aria-hidden="false">
          <div role="dialog" aria-modal={true} aria-labelledby="bookingTitle" className="relative w-full max-w-lg overflow-hidden rounded-3xl border border-gold/20 shadow-glow-lg" style={{ background: '#0b0b0b' }}>
            <div className="border-b border-white/8 px-6 py-5" style={{ background: 'rgba(255,255,255,.03)' }}>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 id="bookingTitle" className="text-xl font-extrabold">حجز موعد</h3>
                  <p className="mt-1 text-sm text-white/50">عبّئ البيانات واختر الخدمة والوقت المناسب.</p>
                </div>
                <button type="button" onClick={() => setBookingOpen(false)} className="rounded-xl border border-white/10 p-2 text-white/60 transition-all duration-200 hover:border-gold/30 hover:text-white focus:outline-none" style={{ background: 'rgba(255,255,255,.05)' }} aria-label="إغلاق">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
                </button>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="max-h-[80vh] overflow-y-auto px-6 py-6" noValidate>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="grid gap-2">
                  <span className="text-sm font-bold text-white/75">الاسم</span>
                  <input required name="name" type="text" autoComplete="name" value={name} onChange={e => setName(e.target.value)} className="field-input h-11 rounded-xl border border-white/10 px-4 text-sm text-white placeholder:text-white/25 transition-all duration-200" style={{ background: 'rgba(0,0,0,.4)' }} placeholder="الاسم الكريم" />
                </label>
                <label className="grid gap-2">
                  <span className="text-sm font-bold text-white/75">رقم الجوال</span>
                  <input required name="phone" type="tel" inputMode="numeric" autoComplete="tel" value={phone} onChange={handlePhone} onKeyDown={e => { if ((e.key==='Backspace'||e.key==='Delete') && (e.currentTarget.selectionStart??0)<=2 && e.currentTarget.selectionStart===e.currentTarget.selectionEnd) e.preventDefault() }} onFocus={e => { setTimeout(()=>{ if((e.target.selectionStart??0)<2) e.target.setSelectionRange(2,2) },0) }} onClick={e => { if((e.currentTarget.selectionStart??0)<2) e.currentTarget.setSelectionRange(2,2) }} className="field-input h-11 rounded-xl border border-white/10 px-4 text-sm text-white placeholder:text-white/25 transition-all duration-200" style={{ background: 'rgba(0,0,0,.4)' }} placeholder="05xxxxxxxx" maxLength={10} />
                </label>
              </div>

              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <label className="grid gap-2">
                  <span className="text-sm font-bold text-white/75">اختيار الحلاق</span>
                  <select required name="barber" value={barber} onChange={e => setBarber(e.target.value)} className="field-input h-11 rounded-xl border border-white/10 px-4 text-sm text-white transition-all duration-200" style={{ background: 'rgba(0,0,0,.4)' }}>
                    <option value="" disabled>اختر الحلاق</option>
                    {barbers.map(b => <option key={b.id} value={b.name}>{b.name}</option>)}
                  </select>
                </label>
                <label className="grid gap-2">
                  <span className="text-sm font-bold text-white/75">اختيار التاريخ</span>
                  <input required name="date" type="date" value={date} min={today} onChange={e => setDate(e.target.value)} className="field-input h-11 rounded-xl border border-white/10 px-4 text-sm text-white transition-all duration-200" style={{ background: 'rgba(0,0,0,.4)' }} />
                </label>
              </div>

              <fieldset className="mt-4 rounded-2xl border border-white/8 p-4" style={{ background: 'rgba(255,255,255,.03)' }}>
                <legend className="px-2 text-sm font-extrabold text-white/75">اختيار الخدمة (يمكن اختيار أكثر من خدمة)</legend>
                <div className="mt-3 max-h-56 overflow-auto rounded-2xl border border-white/8 p-3" style={{ background: 'rgba(0,0,0,.2)' }}>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {services.map(svc => (
                      <label key={svc.id} className="flex cursor-pointer items-center justify-between gap-3 rounded-xl border border-white/8 px-3 py-2.5 text-sm text-white/70 transition-all duration-200 hover:border-gold/25 hover:bg-gold/5" style={{ background: 'rgba(0,0,0,.1)' }}>
                        <span>{svc.name_ar}</span>
                        <input className="h-4 w-4 accent-[#C9A84C]" type="checkbox" name="service" value={svc.name_ar} checked={checkedServices.has(svc.name_ar)} onChange={() => toggleService(svc.name_ar)} />
                      </label>
                    ))}
                  </div>
                </div>
              </fieldset>

              <div className="mt-4 grid gap-2">
                <label className="grid gap-2">
                  <span className="text-sm font-bold text-white/75">اختيار الوقت</span>
                  <select required name="time" value={time} onChange={e => setTime(e.target.value)} className="field-input h-11 rounded-xl border border-white/10 px-4 text-sm text-white transition-all duration-200" style={{ background: 'rgba(0,0,0,.4)' }}>
                    <option value="" disabled>اختر الوقت</option>
                    {timeOpts.map(o => <option key={o.value} value={o.value} disabled={o.booked}>{o.booked ? `${o.label} (محجوز)` : o.label}</option>)}
                  </select>
                </label>
                <p className="text-xs text-white/30">الأوقات المتاحة كل 30 دقيقة حسب جدول الحلاق.</p>
              </div>

              {formMsg && (
                <div className="mt-4 rounded-2xl border px-4 py-3 text-sm text-white/80" style={{ borderColor: formMsg.error ? 'rgba(239,68,68,.35)' : 'rgba(201,168,76,.28)', background: formMsg.error ? 'rgba(239,68,68,.08)' : 'rgba(201,168,76,.08)' }}>
                  {formMsg.text}
                </div>
              )}

              <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <button type="submit" disabled={submitting} className="btn-gold w-full rounded-xl px-6 py-3 text-sm font-extrabold text-black focus:outline-none sm:w-auto disabled:opacity-60">
                  {submitting ? '...' : 'تأكيد الحجز'}
                </button>
                <button type="button" onClick={handleWhatsApp} className="w-full rounded-xl border border-gold/30 px-6 py-3 text-sm font-extrabold text-white/75 transition-all duration-200 hover:border-gold/55 hover:text-white sm:w-auto" style={{ background: 'rgba(0,0,0,.35)' }}>واتساب</button>
                <button type="button" onClick={() => setBookingOpen(false)} className="w-full rounded-xl border border-white/10 px-6 py-3 text-sm font-bold text-white/60 transition-all duration-200 hover:border-white/20 hover:text-white/85 sm:w-auto" style={{ background: 'rgba(255,255,255,.04)' }}>إلغاء</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
