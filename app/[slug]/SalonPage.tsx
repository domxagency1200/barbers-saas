'use client'

import React, { useState, useEffect, useRef } from 'react'
import SalonLogo from '@/app/components/SalonLogo'
import { THEMES, ThemeKey } from '@/app/lib/themes'

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
  salon: { id: string; name: string; whatsapp_number: string | null; city: string | null; working_hours?: string | null; meta?: { hero_title?: string; tagline?: string; neighborhood?: string; hero_image?: string; feature_image?: string; map_url?: string; map_embed_url?: string; map_place_url?: string; card_theme?: string; custom_color?: string; features?: { title: string; description: string }[]; features_title?: string; features_subtitle?: string; about_title?: string; about_description?: string; years_experience?: number; rating?: number; happy_clients?: number; reviews_title?: string; reviews_subtitle?: string; reviews?: { name: string; text: string }[]; offers?:{ id: string; title: string; badge?: string; description?: string; price_current?: string; price_old?: string; is_active: boolean; service_ids?: string[]; duration_min?: number }[]; page_theme?: string; page_primary_color?: string; page_bg_color?: string; booking_button_hero_text?: string; booking_button_text?: string; categories?: { id: string; name: string }[]; service_categories?: Record<string, string>; logo_url?: string; logo_letter?: string; booking_hero_title?: string; booking_hero_description?: string; booking_card_title?: string; booking_card_subtitle?: string; booking_step1?: string; booking_step2?: string; booking_step3?: string; [key: string]: any } | null }
  barbers: Barber[]
  services: Service[]
  slug: string
}

function pad2(n: number) { return String(n).padStart(2, '0') }
function formatArabicTimeRange(range: string) {
  return range.split('–').map(t => {
    const [hStr, mStr = '00'] = t.trim().split(':')
    const h = parseInt(hStr, 10)
    const h12 = h % 12 || 12
    const suffix = h < 12 ? 'ص' : 'م'
    return `${pad2(h12)}:${mStr} ${suffix}`
  }).join(' – ')
}
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
  :root {
    --gold: var(--primary); --gold-light: var(--primary); --gold-dark: var(--primary);
    --hero-image: url('/hero.jpg');
    /* ── Base color tokens ── */
    --color-background: var(--bg);
    --color-surface:    var(--card-bg);
    --color-text:       var(--text-primary);
    --color-border:     var(--border);
    --color-primary:    var(--primary);
    /* ── Surface tokens ── */
    --color-bg-input:   var(--input-bg, rgba(0,0,0,0.30));
    --color-bg-tinted:  var(--tinted-bg, rgba(255,255,255,0.03));
    --color-bg-dim:     rgba(0,0,0,0.20);
    /* ── Border tokens ── */
    --color-border-subtle:  var(--card-border);
    --color-border-default: var(--card-border);
    /* ── State tokens ── */
    --color-error-border: rgba(239,68,68,0.35);
    --color-error-bg:     rgba(239,68,68,0.08);
  }
  /* ── Typography scale ── */
  :root {
    --font-size-h1:    2rem;
    --font-size-h2:    1.5rem;
    --font-size-body:  1rem;
    --font-size-small: 0.75rem;
    --font-weight-h1:  800;
    --font-weight-h2:  700;
    --font-weight-body: 400;
    --line-height-h1:  1.2;
    --line-height-h2:  1.3;
    --line-height-body: 1.6;
    /* ── Spacing scale (4/8pt) ── */
    --space-1:  4px;
    --space-2:  8px;
    --space-3:  12px;
    --space-4:  16px;
    --space-5:  24px;
    --space-6:  32px;
    --space-7:  48px;
    --space-8:  64px;
  }
  h1 { font-size: var(--font-size-h1); font-weight: var(--font-weight-h1); line-height: var(--line-height-h1); }
  h2 { font-size: var(--font-size-h2); font-weight: var(--font-weight-h2); line-height: var(--line-height-h2); }
  body { font-size: var(--font-size-body); font-weight: var(--font-weight-body); line-height: var(--line-height-body); }
  small { font-size: var(--font-size-small); line-height: var(--line-height-body); }
  p { font-size: var(--font-size-body); line-height: var(--line-height-body); color: var(--color-text); }
  html { scroll-behavior: smooth; }
  @media (prefers-reduced-motion: reduce) {
    html { scroll-behavior: auto; }
    *, *::before, *::after { animation-duration: 0.001ms !important; animation-iteration-count: 1 !important; transition-duration: 0.001ms !important; }
  }
  .btn-gold { background: linear-gradient(135deg, #f5d060 0%, #c8960c 40%, #e6b422 70%, #a87200 100%); color: #1a0f00; padding: var(--space-2) var(--space-5); border-radius: var(--space-3); box-shadow: 0 2px 0 #7a4f00, 0 4px 16px rgba(200,150,12,.55), 0 8px 32px rgba(0,0,0,.4); transition: transform .22s cubic-bezier(.4,0,.2,1), box-shadow .22s cubic-bezier(.4,0,.2,1), filter .22s ease; position: relative; overflow: hidden; font-weight: 800; }
  .btn-gold::before { content:''; position:absolute; top:0; left:-60%; width:40%; height:100%; background:linear-gradient(105deg,transparent 20%,rgba(255,255,255,.55) 50%,transparent 80%); transform:skewX(-15deg); transition:left .45s ease; pointer-events:none; }
  .btn-gold::after { content:''; position:absolute; inset:0; background:linear-gradient(180deg,rgba(255,255,255,.28) 0%,transparent 55%); pointer-events:none; }
  .btn-gold:hover { transform:translateY(-2px); box-shadow:0 2px 0 #7a4f00, 0 0 0 1px rgba(200,150,12,.7), 0 0 28px rgba(200,150,12,.45), 0 12px 40px rgba(0,0,0,.5); filter:brightness(1.08); }
  .btn-gold:hover::before { left:130%; }
  .btn-gold:active { transform:translateY(1px) scale(.98); box-shadow:0 1px 0 #7a4f00,0 2px 8px rgba(200,150,12,.4); filter:brightness(.96); }
  .btn-gold:focus-visible { outline: 2px solid #e6b422; outline-offset: 3px; }
  .card,.glass-card { background:var(--card-bg); backdrop-filter:blur(12px); -webkit-backdrop-filter:blur(12px); border:1px solid var(--card-border); box-shadow:var(--card-shadow); position:relative; overflow:hidden; }
  .card { transition:box-shadow .35s cubic-bezier(.4,0,.2,1),border-color .35s ease,background .35s ease; }
  .glass-card { transition:transform .35s cubic-bezier(.4,0,.2,1),box-shadow .35s cubic-bezier(.4,0,.2,1),border-color .35s ease,background .35s ease; }
  .glass-card::before { content:''; position:absolute; top:0; left:0; right:0; height:2px; background:linear-gradient(90deg,transparent,var(--gold),transparent); opacity:0; transition:opacity .35s ease; }
  .glass-card:hover { background:var(--card-hover-bg); border-color:rgba(var(--primary-rgb),.28); transform:translateY(-4px); box-shadow:var(--card-shadow),0 0 0 1px rgba(var(--primary-rgb),.18),0 24px 64px rgba(0,0,0,.22),0 6px 20px rgba(var(--primary-rgb),.06); }
  .glass-card:hover::before { opacity:1; }
  .reveal { opacity:0; transform:translateY(24px); transition:opacity .9s cubic-bezier(.4,0,.2,1),transform .9s cubic-bezier(.4,0,.2,1); }
  .reveal.visible { opacity:1; transform:translateY(0); }
  .reveal-d1{transition-delay:.1s}.reveal-d2{transition-delay:.2s}.reveal-d3{transition-delay:.3s}.reveal-d4{transition-delay:.45s}
  .sec-label { display:inline-flex; align-items:center; gap:8px; font-size:.7rem; font-weight:700; letter-spacing:.14em; color:var(--gold); text-transform:uppercase; margin-bottom:.6rem; }
  .sec-label::before { content:''; display:inline-block; width:22px; height:1px; background:var(--gold); }
  #siteHeader { transition:background .4s ease,border-color .4s ease,box-shadow .4s ease,backdrop-filter .4s ease; }
  #siteHeader.scrolled { background:var(--scrolled-nav-bg)!important; border-color:rgba(var(--primary-rgb),.2)!important; box-shadow:0 4px 32px rgba(0,0,0,.25); backdrop-filter:blur(24px); }
  .headline-gold { background:linear-gradient(120deg,var(--headline-start) 0%,var(--primary) 45%,var(--primary) 100%); -webkit-background-clip:text; -webkit-text-fill-color:transparent; background-clip:text; }
  @keyframes floatY {
    0%   { transform: translateY(0px); }
    50%  { transform: translateY(-5px); }
    100% { transform: translateY(0px); }
  }
  @keyframes statsGlow {
    0%,100% { opacity: 0; }
    50%     { opacity: 1; }
  }
  .float-anim {
    animation: floatY 5s cubic-bezier(0.37,0,0.63,1) infinite;
    position: relative;
  }
  .float-anim::after {
    content: '';
    position: absolute;
    inset: -2px;
    border-radius: 22px;
    box-shadow: 0 0 28px rgba(var(--primary-rgb),0.18), 0 0 60px rgba(var(--primary-rgb),0.07);
    opacity: 0;
    animation: statsGlow 5s cubic-bezier(0.37,0,0.63,1) infinite;
    pointer-events: none;
    z-index: -1;
  }
  @keyframes scrollBounce { 0%,100%{transform:translateY(0) translateX(-50%);opacity:.4} 50%{transform:translateY(6px) translateX(-50%);opacity:.9} }
  .scroll-dot { animation:scrollBounce 2s ease-in-out infinite; }
  .star-pop{display:inline-block;animation:starIn .4s ease both}
  .star-pop:nth-child(1){animation-delay:.05s}.star-pop:nth-child(2){animation-delay:.12s}.star-pop:nth-child(3){animation-delay:.19s}.star-pop:nth-child(4){animation-delay:.26s}.star-pop:nth-child(5){animation-delay:.33s}
  @keyframes starIn{from{opacity:0;transform:scale(.4) rotate(-20deg)}to{opacity:1;transform:scale(1) rotate(0deg)}}
  @keyframes modalSlideIn { from { opacity:0; transform:scale(0.96) translateY(14px); } to { opacity:1; transform:scale(1) translateY(0); } }
  .booking-dialog-inner { animation: modalSlideIn 0.3s cubic-bezier(0.16,1,0.3,1) both; }
  .field-input:focus { border-color:rgba(var(--primary-rgb),.65)!important; box-shadow:0 0 0 3px rgba(var(--primary-rgb),.14)!important; outline:none; }
  #heroBg { will-change:transform; }
  @keyframes heroFadeUp { from { opacity:0; transform:translateY(36px) scale(0.98); } to { opacity:1; transform:translateY(0) scale(1); } }
  #home h1 { animation: heroFadeUp 1.1s cubic-bezier(0.16,1,0.3,1) 0.1s both; }
  #home h1 span { display: block; }
  @keyframes statsBoardIn { from { opacity:0; transform:translateY(20px); } to { opacity:1; transform:translateY(0); } }
  #home .float-anim { animation: floatY 6s cubic-bezier(0.37,0,0.63,1) infinite, statsBoardIn 0.9s cubic-bezier(0.16,1,0.3,1) 0.7s both; }
  /* ── Headings + text adapt to theme ── */
  h1, h2, h3, h4, h5, h6 { color: var(--text-primary) !important; }
  p { color: var(--text-secondary); }
  .sec-label { color: var(--primary) !important; }
  .sec-label::before { background: var(--primary) !important; }
  /* ── Light theme overrides ── */
  [data-theme="light"] .text-white { color: #1a1a1a !important; }
  [data-theme="light"] .text-white\\/90,[data-theme="light"] .text-white\\/80 { color: rgba(20,20,20,0.85) !important; }
  [data-theme="light"] .text-white\\/70 { color: rgba(20,20,20,0.70) !important; }
  [data-theme="light"] .text-white\\/60,[data-theme="light"] .text-white\\/55,[data-theme="light"] .text-white\\/50 { color: rgba(20,20,20,0.55) !important; }
  [data-theme="light"] .text-white\\/45,[data-theme="light"] .text-white\\/40,[data-theme="light"] .text-white\\/35,[data-theme="light"] .text-white\\/30 { color: rgba(20,20,20,0.38) !important; }
  [data-theme="light"] .text-white\\/25,[data-theme="light"] .text-white\\/20 { color: rgba(20,20,20,0.28) !important; }
  [data-theme="light"] .border-white\\/8,[data-theme="light"] .border-white\\/10 { border-color: rgba(0,0,0,0.10) !important; }
  [data-theme="light"] .border-white\\/15,[data-theme="light"] .border-white\\/20 { border-color: rgba(0,0,0,0.15) !important; }
  [data-theme="light"] .hover\\:bg-white\\/5:hover { background-color: rgba(0,0,0,0.05) !important; }
  [data-theme="light"] .hover\\:bg-white\\/10:hover { background-color: rgba(0,0,0,0.08) !important; }

  .text-gold{color:var(--primary)}
  .border-gold\\/10{border-color:rgba(var(--primary-rgb),.10)}.border-gold\\/15{border-color:rgba(var(--primary-rgb),.15)}.border-gold\\/20{border-color:rgba(var(--primary-rgb),.20)}.border-gold\\/22{border-color:rgba(var(--primary-rgb),.22)}.border-gold\\/25{border-color:rgba(var(--primary-rgb),.25)}.border-gold\\/28{border-color:rgba(var(--primary-rgb),.28)}.border-gold\\/30{border-color:rgba(var(--primary-rgb),.30)}.border-gold\\/40{border-color:rgba(var(--primary-rgb),.40)}.border-gold\\/55{border-color:rgba(var(--primary-rgb),.55)}
  .bg-gold\\/5{background-color:rgba(var(--primary-rgb),.05)}.bg-gold\\/6{background-color:rgba(var(--primary-rgb),.06)}.bg-gold\\/7{background-color:rgba(var(--primary-rgb),.07)}.bg-gold\\/8{background-color:rgba(var(--primary-rgb),.08)}.bg-gold\\/10{background-color:rgba(var(--primary-rgb),.10)}.bg-gold\\/12{background-color:rgba(var(--primary-rgb),.12)}.bg-gold\\/25{background-color:rgba(var(--primary-rgb),.25)}
  .hover\\:text-gold:hover{color:var(--primary)}.hover\\:border-gold\\/25:hover{border-color:rgba(var(--primary-rgb),.25)}.hover\\:border-gold\\/30:hover{border-color:rgba(var(--primary-rgb),.30)}.hover\\:border-gold\\/40:hover{border-color:rgba(var(--primary-rgb),.40)}.hover\\:border-gold\\/55:hover{border-color:rgba(var(--primary-rgb),.55)}.hover\\:bg-gold\\/5:hover{background-color:rgba(var(--primary-rgb),.05)}
  .hover\\:bg-white\\/3:hover{background-color:rgba(255,255,255,.03)}.hover\\:bg-white\\/5:hover{background-color:rgba(255,255,255,.05)}.hover\\:bg-white\\/10:hover{background-color:rgba(255,255,255,.10)}
  .focus\\:ring-gold\\/60:focus{box-shadow:0 0 0 3px rgba(var(--primary-rgb),.60);outline:none}
  .shadow-glow{box-shadow:0 0 0 1px rgba(var(--primary-rgb),.28),0 18px 50px rgba(0,0,0,.55)}.shadow-glow-lg{box-shadow:0 0 0 1px rgba(var(--primary-rgb),.4),0 0 40px rgba(var(--primary-rgb),.2),0 24px 60px rgba(0,0,0,.6)}.shadow-soft{box-shadow:0 14px 45px rgba(0,0,0,.55)}
  .accent-\\[\\#C9A84C\\]{accent-color:var(--primary)}
  .t-primary{color:var(--text-primary)}.t-secondary{color:var(--text-secondary)}.t-muted{color:var(--text-muted)}
  .section-dark{background:var(--bg);position:relative}.section-light{background:var(--bg-alt);position:relative}
  .section-dark::before,.section-light::before{content:'';position:absolute;top:0;left:10%;right:10%;height:1px;background:linear-gradient(90deg,transparent,rgba(var(--primary-rgb),.07),transparent);pointer-events:none;z-index:0}
  .bg-ink{background-color:#0D0F14}
  .bg-input{background:var(--color-bg-input)}.bg-tinted{background:var(--color-bg-tinted)}.bg-dim{background:var(--color-bg-dim)}
  .border-subtle{border-color:var(--color-border-subtle)}.border-default{border-color:var(--color-border-default)}
  .nav-link{position:relative;padding-bottom:3px;}
  .nav-link::after{content:'';position:absolute;bottom:0;right:0;width:0;height:1.5px;background:var(--primary);border-radius:2px;transition:width .28s cubic-bezier(.4,0,.2,1);}
  .nav-link:hover::after{width:100%;}
  #siteHeader .header-glow{position:absolute;bottom:-1px;left:15%;right:15%;height:1px;background:linear-gradient(90deg,transparent,rgba(var(--primary-rgb),.18),transparent);pointer-events:none;}
`

export default function SalonPage({ salon, barbers, services, slug }: Props) {
  const meta = salon.meta ?? {}
  const activeTheme = (() => {
    if (meta.page_theme === 'custom') {
      const base = THEMES.gold
      return {
        ...base,
        primary: (meta as any).page_primary_color ?? base.primary,
        bg:      (meta as any).page_bg_color      ?? base.bg,
      }
    }
    return THEMES[(meta.page_theme as ThemeKey) ?? 'gold'] ?? THEMES.gold
  })()

  const btnTextColor = (() => {
    const hex = activeTheme.primary.replace('#', '')
    if (!hex.match(/^[0-9a-fA-F]{6}$/)) return '#000000'
    const r = parseInt(hex.slice(0, 2), 16)
    const g = parseInt(hex.slice(2, 4), 16)
    const b = parseInt(hex.slice(4, 6), 16)
    return (0.299 * r + 0.587 * g + 0.114 * b) / 255 > 0.55 ? '#000000' : '#ffffff'
  })()

  const isLightBg = (() => {
    const hex = activeTheme.bg.replace('#', '')
    if (!hex.match(/^[0-9a-fA-F]{6}$/)) return false
    const r = parseInt(hex.slice(0, 2), 16)
    const g = parseInt(hex.slice(2, 4), 16)
    const b = parseInt(hex.slice(4, 6), 16)
    return (0.299 * r + 0.587 * g + 0.114 * b) / 255 > 0.55
  })()


  const primaryRgb = (() => {
    const hex = activeTheme.primary.replace('#', '')
    if (!hex.match(/^[0-9a-fA-F]{6}$/)) return '201,168,76'
    return `${parseInt(hex.slice(0,2),16)},${parseInt(hex.slice(2,4),16)},${parseInt(hex.slice(4,6),16)}`
  })()

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
  const [openCategoryId, setOpenCategoryId] = useState<string | null>(null)
  const [bookingTab, setBookingTab] = useState<'cats' | 'offers'>('cats')
  const [selectedOfferId, setSelectedOfferId] = useState<string | null>(null)
  const [viewCatId, setViewCatId] = useState<string | null>(null)
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
        const selectedSvcs = services.filter(s => checkedServices.has(s.name_ar))
        const activeOffer = selectedOfferId ? (salon.meta?.offers ?? []).find((o: any) => o.id === selectedOfferId) : null
        const duration = (activeOffer as any)?.duration_min ?? (selectedSvcs.length > 0 ? Math.max(...selectedSvcs.map((s: Service) => s.duration_min)) : 30)
        const url = `/api/availability?barber_id=${barberObj.id}&date=${date}&duration=${duration}&utcOffset=180&salon_id=${salon.id}`
        const res = await fetch(url)
        const json = await res.json()
        if (res.ok) {
          const available: string[] = json.slots ?? []
          const booked: string[] = json.bookedSlots ?? []
          const now = new Date()
          const saudiNow = ((now.getUTCHours() + 3) % 24) * 60 + now.getUTCMinutes()
          const merged = [
            ...available.map(s => ({ s, booked: false })),
            ...booked.map(s => ({ s, booked: true })),
          ]
            .sort((a, b) => a.s.localeCompare(b.s))
            .filter(o => {
              if (date !== today) return true
              const [h, m] = o.s.split(':').map(Number)
              return h * 60 + m > saudiNow
            })
            .map(({ s, booked: isBooked }) => {
              const [h, m] = s.split(':').map(Number)
              return { value: s, label: toArabicTimeLabel(h, m), booked: isBooked }
            })
          if (!cancelled) setTimeOpts(merged)
        }
      } catch (err) { console.error('[availability] fetch error:', err); if (!cancelled) setTimeOpts([]) }
    }
    fill()
    return () => { cancelled = true }
  }, [barber, date, barbers, checkedServices, selectedOfferId])

  function openBooking(svc = '', brb = '') {
    setBookingOpen(true); setFormMsg(null)
    setCheckedServices(new Set(svc ? [svc] : []))
    setOpenCategoryId(null)
    if (brb) setBarber(brb)
  }

  function handlePhone(e: React.ChangeEvent<HTMLInputElement>) {
    let v = e.target.value.replace(/\D/g, '')
    if (!v.startsWith('05')) v = '05' + v.replace(/^0{0,1}5{0,1}/, '')
    if (v.length > 10) v = v.slice(0, 10)
    if (v.length < 2) v = '05'
    setPhone(v)
  }

  function toggleService(s: string) {
    setSelectedOfferId(null)
    setCheckedServices(prev => { const n = new Set(prev); n.has(s) ? n.delete(s) : n.add(s); return n })
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (checkedServices.size === 0) { setFormMsg({ text: 'يرجى اختيار خدمة واحدة على الأقل.', error: true }); return }
    if (!/^05\d{8}$/.test(phone)) { setFormMsg({ text: 'رقم الجوال يجب أن يبدأ بـ 05 ويتكون من 10 أرقام.', error: true }); return }
    const barberObj = barbers.find(b => b.name === barber)
    if (!barberObj) { setFormMsg({ text: 'يرجى اختيار الحلاق.', error: true }); return }
    const selectedServices = services.filter(s => checkedServices.has(s.name_ar))
    if (selectedServices.length === 0) { setFormMsg({ text: 'يرجى اختيار خدمة.', error: true }); return }
    if (!date || !time) { setFormMsg({ text: 'يرجى اختيار التاريخ والوقت.', error: true }); return }
    const selectedOffer = selectedOfferId ? (salon.meta?.offers ?? []).find((o: any) => o.id === selectedOfferId) : null
    const totalDuration = (selectedOffer as any)?.duration_min ?? (selectedServices.length > 0 ? Math.max(...selectedServices.map(s => s.duration_min)) : 30)
    const starts_at = new Date(`${date}T${time}:00+03:00`).toISOString()
    const ends_at = new Date(new Date(starts_at).getTime() + totalDuration * 60 * 1000).toISOString()
    setSubmitting(true)
    try {
      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ salon_id: salon.id, barber_id: barberObj.id, service_id: selectedServices[0]?.id, services: selectedServices.map(s => ({ id: s.id, name_ar: s.name_ar, price: s.price, duration_min: s.duration_min })), customer_name: name, customer_phone: phone, starts_at, ends_at }),
      })
      const json = await res.json()
      if (!res.ok) { setFormMsg({ text: json.error ?? 'حدث خطأ أثناء الحجز، يرجى المحاولة مرة أخرى.', error: true }); return }
      setName(''); setPhone('05'); setBarber(''); setDate(''); setTime(''); setCheckedServices(new Set())
      if (salon.whatsapp_number) {
        const digits = salon.whatsapp_number.replace(/\D/g, '')
        const cleanPhone = digits.startsWith('0') ? '966' + digits.slice(1) : digits
        const [hh, mm] = time.split(':').map(Number)
        const waMsg = encodeURIComponent(
          `تم الحجز بنجاح ✓\nالاسم: ${name}\nالخدمة: ${Array.from(checkedServices).join(' + ')}\nالحلاق: ${barber}\nالتاريخ: ${date}\nالوقت: ${toArabicTimeLabel(hh, mm)}`
        )
        window.location.href = `https://wa.me/${cleanPhone}?text=${waMsg}`
      } else {
        setFormMsg({ text: 'تم الحجز بنجاح! سنتواصل معك قريباً.', error: false })
      }
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
  const workingHours = formatArabicTimeRange(salon.working_hours || '08:00–22:00')
  const tagline = salon.meta?.tagline || `مستوى جديد من العناية الرجالية في ${city} — تفاصيل دقيقة، أجواء راقية، بالحجز المسبق فقط.`
  const neighborhood = salon.meta?.neighborhood || city
  const heroImage = salon.meta?.hero_image || '/hero.jpg'
  const mapUrl = salon.meta?.map_url || salon.meta?.map_embed_url || null
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
    <div lang="ar" dir="rtl" style={{ fontFamily: "'Tajawal', ui-sans-serif, system-ui, sans-serif", backgroundColor: 'var(--color-background)', color: 'var(--color-text)', minHeight: '100vh', ['--primary' as string]: activeTheme.primary, ['--bg' as string]: isLightBg ? activeTheme.bg : '#0D0F14', ['--bg-alt' as string]: isLightBg ? activeTheme.bgAlt : '#111520', ['--text' as string]: isLightBg ? '#111111' : '#F0F2F8', ['--text-primary' as string]: isLightBg ? '#111111' : '#F0F2F8', ['--text-secondary' as string]: isLightBg ? '#555555' : 'rgba(240,242,248,0.72)', ['--text-muted' as string]: isLightBg ? '#666666' : 'rgba(240,242,248,0.45)', ['--card-bg' as string]: isLightBg ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.04)', ['--card-border' as string]: isLightBg ? 'rgba(0,0,0,0.10)' : 'rgba(255,255,255,0.07)', ['--card-hover-bg' as string]: isLightBg ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.07)', ['--card-shadow' as string]: isLightBg ? '0 2px 16px rgba(0,0,0,0.08), 0 1px 4px rgba(0,0,0,0.04)' : 'inset 0 0 40px rgba(var(--primary-rgb),.06)', ['--headline-start' as string]: isLightBg ? activeTheme.primary : '#ffffff', ['--input-bg' as string]: isLightBg ? 'rgba(255,255,255,0.85)' : 'rgba(0,0,0,0.30)', ['--tinted-bg' as string]: isLightBg ? 'rgba(0,0,0,0.03)' : 'rgba(255,255,255,0.03)', ['--border' as string]: activeTheme.border, ['--btn-text' as string]: btnTextColor, ['--primary-rgb' as string]: primaryRgb, ['--scrolled-nav-bg' as string]: isLightBg ? 'rgba(255,255,255,0.97)' : 'rgba(0,0,0,0.88)' }} data-theme={isLightBg ? 'light' : 'dark'}>
      <style>{CSS}</style>

      {/* ── NAVBAR ── */}
      <header id="siteHeader" className={`fixed inset-x-0 top-0 z-50 border-b border-gold/15 backdrop-blur-xl${scrolled ? ' scrolled' : ''}`} style={{ background: isLightBg ? 'rgba(255,255,255,0.92)' : 'rgba(8,10,16,0.45)' }}>
        <div className="header-glow" aria-hidden="true" />
        <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-3.5 lg:px-10">
          <a href="#home" className="inline-flex items-center transition-opacity duration-200 hover:opacity-85" style={{ gap: 10 }}>
            <SalonLogo logo_url={salon.meta?.logo_url} logo_letter={salon.meta?.logo_letter} size="sm" />
            <div className="text-base font-black tracking-tight" style={{ color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>{salon.name}</div>
          </a>

          <button onClick={() => setMobileOpen(o => !o)} className="inline-flex items-center justify-center rounded-xl border border-gold/20 bg-white/5 p-2.5 transition-all duration-200 hover:border-gold/40 hover:bg-white/10 active:scale-95 lg:hidden" style={{ color: 'var(--text-primary)' }} aria-label="فتح القائمة" aria-expanded={mobileOpen}>
            <span className="sr-only">القائمة</span>
            {mobileOpen
              ? <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
              : <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
            }
          </button>

          <div className="hidden items-center gap-7 lg:flex">
            <a className="nav-link text-sm font-medium t-muted transition-colors duration-200 hover:text-gold" href="#home">الرئيسية</a>
            <a className="nav-link text-sm font-medium t-muted transition-colors duration-200 hover:text-gold" href="#services">الخدمات</a>
            <a className="nav-link text-sm font-medium t-muted transition-colors duration-200 hover:text-gold" href="#why-us">المعرض</a>
            <a className="nav-link text-sm font-medium t-muted transition-colors duration-200 hover:text-gold" href="#reviews">التقييمات</a>
            <a className="nav-link text-sm font-medium t-muted transition-colors duration-200 hover:text-gold" href="#location">الموقع</a>
            <button type="button" onClick={() => openBooking()} className="btn-gold rounded-xl px-5 py-2.5 text-sm font-bold focus:outline-none focus:ring-gold/60 focus:ring-offset-2 focus:ring-offset-black">احجز الآن</button>
          </div>
        </nav>

        {mobileOpen && (
          <div className="border-t border-gold/15 lg:hidden" style={{ background: isLightBg ? 'rgba(255,255,255,0.97)' : 'rgba(6,8,14,0.92)', backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)' }}>
            <div className="mx-auto grid max-w-6xl gap-0.5 px-4 py-3 pb-4">
              {['#home:الرئيسية','#services:الخدمات والأسعار','#why-us:المعرض','#reviews:التقييمات','#location:الموقع'].map(item => {
                const [href, label] = item.split(':')
                return (
                  <a key={href} className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium t-secondary transition-all duration-200 hover:bg-white/5 hover:text-gold hover:pr-5" href={href} onClick={() => setMobileOpen(false)}>
                    <span className="h-px w-3 flex-shrink-0" style={{ background: 'rgba(var(--primary-rgb),0.4)' }} aria-hidden="true" />
                    {label}
                  </a>
                )
              })}
              <button type="button" onClick={() => { openBooking(); setMobileOpen(false) }} className="btn-gold mt-3 rounded-xl px-4 py-3 text-sm font-bold">احجز الآن</button>
            </div>
          </div>
        )}
      </header>

      <main>
        {/* ── HERO ── */}
        <section id="home" className="relative isolate scroll-mt-24 overflow-hidden flex items-center" style={{ minHeight: '100vh' }} aria-label="القسم الرئيسي">
          <div className="absolute inset-0 -z-10 overflow-hidden">
            <div ref={heroBgRef} id="heroBg" className="absolute inset-[-10%]" style={{ backgroundImage: `url('${heroImage}')`, backgroundSize: 'cover', backgroundPosition: 'center center' }} />
            <div className="absolute inset-0" style={{ background: isLightBg ? 'linear-gradient(160deg, rgba(0,0,0,0.68) 0%, rgba(0,0,0,0.42) 55%, rgba(0,0,0,0.72) 100%)' : `linear-gradient(160deg, rgba(5,7,14,0.72) 0%, rgba(5,7,14,0.38) 52%, rgba(5,7,14,0.80) 100%)` }} />
          </div>

          <div className="mx-auto w-full max-w-7xl px-6 lg:px-12" style={{ paddingTop: '140px', paddingBottom: '110px' }}>
            <div className="flex flex-col items-center text-center" style={{ gap: '32px' }}>
              {/* Top label */}
              <div className="reveal inline-flex items-center gap-2 rounded-full px-4 py-1.5" style={{ background: `rgba(${primaryRgb},0.12)`, border: `1px solid rgba(${primaryRgb},0.28)`, backdropFilter: 'blur(12px)' }}>
                <span className="h-1.5 w-1.5 rounded-full" style={{ background: `rgb(${primaryRgb})`, boxShadow: `0 0 6px rgba(${primaryRgb},0.8)` }} />
                <span className="text-xs font-bold tracking-widest uppercase" style={{ color: `rgb(${primaryRgb})`, letterSpacing: '0.15em' }}>حيث تلتقي الفخامة بالاحترافية</span>
              </div>
              {/* Title */}
              <h1 className="reveal text-[3rem] font-black leading-[1.0] tracking-[-0.045em] sm:text-6xl lg:text-7xl xl:text-[5.5rem]" style={{ textShadow: '0 6px 40px rgba(0,0,0,0.85), 0 2px 8px rgba(0,0,0,0.6)', marginBottom: '0' }}>
                {salon.meta?.hero_title ? (
                  <span className="block" style={{ letterSpacing: '-0.03em', background: `linear-gradient(125deg, #ffffff 0%, #fff8ee 25%, rgb(${primaryRgb}) 55%, #fff 85%)`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text', filter: `drop-shadow(0 0 40px rgba(${primaryRgb},0.6)) drop-shadow(0 4px 16px rgba(0,0,0,0.7))` }}>{salon.meta.hero_title}</span>
                ) : (
                  <>
                    <span className="block" style={{ fontWeight: 900, background: `linear-gradient(125deg, #ffffff 0%, #fff8ee 25%, rgb(${primaryRgb}) 55%, #fff 85%)`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text', filter: `drop-shadow(0 0 40px rgba(${primaryRgb},0.6)) drop-shadow(0 4px 16px rgba(0,0,0,0.7))` }}>العناية المثالية</span>
                    <span className="block" style={{ marginTop: '6px', fontWeight: 900, background: `linear-gradient(125deg, #ffffff 0%, #fff8ee 25%, rgb(${primaryRgb}) 55%, #fff 85%)`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text', filter: `drop-shadow(0 0 40px rgba(${primaryRgb},0.6)) drop-shadow(0 4px 16px rgba(0,0,0,0.7))` }}>للحلاقة الفاخرة</span>
                  </>
                )}
              </h1>
              {/* Subtitle */}
              <p className="reveal reveal-d1 text-base sm:text-xl font-medium" style={{ color: 'rgba(255,255,255,0.82)', lineHeight: '1.9', letterSpacing: '0.02em', textShadow: '0 2px 16px rgba(0,0,0,0.8)', maxWidth: '500px' }}>{tagline}</p>
              {/* CTA */}
              <div className="reveal reveal-d2">
                <button type="button" onClick={() => openBooking()} className="btn-gold rounded-2xl px-10 py-4 text-base font-extrabold sm:px-14 sm:py-5 sm:text-lg focus:outline-none" style={{ display: 'inline-flex', alignItems: 'center', gap: '10px' }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                  {salon.meta?.booking_button_hero_text ?? 'احجز موعدك الآن'}
                </button>
              </div>
              {/* Stats bar */}
              <div className="reveal reveal-d3 float-anim flex items-stretch justify-around" style={{ marginTop: '4px', width: '100%', maxWidth: '580px', background: 'rgba(6,8,14,0.68)', backdropFilter: 'blur(28px)', WebkitBackdropFilter: 'blur(28px)', border: `1px solid rgba(${primaryRgb},0.28)`, borderTop: `1px solid rgba(255,255,255,0.10)`, borderRadius: '20px', boxShadow: `0 0 0 1px rgba(${primaryRgb},0.10), 0 0 50px rgba(${primaryRgb},0.10), 0 20px 60px rgba(0,0,0,0.65), inset 0 1px 0 rgba(255,255,255,0.06)`, overflow: 'hidden' }}>
                <span className="inline-flex flex-col items-center justify-center gap-1 px-6 py-5">
                  <span className="inline-flex items-center gap-1.5">
                    <svg className="h-4 w-4 flex-shrink-0" style={{ color: `rgb(${primaryRgb})` }} viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
                    <span className="text-2xl font-black" style={{ color: `rgb(${primaryRgb})` }}>{salon.meta?.rating ?? '4.9'}</span>
                  </span>
                  <span className="text-[11px] font-semibold tracking-wider" style={{ color: 'rgba(255,255,255,0.40)' }}>التقييم</span>
                </span>
                <span className="w-px self-stretch my-4" style={{ background: `linear-gradient(to bottom, transparent, rgba(${primaryRgb},0.30), transparent)` }} />
                <span className="inline-flex flex-col items-center justify-center gap-1 px-6 py-5">
                  <span className="inline-flex items-center gap-1.5">
                    <svg className="h-4 w-4 flex-shrink-0" style={{ color: 'rgba(255,255,255,0.5)' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                    <span className="text-2xl font-black" style={{ color: '#ffffff' }}>+{salon.meta?.happy_clients ?? '500'}</span>
                  </span>
                  <span className="text-[11px] font-semibold tracking-wider" style={{ color: 'rgba(255,255,255,0.40)' }}>عميل راضٍ</span>
                </span>
                <span className="w-px self-stretch my-4" style={{ background: `linear-gradient(to bottom, transparent, rgba(${primaryRgb},0.30), transparent)` }} />
                <span className="inline-flex flex-col items-center justify-center gap-1 px-6 py-5">
                  <span className="inline-flex items-center gap-1.5">
                    <svg className="h-4 w-4 flex-shrink-0" style={{ color: 'rgba(255,255,255,0.5)' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>
                    <span className="text-2xl font-black" style={{ color: '#ffffff' }}>+{salon.meta?.years_experience ?? '10'}</span>
                  </span>
                  <span className="text-[11px] font-semibold tracking-wider" style={{ color: 'rgba(255,255,255,0.40)' }}>سنوات خبرة</span>
                </span>
              </div>
            </div>

          </div>

          <div className="scroll-dot absolute bottom-8 left-1/2 flex flex-col items-center gap-2 pointer-events-none" style={{ transform: 'translateX(-50%)' }}>
            <div className="text-[10px] tracking-[0.2em] uppercase font-semibold" style={{ color: `rgba(${primaryRgb},0.7)` }}>اكتشف</div>
            <div className="h-8 w-px" style={{ background: `linear-gradient(to bottom,rgba(${primaryRgb},0.6),transparent)` }} />
          </div>
        </section>

        {/* ── INFO BAR ── */}
        <div className="section-light">
          <div className="mx-auto max-w-6xl px-4 lg:px-6">
            <div className="card grid grid-cols-3 rounded-2xl overflow-hidden" style={{ borderTop: `2px solid rgba(${primaryRgb},.55)`, borderRight: isLightBg ? '1px solid rgba(0,0,0,0.08)' : `1px solid rgba(${primaryRgb},.18)`, borderBottom: isLightBg ? '1px solid rgba(0,0,0,0.08)' : `1px solid rgba(${primaryRgb},.18)`, borderLeft: isLightBg ? '1px solid rgba(0,0,0,0.08)' : `1px solid rgba(${primaryRgb},.18)`, borderRadius: '16px', boxShadow: '0 8px 32px rgba(0,0,0,.45)' }}>
              {/* الحجز */}
              <div className="flex flex-col items-center gap-1.5 px-3 py-4 sm:px-5 sm:py-5">
                <svg className="h-5 w-5 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="3"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>
                <div className="text-[10px] sm:text-xs font-medium tracking-wide" style={{ color: 'var(--text-muted)' }}>الحجز</div>
                <div className="text-xs sm:text-sm font-extrabold text-center leading-tight" style={{ color: 'var(--text-primary)' }}>بالحجز المسبق فقط</div>
              </div>
              {/* الموقع */}
              <div className="flex flex-col items-center gap-1.5 px-3 py-4 sm:px-5 sm:py-5">
                <svg className="h-5 w-5 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/><circle cx="12" cy="9" r="2.5"/></svg>
                <div className="text-[10px] sm:text-xs font-medium tracking-wide" style={{ color: 'var(--text-muted)' }}>الموقع</div>
                <div className="text-xs sm:text-sm font-extrabold text-center leading-tight truncate max-w-full" style={{ color: 'var(--text-primary)' }}>{neighborhood}</div>
              </div>
              {/* ساعات العمل */}
              <div className="flex flex-col items-center gap-1.5 px-3 py-4 sm:px-5 sm:py-5">
                <svg className="h-5 w-5 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 3"/></svg>
                <div className="text-[10px] sm:text-xs font-medium tracking-wide" style={{ color: 'var(--text-muted)' }}>ساعات العمل</div>
                <div className="text-xs sm:text-sm font-extrabold text-center leading-tight" style={{ color: 'var(--text-primary)' }}>{workingHours}</div>
              </div>
            </div>
          </div>
        </div>

        {/* ── QUICK BOOKING ── */}
        <section className="section-dark">
          <div className="mx-auto max-w-6xl px-4 py-12 lg:px-6">
            <div className="card relative overflow-hidden rounded-3xl reveal">
              <div className="pointer-events-none absolute inset-0" style={{ background: `radial-gradient(circle at 70% 15%,rgba(${primaryRgb},.1),transparent 55%)` }} />
              <div className="relative p-7 lg:flex lg:items-center lg:gap-12">
                <div className="lg:flex-1">
                  <div style={{ fontSize: '1.65rem', fontWeight: 900, letterSpacing: '-0.02em', lineHeight: 1.1, marginBottom: 8, background: `linear-gradient(120deg, rgb(${primaryRgb}), rgba(${primaryRgb},0.7))`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text', fontFamily: "'Playfair Display', 'Georgia', serif" }}>{salon.name}</div>
                  <div className="text-2xl font-extrabold leading-snug mt-2">
                    {(salon.meta?.booking_hero_title ?? 'تفاصيل دقيقة\nأجواء راقية').split('\n').map((line, i, arr) =>
                      i < arr.length - 1 ? <span key={i}>{line}<br /></span> : <span key={i} className="text-gold">{line}</span>
                    )}
                  </div>
                  <p className="mt-3 text-sm leading-relaxed t-muted">{salon.meta?.booking_hero_description ?? 'حلاقة رجالية فاخرة في قلب المدينة، بالحجز المسبق فقط.'}</p>
                </div>
                <div className="card mt-6 lg:mt-0 lg:w-80 rounded-2xl p-5">
                  <div className="text-sm font-extrabold">{salon.meta?.booking_card_title ?? 'حجز سريع'}</div>
                  <div className="mt-1 text-xs t-muted">{salon.meta?.booking_card_subtitle ?? 'اختر الحلاق والخدمة والوقت… والباقي علينا.'}</div>
                  <div className="mt-4 grid gap-2.5 text-sm t-secondary">
                    {[salon.meta?.booking_step1 ?? 'اختر الحلاق', salon.meta?.booking_step2 ?? 'حدّد الخدمات', salon.meta?.booking_step3 ?? 'ثبّت موعدك'].map((s, i) => (
                      <div key={i} className="flex items-center gap-3">
                        <span className="inline-flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full text-xs font-extrabold text-black" style={{ background: 'var(--primary)', color: btnTextColor }}>{i+1}</span>
                        <span>{s}</span>
                      </div>
                    ))}
                  </div>
                  <button type="button" onClick={() => openBooking()} className="btn-gold mt-5 w-full rounded-xl px-4 py-3 text-sm font-extrabold">{salon.meta?.booking_button_text ?? 'ابدأ الحجز'}</button>
                </div>
                {barbers.length > 0 && (
                  <div className="mt-5 lg:hidden flex flex-wrap gap-2">
                    {barbers.map(b => (
                      <button key={b.id} type="button" onClick={() => openBooking('', b.name)} className="rounded-full px-4 py-1.5 text-xs t-secondary transition-all duration-200 hover:border-gold/40 hover:text-gold" style={{ background: 'var(--card-bg)', border: '1px solid var(--border)' }}>{b.name}</button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* ── SERVICES ── */}
        {services.length > 0 && (
        <section id="services" className="scroll-mt-24 section-light">
          <div className="mx-auto max-w-7xl px-6 py-16 lg:py-24 lg:px-12">

            {/* Header */}
            <div className="reveal mb-12">
              <span className="sec-label">خدماتنا</span>
              <h2 className="text-2xl font-extrabold tracking-tight sm:text-3xl lg:text-4xl" style={{ letterSpacing: '-0.02em' }}>قائمة الخدمات والأسعار</h2>
            </div>

            {/* Cards grid */}
            {(() => {
              const cats = salon.meta?.categories ?? []
              const svcCats = salon.meta?.service_categories ?? {}
              const activeCat = cats.find(c => c.id === viewCatId)
              const catServices = activeCat ? services.filter(s => svcCats[s.id] === activeCat.id) : []


              if (cats.length === 0 || !activeCat) return (
                <>
                  {cats.length > 0 ? (
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                      {cats.map((cat, i) => {
                        const count = services.filter(s => svcCats[s.id] === cat.id).length
                        return (
                          <button key={cat.id} type="button" dir="rtl" onClick={() => setViewCatId(cat.id)}
                            className="glass-card group relative flex flex-col gap-4 rounded-2xl p-5 text-right transition-all duration-200 hover:scale-[1.02]"
                            style={{ borderRadius: '16px', border: `1px solid rgba(${primaryRgb},0.15)`, boxShadow: `0 4px 24px rgba(0,0,0,0.35)` }}>
                            <div className="flex items-start gap-3">
                              <span className="mt-0.5 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl" style={{ background: `rgba(${primaryRgb},0.1)`, border: `1px solid rgba(${primaryRgb},0.18)` }}>
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18M3 12h18M3 18h18"/></svg>
                              </span>
                              <div>
                                <p className="text-sm font-bold leading-snug" style={{ color: 'var(--text-primary)' }}>{cat.name}</p>
                                <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{count} خدمة</p>
                              </div>
                            </div>
                            <div className="flex items-center justify-end border-t pt-3" style={{ borderColor: `rgba(${primaryRgb},0.1)` }}>
                              <span className="text-xs font-semibold" style={{ color: `rgba(${primaryRgb},1)` }}>عرض الخدمات ←</span>
                            </div>
                          </button>
                        )
                      })}
                    </div>
                  ) : (
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 reveal">
                      {services.map((s, i) => (
                        <div key={s.id} dir="rtl"
                          className={`glass-card reveal reveal-d${Math.min(i + 1, 4)} group relative flex flex-col gap-4 rounded-2xl p-5`}
                          style={{ borderRadius: '16px', boxShadow: `inset 0 1px 0 rgba(255,255,255,0.06), 0 4px 24px rgba(0,0,0,0.35)`, border: `1px solid rgba(${primaryRgb},0.12)` }}>
                          <div className="flex items-start gap-3">
                            <span className="mt-0.5 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl" style={{ background: `rgba(${primaryRgb},0.1)`, border: `1px solid rgba(${primaryRgb},0.18)` }}>
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="6" cy="6" r="2.5"/><circle cx="6" cy="18" r="2.5"/><line x1="20" y1="4" x2="8.5" y2="15.5"/><line x1="14.5" y1="14.5" x2="20" y2="20"/><line x1="8.5" y1="8.5" x2="12" y2="12"/></svg>
                            </span>
                            <span className="text-sm font-bold leading-snug" style={{ color: 'var(--text-primary)' }}>{s.name_ar}</span>
                          </div>
                          <div className="flex items-end justify-between border-t pt-3" style={{ borderColor: `rgba(${primaryRgb},0.1)` }}>
                            <span className="text-xl font-black leading-none" style={{ color: 'var(--primary)', letterSpacing: '-0.02em' }}>{s.price}<span className="mr-1 text-xs font-semibold" style={{ color: `rgba(${primaryRgb},0.7)` }}>ر.س</span></span>
                            <span className="flex items-center gap-1 text-xs font-medium" style={{ color: 'var(--text-muted)' }}>
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 3"/></svg>
                              {s.duration_min} دقيقة
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )

              return (
                <div>
                  <button type="button" onClick={() => setViewCatId(null)}
                    className="mb-4 flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-semibold transition-all duration-200 hover:opacity-80"
                    style={{ borderColor: `rgba(${primaryRgb},.3)`, background: `rgba(${primaryRgb},.08)`, color: `rgba(${primaryRgb},1)` }}>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
                    رجوع للأقسام
                  </button>
                  <p className="mb-4 text-base font-bold" style={{ color: 'var(--text-primary)' }}>{activeCat.name}</p>
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {catServices.length === 0
                      ? <p className="text-sm col-span-full text-center py-8" style={{ color: 'var(--text-muted)' }}>لا توجد خدمات في هذا القسم</p>
                      : catServices.map((s, i) => (
                          <div key={s.id} dir="rtl"
                            className="glass-card flex flex-col gap-4 rounded-2xl p-5"
                            style={{ borderRadius: '16px', boxShadow: `0 4px 24px rgba(0,0,0,0.35)`, border: `1px solid rgba(${primaryRgb},0.12)` }}>
                            <div className="flex items-start gap-3">
                              <span className="mt-0.5 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl" style={{ background: `rgba(${primaryRgb},0.1)`, border: `1px solid rgba(${primaryRgb},0.18)` }}>
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="6" cy="6" r="2.5"/><circle cx="6" cy="18" r="2.5"/><line x1="20" y1="4" x2="8.5" y2="15.5"/><line x1="14.5" y1="14.5" x2="20" y2="20"/><line x1="8.5" y1="8.5" x2="12" y2="12"/></svg>
                              </span>
                              <span className="text-sm font-bold leading-snug" style={{ color: 'var(--text-primary)' }}>{s.name_ar}</span>
                            </div>
                            <div className="flex items-end justify-between border-t pt-3" style={{ borderColor: `rgba(${primaryRgb},0.1)` }}>
                              <span className="text-xl font-black leading-none" style={{ color: 'var(--primary)', letterSpacing: '-0.02em' }}>{s.price}<span className="mr-1 text-xs font-semibold" style={{ color: `rgba(${primaryRgb},0.7)` }}>ر.س</span></span>
                              <span className="flex items-center gap-1 text-xs font-medium" style={{ color: 'var(--text-muted)' }}>
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 3"/></svg>
                                {s.duration_min} دقيقة
                              </span>
                            </div>
                          </div>
                        ))
                    }
                  </div>
                </div>
              )
            })()}

            {/* CTA */}
            <button
              type="button"
              onClick={() => openBooking()}
              className="btn-gold reveal mt-8 w-full rounded-xl py-3.5 text-sm font-bold"
            >
              احجز الآن
            </button>
          </div>
        </section>
        )}

        {/* ── OFFERS ── */}
        {(salon.meta?.offers?.filter(o => o.is_active) ?? []).length > 0 && (
        <section id="offers" className="scroll-mt-24 border-y border-white/5 section-light">
          <div className="mx-auto max-w-6xl px-4 py-16 lg:py-24 lg:px-6">
            <div className="reveal mb-12">
              <span className="sec-label">عروض حصرية</span>
              <h2 className="text-2xl font-extrabold tracking-tight sm:text-3xl lg:text-4xl">عروضنا</h2>
            </div>
            <div className="grid gap-4 sm:gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {salon.meta!.offers!.filter(o => o.is_active).slice(0, 3).map((offer, i) => {
                const offerServices = (offer.service_ids ?? []).map(sid => services.find(s => s.id === sid)?.name_ar).filter(Boolean)
                const glow = `rgba(${primaryRgb},0.13)`
                return (
                  <div key={offer.id} dir="rtl" className={`card reveal reveal-d${i + 1} relative rounded-2xl p-6 hover:scale-[1.02]`}
                    style={{ transition: 'all 300ms', borderRadius: '16px', boxShadow: `var(--card-shadow), 0 0 24px ${glow}` }}>
                    {/* Soft radial glow */}
                    <div className="absolute inset-0 pointer-events-none" style={{ background: `radial-gradient(ellipse 60% 80% at 0% 50%, ${glow}, transparent)` }} />
                    {/* Badge */}
                    {offer.badge && (
                      <div className="absolute top-4 left-4 px-3 py-1 text-xs font-medium rounded-full border"
                        style={{ backgroundColor: `rgba(${primaryRgb},0.1)`, color: 'var(--primary)', borderColor: `rgba(${primaryRgb},0.25)` }}>
                        {offer.badge}
                      </div>
                    )}
                    <div className="relative">
                      {offer.badge && <div className="mb-6" />}
                      <h3 className="text-2xl font-extrabold t-primary mb-1.5 leading-tight tracking-tight">{offer.title}</h3>
                      {offer.description && <p className="t-muted text-sm leading-relaxed mb-5">{offer.description}</p>}
                      {offerServices.length > 0 && (
                        <ul className="mb-5 space-y-3">
                          {offerServices.map(name => (
                            <li key={name} className="flex items-center gap-3 text-sm t-secondary">
                              <span className="text-[11px] shrink-0 leading-none" style={{ color: 'var(--primary)' }}>✦</span>
                              <span>{name}</span>
                            </li>
                          ))}
                        </ul>
                      )}
                      <div className="border-t border-subtle mb-4" />
                      <div className="mb-5">
                        {offer.price_current && <div className="text-3xl font-extrabold tracking-tight" style={{ color: 'var(--primary)' }}>{offer.price_current} <span className="text-lg">ر.س</span></div>}
                        {offer.price_old && (
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs t-muted line-through">{offer.price_old} ر.س</span>
                          </div>
                        )}
                        {offer.price_old && offer.price_current && (() => {
                          const saving = Math.round(parseFloat(offer.price_old) - parseFloat(offer.price_current))
                          return saving > 0 ? (
                            <div className="mt-1.5 text-xs font-semibold" style={{ color: 'var(--primary)' }}>وفّر {saving} ريال</div>
                          ) : null
                        })()}
                      </div>
                      <button type="button" onClick={() => openBooking(offer.title)}
                        className="btn-gold w-full py-3 rounded-xl text-sm font-semibold">
                        احجز الآن
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </section>
        )}

        {/* ── WHY US ── */}
        <section id="why-us" className="scroll-mt-24 section-dark">
          <div className="mx-auto max-w-6xl px-4 py-16 lg:py-24 lg:px-6">
            <div className="reveal mb-12">
              <span className="sec-label">مميزاتنا</span>
              <h2 className="text-3xl font-extrabold tracking-tight lg:text-4xl">{salon.meta?.features_title ?? 'ماذا يميزنا'}</h2>
              <p className="mt-2 t-muted leading-relaxed">{salon.meta?.features_subtitle ?? 'نحن لسنا مجرد صالون حلاقة — نحن تجربة كاملة.'}</p>
            </div>
            <div className="grid gap-10 lg:grid-cols-12 lg:items-stretch">
              <div className="lg:col-span-5 reveal">
                <div className="overflow-hidden rounded-3xl border border-gold/15 shadow-glow h-full" style={{ minHeight: '420px' }}>
                  <img src={salon.meta?.feature_image || '/barber.jpg'} alt={`صالون ${salon.name}`} className="w-full h-full object-cover transition-transform duration-700 hover:scale-[1.03]" loading="lazy" />
                </div>
              </div>
              <div className="lg:col-span-7 grid gap-4 sm:grid-cols-2 reveal reveal-d1">
                {(salon.meta?.features?.filter(f => f.title.trim()) ?? []).length > 0
                  ? salon.meta!.features!.filter(f => f.title.trim()).map((f, i) => (
                    <div key={i} className="glass-card rounded-3xl p-6">
                      <div className="mb-3 text-2xl leading-none" style={{ color: 'var(--primary)', textShadow: `0 0 10px rgba(${primaryRgb},.22), 0 0 4px rgba(${primaryRgb},.12)` }}>✦</div>
                      <h3 className="text-lg font-extrabold mb-2">{f.title}</h3>
                      <p className="text-sm t-muted leading-relaxed">{f.description}</p>
                    </div>
                  ))
                  : [
                    { title: 'دقة في التفاصيل', desc: 'كل قصة تُنفَّذ بدقة متناهية تناسب ملامح وجهك وأسلوبك.' },
                    { title: 'أدوات احترافية', desc: 'نستخدم أفضل الأدوات المعقمة لضمان نظافة وجودة عالية في كل جلسة.' },
                    { title: 'حجز سريع ومنظم', desc: 'نظام حجز سهل وسريع يُنظّم وقتك بدون انتظار أو ازدحام.' },
                    { title: 'تجربة فاخرة للرجال', desc: 'أجواء راقية وهادئة صُمِّمت خصيصًا لتجعل زيارتك تجربة لا تُنسى.' },
                  ].map((f, i) => (
                    <div key={i} className="glass-card rounded-3xl p-6">
                      <div className="mb-3 text-2xl leading-none" style={{ color: 'var(--primary)', textShadow: `0 0 10px rgba(${primaryRgb},.22), 0 0 4px rgba(${primaryRgb},.12)` }}>✦</div>
                      <h3 className="text-lg font-extrabold mb-2">{f.title}</h3>
                      <p className="text-sm t-muted leading-relaxed">{f.desc}</p>
                    </div>
                  ))
                }
              </div>
            </div>
          </div>
        </section>


        {/* ── ABOUT ── */}
        <section id="about" className="scroll-mt-24 border-y border-white/5 section-light">
          <div className="mx-auto max-w-6xl px-4 py-16 lg:py-24 lg:px-6">
            <div className="grid gap-12 lg:grid-cols-12 lg:items-center">
              <div className="lg:col-span-6 reveal">
                <span className="sec-label">من نحن</span>
                <h2 className="text-3xl font-extrabold tracking-tight lg:text-4xl">{salon.meta?.about_title ?? 'لماذا تختارنا'}</h2>
                {salon.meta?.about_description && (
                  <p className="mt-5 t-muted leading-loose">{salon.meta.about_description}</p>
                )}
                <div className="mt-8 grid gap-4 sm:grid-cols-3">
                  {[
                    { v: `+${salon.meta?.years_experience ?? 10}`, l: 'سنوات خبرة' },
                    { v: String(salon.meta?.rating ?? '4.9'), l: 'تقييم من 5' },
                    { v: `+${salon.meta?.happy_clients ?? 500}`, l: 'عميل راضٍ' },
                  ].map(s => (
                    <div key={s.l} className="glass-card rounded-3xl p-5 text-center">
                      <div className="text-3xl font-extrabold text-gold">{s.v}</div>
                      <div className="mt-1 text-sm t-muted">{s.l}</div>
                    </div>
                  ))}
                </div>
              </div>
              {salon.meta?.about_image && (
              <div className="hidden lg:block lg:col-span-6 reveal reveal-d1">
                <div className="overflow-hidden rounded-3xl border border-gold/15 shadow-glow" style={{ height: '420px' }}>
                  <img src={salon.meta.about_image} alt={`صالون ${salon.name}`} className="w-full h-full object-cover transition-transform duration-700 hover:scale-[1.03]" loading="lazy" />
                </div>
              </div>
              )}
            </div>
          </div>
        </section>

        {/* ── REVIEWS ── */}
        <section id="reviews" className="scroll-mt-24 section-light">
          <div className="mx-auto max-w-6xl px-4 py-16 lg:py-24 lg:px-6">
            <div className="reveal mb-12">
              <span className="sec-label">آراء العملاء</span>
              <h2 className="text-3xl font-extrabold tracking-tight lg:text-4xl">{salon.meta?.reviews_title ?? 'التقييمات'}</h2>
              {(salon.meta?.reviews_subtitle) && (
                <p className="mt-2 t-muted leading-relaxed">{salon.meta.reviews_subtitle}</p>
              )}
            </div>
            <div className="grid gap-5 md:grid-cols-3">
              {(salon.meta?.reviews?.length
                ? salon.meta.reviews
                : [
                    { name: 'عميل راضٍ', text: 'حلاق على مستوى عالي، نظافة واحترام وخدمة ممتازة.' },
                    { name: 'عميل راضٍ', text: 'من أفضل حلاقين الرياض وتعامل راقي.' },
                    { name: 'عميل راضٍ', text: 'محل جميل ونظيف وخدمة احترافية.' },
                  ]
              ).map((r, i) => (
                <figure key={i} className={`glass-card reveal reveal-d${i+1} rounded-3xl p-6`}>
                  <div className="text-xl text-gold mb-4" aria-label="★★★★★">
                    {'★★★★★'.split('').map((s, j) => <span key={j} className="star-pop">{s}</span>)}
                  </div>
                  <blockquote className="text-sm t-secondary leading-relaxed">{r.text}</blockquote>
                  <figcaption className="mt-4 text-xs t-muted">{r.name}</figcaption>
                </figure>
              ))}
            </div>
          </div>
        </section>

        {/* ── LOCATION ── */}
        {mapUrl && (
        <section id="location" className="scroll-mt-24 border-y border-white/5 section-dark">
          <div className="mx-auto max-w-6xl px-4 py-16 lg:py-24 lg:px-6">
            <div className="flex flex-wrap items-end justify-between gap-6 reveal">
              <div>
                <div className="sec-label">زرنا</div>
                <h2 className="text-3xl font-extrabold tracking-tight lg:text-4xl">الموقع</h2>
              </div>
            </div>
            <div className="mt-4 reveal">
              <a href={salon.meta?.map_place_url} target="_blank" rel="noopener noreferrer"
                className="btn-gold inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold">
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/><circle cx="12" cy="9" r="2.5"/></svg>
                افتح في خرائط Google
              </a>
            </div>
            {salon.meta?.map_embed_url && (
            <div className="mt-12 overflow-hidden rounded-3xl border border-subtle shadow-soft reveal">
              <iframe title={`موقع ${salon.name}`} className="h-[420px] w-full" loading="lazy" referrerPolicy="no-referrer-when-downgrade"
                src={salon.meta.map_embed_url} />
            </div>
            )}
          </div>
        </section>
        )}
      </main>

      {/* ── FOOTER ── */}
      <footer className="border-t border-white/5" style={{ background: 'var(--bg)' }}>
        <div className="mx-auto max-w-6xl px-4 py-12 text-center lg:px-6">
          <div className="flex items-center justify-center gap-3 mb-4">
            <span className="h-px w-12" style={{ background: `linear-gradient(to left,rgba(${primaryRgb},.12),transparent)` }} />
            <span className="text-gold/50 text-xs">✦</span>
            <span className="h-px w-12" style={{ background: `linear-gradient(to right,rgba(${primaryRgb},.12),transparent)` }} />
          </div>
          <div className="font-extrabold text-lg t-secondary">{salon.name}</div>
          <div className="mt-1 text-sm t-muted">حجز مسبق فقط • {workingHours} • جميع أيام الأسبوع</div>
          <div className="mt-5 text-xs t-muted">© {new Date().getFullYear()} جميع الحقوق محفوظة</div>
          <div className="mt-4"><a href="/dashboard/login" className="btn-gold inline-block rounded-xl px-5 py-2.5 text-sm font-bold">لوحة التحكم</a></div>
        </div>
      </footer>

      {/* ── WHATSAPP FLOAT ── */}
      {salon.whatsapp_number && (
        <a href={`https://wa.me/${salon.whatsapp_number}`} target="_blank" rel="noopener noreferrer"
          className="fixed bottom-6 left-6 z-50 flex h-14 w-14 items-center justify-center rounded-full transition-transform duration-200 hover:scale-110 active:scale-95"
          style={{ background: '#25D366', boxShadow: '0 4px 24px rgba(37,211,102,0.45), 0 2px 8px rgba(0,0,0,0.3)' }}
          aria-label="تواصل عبر واتساب">
          <svg viewBox="0 0 24 24" fill="white" className="h-7 w-7"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
        </a>
      )}

      {/* ── BOOKING MODAL ── */}
      {bookingOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,.78)', backdropFilter: 'blur(6px)' }} onClick={e => { if (e.target === e.currentTarget) setBookingOpen(false) }} aria-hidden="false">
          <div role="dialog" aria-modal={true} aria-labelledby="bookingTitle" className="booking-dialog-inner relative w-full max-w-lg overflow-hidden rounded-3xl border border-gold/20 shadow-glow-lg" style={{ background: 'var(--bg)' }}>
            <div className="border-b border-subtle px-6 py-5" style={{ background: 'var(--color-bg-tinted)' }}>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 id="bookingTitle" className="text-xl font-extrabold">حجز موعد</h3>
                  <p className="mt-1 text-sm t-secondary">عبّئ البيانات واختر الخدمة والوقت المناسب.</p>
                </div>
                <button type="button" onClick={() => setBookingOpen(false)} className="rounded-xl border border-default p-2 t-muted transition-all duration-200 hover:border-gold/30 hover:text-white focus:outline-none" style={{ background: 'rgba(255,255,255,.05)' }} aria-label="إغلاق">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
                </button>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="max-h-[80vh] overflow-y-auto px-6 py-6" noValidate>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="grid gap-2">
                  <span className="text-sm font-bold t-primary">الاسم</span>
                  <input required name="name" type="text" autoComplete="name" value={name} onChange={e => setName(e.target.value)} className="field-input h-11 rounded-xl border border-default px-4 text-sm t-primary placeholder:text-white/25 transition-all duration-200" style={{ background: 'var(--color-bg-input)' }} placeholder="الاسم الكريم/ة" />
                </label>
                <label className="grid gap-2">
                  <span className="text-sm font-bold t-primary">رقم الجوال</span>
                  <input required name="phone" type="tel" inputMode="numeric" autoComplete="tel" value={phone} onChange={handlePhone} onKeyDown={e => { if ((e.key==='Backspace'||e.key==='Delete') && (e.currentTarget.selectionStart??0)<=2 && e.currentTarget.selectionStart===e.currentTarget.selectionEnd) e.preventDefault() }} onFocus={e => { setTimeout(()=>{ if((e.target.selectionStart??0)<2) e.target.setSelectionRange(2,2) },0) }} onClick={e => { if((e.currentTarget.selectionStart??0)<2) e.currentTarget.setSelectionRange(2,2) }} className="field-input h-11 rounded-xl border border-default px-4 text-sm t-primary placeholder:text-white/25 transition-all duration-200" style={{ background: 'var(--color-bg-input)' }} placeholder="05xxxxxxxx" maxLength={10} />
                </label>
              </div>

              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <label className="grid gap-2">
                  <span className="text-sm font-bold t-primary">اختيار الحلاق</span>
                  <select required name="barber" value={barber} onChange={e => setBarber(e.target.value)} className="field-input h-11 rounded-xl border border-default px-4 text-sm t-primary transition-all duration-200" style={{ background: 'var(--color-bg-input)' }}>
                    <option value="" disabled>اختر الحلاق</option>
                    {barbers.map(b => <option key={b.id} value={b.name}>{b.name}</option>)}
                  </select>
                </label>
                <label className="grid gap-2">
                  <span className="text-sm font-bold t-primary">اختيار التاريخ</span>
                  <input required name="date" type="date" value={date} min={today} onChange={e => setDate(e.target.value)} className="field-input h-11 rounded-xl border border-default px-4 text-sm t-primary transition-all duration-200" style={{ background: 'var(--color-bg-input)' }} />
                </label>
              </div>

              {(() => {
                const cats = salon.meta?.categories ?? []
                const svcCats = salon.meta?.service_categories ?? {}
                const selectedOffer = selectedOfferId ? (salon.meta?.offers ?? []).find((o: any) => o.id === selectedOfferId) : null
                const total = selectedOffer?.price_current ? Number(selectedOffer.price_current) : services.filter(s => checkedServices.has(s.name_ar)).reduce((sum, s) => sum + s.price, 0)

                if (cats.length === 0) return (
                  <fieldset className="mt-4 rounded-2xl border border-subtle p-4" style={{ background: 'var(--color-bg-tinted)' }}>
                    <legend className="px-2 text-sm font-extrabold t-primary">اختيار الخدمة (يمكن اختيار أكثر من خدمة)</legend>
                    <div className="mt-3 max-h-56 overflow-auto rounded-2xl border border-subtle p-3" style={{ background: 'var(--color-bg-dim)' }}>
                      <div className="grid gap-2 sm:grid-cols-2">
                        {services.map(svc => (
                          <label key={svc.id} className="flex cursor-pointer items-center justify-between gap-3 rounded-xl border border-white/8 px-3 py-2.5 text-sm text-white/70 transition-all duration-200 hover:border-gold/25 hover:bg-gold/5" style={{ background: 'rgba(0,0,0,.1)' }}>
                            <span>{svc.name_ar} — <span style={{ color: 'var(--primary)' }}>{svc.price} ر.س</span></span>
                            <input className="h-4 w-4" style={{ accentColor: 'var(--primary)' }} type="checkbox" name="service" value={svc.name_ar} checked={checkedServices.has(svc.name_ar)} onChange={() => toggleService(svc.name_ar)} />
                          </label>
                        ))}
                      </div>
                    </div>
                    <div className="mt-3 text-sm font-bold text-left" style={{ color: 'var(--primary)' }}>
                      المجموع: {total} ر.س
                    </div>
                  </fieldset>
                )

                const openCat = cats.find(c => c.id === openCategoryId)
                const catServices = openCat ? services.filter(s => svcCats[s.id] === openCat.id) : []

                const activeOffers = (salon.meta?.offers ?? []).filter((o: any) => o.is_active)

                return (
                  <fieldset className="mt-4 rounded-2xl border border-subtle p-4" style={{ background: 'var(--color-bg-tinted)' }}>
                    <legend className="px-2 text-sm font-extrabold t-primary">اختيار الخدمة</legend>

                    {/* Tab switcher */}
                    {activeOffers.length > 0 && (
                      <div className="mt-3 flex gap-1 rounded-xl p-1" style={{ background: 'var(--color-bg-dim)' }}>
                        <button type="button" onClick={() => { setBookingTab('cats'); setOpenCategoryId(null) }}
                          className="flex-1 rounded-lg py-1.5 text-xs font-semibold transition-all"
                          style={{ background: bookingTab === 'cats' ? `rgba(${primaryRgb},.15)` : 'transparent', color: bookingTab === 'cats' ? `rgba(${primaryRgb},1)` : 'rgba(255,255,255,0.4)' }}>
                          الأقسام
                        </button>
                        <button type="button" onClick={() => { setBookingTab('offers'); setOpenCategoryId(null) }}
                          className="flex-1 rounded-lg py-1.5 text-xs font-semibold transition-all"
                          style={{ background: bookingTab === 'offers' ? `rgba(${primaryRgb},.15)` : 'transparent', color: bookingTab === 'offers' ? `rgba(${primaryRgb},1)` : 'rgba(255,255,255,0.4)' }}>
                          العروض
                        </button>
                      </div>
                    )}

                    {/* Offers tab */}
                    {bookingTab === 'offers' ? (
                      <div className="mt-3 space-y-2">
                        {activeOffers.map((offer: any) => {
                          const offerSvcNames = (offer.service_ids ?? []).map((id: string) => services.find(s => s.id === id)?.name_ar).filter(Boolean) as string[]
                          const allSelected = offerSvcNames.length > 0 && offerSvcNames.every(n => checkedServices.has(n))
                          return (
                            <button key={offer.id} type="button"
                              onClick={() => {
                                if (allSelected) {
                                  setCheckedServices(new Set())
                                  setSelectedOfferId(null)
                                } else {
                                  setCheckedServices(new Set(offerSvcNames))
                                  setSelectedOfferId(offer.id)
                                }
                              }}
                              className="w-full text-right rounded-xl border px-3 py-2.5 transition-all duration-200 hover:scale-[1.01]"
                              style={{ borderColor: allSelected ? `rgba(${primaryRgb},.5)` : 'rgba(255,255,255,0.08)', background: allSelected ? `rgba(${primaryRgb},.08)` : 'rgba(0,0,0,.1)' }}>
                              <div className="flex items-center justify-between gap-2">
                                <span className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>{offer.title}</span>
                                <div className="flex items-center gap-2 shrink-0">
                                  {offer.price_current && <span className="text-xs font-bold" style={{ color: `rgba(${primaryRgb},1)` }}>{offer.price_current} ر.س</span>}
                                  <span className="h-4 w-4 rounded border flex items-center justify-center" style={{ borderColor: allSelected ? `rgba(${primaryRgb},1)` : 'rgba(255,255,255,0.2)', background: allSelected ? `rgba(${primaryRgb},1)` : 'transparent' }}>
                                    {allSelected && <svg width="10" height="10" viewBox="0 0 12 12" fill="none" stroke="#000" strokeWidth="2" strokeLinecap="round"><polyline points="2 6 5 9 10 3"/></svg>}
                                  </span>
                                </div>
                              </div>
                              {offerSvcNames.length > 0 && <p className="mt-1 text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>{offerSvcNames.join(' • ')}</p>}
                            </button>
                          )
                        })}
                      </div>
                    ) : (

                    /* Category buttons */
                    !openCat ? (
                      <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
                        {cats.map(cat => {
                          const count = services.filter(s => svcCats[s.id] === cat.id && checkedServices.has(s.name_ar)).length
                          return (
                            <button key={cat.id} type="button" onClick={() => setOpenCategoryId(cat.id)}
                              className="relative flex items-center justify-between rounded-xl border px-3 py-2.5 text-sm font-medium transition-all duration-200 hover:scale-[1.02]"
                              style={{ background: 'var(--color-bg-dim)', borderColor: count > 0 ? `rgba(${primaryRgb},.5)` : 'rgba(255,255,255,0.08)', color: 'var(--text-primary)' }}>
                              <span className="truncate">{cat.name}</span>
                              {count > 0 && (
                                <span className="mr-1 shrink-0 rounded-full px-1.5 py-0.5 text-xs font-bold text-white" style={{ background: `rgba(${primaryRgb},1)` }}>{count}</span>
                              )}
                            </button>
                          )
                        })}
                      </div>
                    ) : (
                      <div className="mt-3">
                        <div className="mb-3 flex items-center gap-2">
                          <button type="button" onClick={() => setOpenCategoryId(null)}
                            className="flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-semibold transition-all duration-200 hover:opacity-80"
                            style={{ borderColor: `rgba(${primaryRgb},.3)`, background: `rgba(${primaryRgb},.08)`, color: `rgba(${primaryRgb},1)` }}>
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
                            رجوع
                          </button>
                          <span className="text-sm font-bold t-primary">{openCat.name}</span>
                        </div>
                        <div className="max-h-52 overflow-auto rounded-2xl border border-subtle p-3 space-y-2" style={{ background: 'var(--color-bg-dim)' }}>
                          {catServices.length === 0
                            ? <p className="text-xs text-center py-3 t-muted">لا توجد خدمات في هذا القسم</p>
                            : catServices.map(svc => (
                              <label key={svc.id} className="flex cursor-pointer items-center justify-between gap-3 rounded-xl border border-white/8 px-3 py-2.5 text-sm text-white/70 transition-all duration-200 hover:border-gold/25 hover:bg-gold/5" style={{ background: 'rgba(0,0,0,.1)' }}>
                                <span>{svc.name_ar} — <span style={{ color: 'var(--primary)' }}>{svc.price} ر.س</span></span>
                                <input className="h-4 w-4" style={{ accentColor: 'var(--primary)' }} type="checkbox" name="service" value={svc.name_ar} checked={checkedServices.has(svc.name_ar)} onChange={() => toggleService(svc.name_ar)} />
                              </label>
                            ))
                          }
                        </div>
                      </div>
                    )
                    )}

                    <div className="mt-3 text-sm font-bold text-left" style={{ color: 'var(--primary)' }}>
                      المجموع: {total} ر.س
                    </div>
                  </fieldset>
                )
              })()}

              <div className="mt-4 grid gap-3">
                <span className="text-sm font-bold t-primary">اختيار الوقت</span>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
                  {timeOpts.map((o, i) => (
                    <button
                      key={o.value}
                      type="button"
                      disabled={o.booked}
                      onClick={() => setTime(o.value)}
                      className={[
                        'time-slot-animate relative flex flex-col items-center justify-center rounded-xl border px-2 py-2.5 text-xs font-semibold',
                        'transition-all duration-200 active:scale-95',
                        o.booked
                          ? 'pointer-events-none cursor-not-allowed opacity-50 grayscale border-default t-muted'
                          : time === o.value
                            ? 'border-transparent text-white scale-[1.04]'
                            : 'border-default t-primary hover:scale-[1.03]',
                      ].join(' ')}
                      style={{
                        animationDelay: `${i * 30}ms`,
                        ...(o.booked
                          ? {
                              background: 'var(--color-bg-input)',
                              boxShadow: 'none',
                            }
                          : time === o.value
                            ? {
                                background: `rgba(${primaryRgb},1)`,
                                borderColor: `rgba(${primaryRgb},1)`,
                                boxShadow: `0 4px 14px rgba(${primaryRgb},.45), inset 0 1px 0 rgba(255,255,255,.18)`,
                              }
                            : {
                                background: 'var(--color-bg-input)',
                                borderColor: `rgba(${primaryRgb},.35)`,
                                boxShadow: '0 2px 6px rgba(0,0,0,.18), inset 0 1px 0 rgba(255,255,255,.06)',
                              }),
                      }}
                    >
                      {time === o.value && (
                        <svg className="mb-0.5 h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                      {o.label}
                    </button>
                  ))}
                </div>
                <p className="text-xs t-muted">الأوقات المتاحة كل 30 دقيقة حسب جدول الحلاق.</p>
              </div>

              {formMsg && (
                <div className="mt-4 rounded-2xl border px-4 py-3 text-sm text-white/80" style={{ borderColor: formMsg.error ? 'var(--color-error-border)' : `rgba(${primaryRgb},.28)`, background: formMsg.error ? 'var(--color-error-bg)' : `rgba(${primaryRgb},.08)` }}>
                  {formMsg.text}
                </div>
              )}

              <div className="mt-6 mb-1 text-center text-lg font-extrabold" style={{ color: 'var(--primary)' }}>
                إجمالي الطلب: {(() => { const so = selectedOfferId ? (salon.meta?.offers ?? []).find((o: any) => o.id === selectedOfferId) : null; return so?.price_current ? Number(so.price_current) : services.filter(s => checkedServices.has(s.name_ar)).reduce((sum, s) => sum + s.price, 0) })()} ر.س
              </div>

              <div className="mt-4 flex flex-col gap-2">
                <button type="submit" disabled={submitting} className="btn-gold w-full rounded-xl px-6 py-3.5 text-sm font-extrabold focus:outline-none disabled:opacity-60" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                  {submitting ? '...' : (<>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12 0C5.373 0 0 5.373 0 12c0 2.124.558 4.118 1.532 5.845L.054 23.448a.75.75 0 0 0 .906.953l5.808-1.519A11.95 11.95 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.885 0-3.651-.524-5.157-1.432l-.36-.215-3.742.979.999-3.648-.235-.374A9.96 9.96 0 0 1 2 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z"/></svg>
                    تأكيد الحجز وإشعار الحلاق
                  </>)}
                </button>
                <button type="button" onClick={() => setBookingOpen(false)} className="w-full rounded-xl px-6 py-2.5 text-sm font-medium t-muted transition-all duration-200 hover:text-white/85" style={{ background: 'transparent' }}>إلغاء</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
