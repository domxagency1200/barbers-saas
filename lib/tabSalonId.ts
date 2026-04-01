const KEY = 'tab_salon_id'

export function getTabSalonId(): string | null {
  if (typeof window === 'undefined') return null
  return sessionStorage.getItem(KEY)
}

export function setTabSalonId(salonId: string): void {
  if (typeof window === 'undefined') return
  sessionStorage.setItem(KEY, salonId)
}
