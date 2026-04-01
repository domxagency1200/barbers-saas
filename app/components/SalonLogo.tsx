const sizeMap = {
  sm: { circle: 'h-8 w-8 text-sm', img: 'h-8 w-8' },
  md: { circle: 'h-12 w-12 text-lg', img: 'h-12 w-12' },
  lg: { circle: 'h-16 w-16 text-2xl', img: 'h-16 w-16' },
}

interface SalonLogoProps {
  logo_url?: string | null
  use_auto_logo?: boolean | null
  logo_letter?: string | null
  card_theme?: string | null
  custom_color?: string | null
  size?: 'sm' | 'md' | 'lg'
}

export default function SalonLogo({ logo_url, logo_letter, size = 'md' }: SalonLogoProps) {
  const { circle, img } = sizeMap[size]

  if (logo_url) {
    return <img src={logo_url} alt="logo" className={`${img} object-cover`} style={{ borderRadius: 8, background: 'transparent', filter: 'brightness(0) saturate(100%) invert(72%) sepia(35%) saturate(500%) hue-rotate(5deg)', opacity: 0.9 }} />
  }

  return (
    <div
      className={`${circle} inline-flex items-center justify-center rounded-full font-extrabold flex-shrink-0`}
      style={{ background: 'rgba(255,255,255,0.1)', borderRadius: '50%', border: '1px solid rgba(255,255,255,0.3)', boxShadow: '0 0 15px rgba(212,175,55,0.2)' }}
    >
      <span style={{ color: '#D4AF37', fontWeight: 600 }}>{logo_letter ?? ''}</span>
    </div>
  )
}
