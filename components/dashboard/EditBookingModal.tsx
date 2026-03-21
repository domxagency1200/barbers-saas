'use client'

import { useState, useTransition } from 'react'

interface Props {
  bookingId: string
  barberId: string
  date: string
  durationMin: number
  currentStartsAt: string
  onReschedule: (bookingId: string, newStartsAt: string, newEndsAt: string) => Promise<void>
}

function toLocalSlot(isoUtc: string): string {
  const ms = new Date(isoUtc).getTime() + 3 * 60 * 60 * 1000 // UTC+3
  const d = new Date(ms)
  return `${String(d.getUTCHours()).padStart(2, '0')}:${String(d.getUTCMinutes()).padStart(2, '0')}`
}

export default function EditBookingModal({
  bookingId, barberId, date, durationMin, currentStartsAt, onReschedule,
}: Props) {
  const [open, setOpen] = useState(false)
  const [slots, setSlots] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [selected, setSelected] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  const currentSlot = toLocalSlot(currentStartsAt)

  async function openModal() {
    setOpen(true)
    setSelected(null)
    setLoading(true)
    try {
      const res = await fetch(
        `/api/availability?barber_id=${barberId}&date=${date}&duration=${durationMin}&utcOffset=180`
      )
      const json = await res.json()
      const fetched: string[] = json.slots ?? []
      // Re-add the current booking's slot (blocked by itself)
      if (!fetched.includes(currentSlot)) {
        fetched.push(currentSlot)
        fetched.sort()
      }
      setSlots(fetched)
    } finally {
      setLoading(false)
    }
  }

  function handleSave() {
    if (!selected) return
    const newStartsAt = new Date(`${date}T${selected}:00+03:00`).toISOString()
    const newEndsAt = new Date(new Date(newStartsAt).getTime() + durationMin * 60 * 1000).toISOString()
    startTransition(async () => {
      await onReschedule(bookingId, newStartsAt, newEndsAt)
      setOpen(false)
    })
  }

  return (
    <>
      <button
        onClick={openModal}
        className="text-xs px-2 py-0.5 rounded-full font-medium bg-blue-900/40 text-blue-400"
      >
        تعديل
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backgroundColor: 'rgba(0,0,0,0.75)' }}
          onClick={e => { if (e.target === e.currentTarget) setOpen(false) }}
        >
          <div
            className="w-full max-w-sm rounded-2xl border border-white/10 p-5 space-y-4"
            style={{ backgroundColor: '#242424' }}
          >
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-white">اختر موعداً جديداً</h2>
              <button onClick={() => setOpen(false)} className="text-gray-500 hover:text-white text-xl leading-none">×</button>
            </div>

            {loading ? (
              <p className="text-center text-gray-500 text-sm py-6">جاري التحميل...</p>
            ) : slots.length === 0 ? (
              <p className="text-center text-gray-500 text-sm py-6">لا توجد أوقات متاحة</p>
            ) : (
              <div className="grid grid-cols-4 gap-2 max-h-64 overflow-y-auto">
                {slots.map(slot => {
                  const isCurrent = slot === currentSlot
                  const isSelected = slot === selected
                  return (
                    <button
                      key={slot}
                      onClick={() => setSelected(slot)}
                      className="rounded-xl py-2 text-xs font-medium transition-colors border"
                      style={{
                        backgroundColor: isSelected ? '#D4A843' : '#1a1a1a',
                        color: isSelected ? '#1a1a1a' : isCurrent ? '#D4A843' : '#9ca3af',
                        borderColor: isCurrent && !isSelected ? '#D4A843' : 'transparent',
                      }}
                    >
                      {slot}
                    </button>
                  )
                })}
              </div>
            )}

            <div className="flex gap-2 pt-1">
              <button
                onClick={() => setOpen(false)}
                className="flex-1 rounded-xl py-2 text-sm text-gray-400 border border-white/10"
                style={{ backgroundColor: '#1a1a1a' }}
              >
                إلغاء
              </button>
              <button
                onClick={handleSave}
                disabled={!selected || pending}
                className="flex-1 rounded-xl py-2 text-sm font-semibold disabled:opacity-40"
                style={{ backgroundColor: '#D4A843', color: '#1a1a1a' }}
              >
                {pending ? '...' : 'حفظ'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
