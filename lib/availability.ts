export function generateSlots(openAt: string, closeAt: string, duration: number = 30): string[] {
  const slots: string[] = []

  const [openH, openM] = openAt.split(':').map(Number)
  const [closeH, closeM] = closeAt.split(':').map(Number)

  let current = openH * 60 + openM
  let end = closeH * 60 + closeM

  // Handle past-midnight close time (e.g. open 07:00, close 01:00 next day)
  if (end <= current) end += 24 * 60

  while (current + duration <= end) {
    const h = (Math.floor(current / 60) % 24).toString().padStart(2, '0')
    const m = (current % 60).toString().padStart(2, '0')
    slots.push(`${h}:${m}`)
    current += 30
  }

  return slots
}

export function filterAvailableSlots(
  slots: string[],
  bookings: { starts_at: string; ends_at: string }[],
  duration: number = 30
): string[] {
  return slots.filter((slot) => {
    const [h, m] = slot.split(':').map(Number)
    const slotStart = h * 60 + m
    const slotEnd = slotStart + duration

    return !bookings.some((b) => {
      const bStart = timeToMinutes(b.starts_at)
      const bEnd = timeToMinutes(b.ends_at)
      return bStart < slotEnd && bEnd > slotStart
    })
  })
}

function timeToMinutes(isoOrTime: string): number {
  // handles both ISO timestamp and HH:MM
  const timePart = isoOrTime.includes('T')
    ? isoOrTime.split('T')[1].slice(0, 5)
    : isoOrTime.slice(0, 5)
  const [h, m] = timePart.split(':').map(Number)
  return h * 60 + m
}
