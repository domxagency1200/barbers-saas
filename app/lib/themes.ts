export const THEMES = {
  gold: {
    primary:    '#C9A55A',
    bg:         '#0a0a0c',
    bgAlt:      '#111108',
    cardBg:     'rgba(255,255,255,0.04)',
    text:       '#ffffff',
    textMuted:  'rgba(255,255,255,0.45)',
    border:     'rgba(201,165,90,0.22)',
  },
  white: {
    primary:    '#b8924a',
    bg:         '#f5f3ef',
    bgAlt:      '#ffffff',
    cardBg:     'rgba(0,0,0,0.05)',
    text:       '#1a1a1a',
    textMuted:  'rgba(26,26,26,0.55)',
    border:     'rgba(184,146,74,0.3)',
  },
  gray: {
    primary:    '#9CA3AF',
    bg:         '#141414',
    bgAlt:      '#1c1c1c',
    cardBg:     'rgba(255,255,255,0.05)',
    text:       '#f0f0f0',
    textMuted:  'rgba(240,240,240,0.45)',
    border:     'rgba(156,163,175,0.22)',
  },
  blue: {
    primary:    '#3B82F6',
    bg:         '#07101f',
    bgAlt:      '#0d1829',
    cardBg:     'rgba(59,130,246,0.07)',
    text:       '#f0f6ff',
    textMuted:  'rgba(240,246,255,0.45)',
    border:     'rgba(59,130,246,0.25)',
  },
  pink: {
    primary:    '#E879A0',
    bg:         '#15080f',
    bgAlt:      '#1e0e18',
    cardBg:     'rgba(232,121,160,0.07)',
    text:       '#fff0f5',
    textMuted:  'rgba(255,240,245,0.45)',
    border:     'rgba(232,121,160,0.25)',
  },
} as const

export type ThemeKey = keyof typeof THEMES
export type Theme = typeof THEMES[ThemeKey]
