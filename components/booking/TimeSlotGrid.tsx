'use client'

import { useEffect, useState } from 'react'

interface TimeSlotGridProps {
  barber_id: string
  date: string
  totalDuration: number
  onSelect?: (slot: string) => void
}

export default function TimeSlotGrid({ barber_id, date, totalDuration, onSelect }: TimeSlotGridProps) {
  const ALL_SLOTS: string[] = []
  for (let h = 9; h < 21; h++) {
    for (const m of [0, 30]) {
      ALL_SLOTS.push(`${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`)
    }
  }

  const [availableSet, setAvailableSet] = useState<Set<string>>(new Set())
  const [selected, setSelected] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!barber_id || !date || !totalDuration) return

    setLoading(true)
    setError(null)
    setSelected(null)

    const utcOffset = -new Date().getTimezoneOffset()
    fetch(`/api/availability?barber_id=${barber_id}&date=${date}&duration=${totalDuration}&utcOffset=${utcOffset}`)
      .then((r) => r.json())
      .then((data) => setAvailableSet(new Set(data.slots ?? [])))
      .catch(() => setError('Failed to load slots.'))
      .finally(() => setLoading(false))
  }, [barber_id, date, totalDuration])

  function handleSelect(slot: string) {
    setSelected(slot)
    onSelect?.(slot)
  }

  function to12h(slot: string): string {
    const [h, m] = slot.split(':').map(Number)
    const period = h >= 12 ? 'PM' : 'AM'
    const hour = h % 12 || 12
    return `${hour}:${m.toString().padStart(2, '0')} ${period}`
  }

  if (loading) return <p className="text-sm text-gray-400">Loading available times...</p>
  if (error) return <p className="text-sm text-red-500">{error}</p>

  return (
    <div className="grid grid-cols-4 gap-2 sm:grid-cols-6">
      {ALL_SLOTS.map((slot) => {
        const isAvailable = availableSet.has(slot)
        const isSelected = selected === slot
        return (
          <button
            key={slot}
            type="button"
            disabled={!isAvailable}
            onClick={() => { if (isAvailable) handleSelect(slot) }}
            className={`rounded-lg border px-3 py-2 text-sm font-medium transition-all ${
              !isAvailable
                ? 'border-gray-100 bg-gray-100 text-gray-300 opacity-50 cursor-not-allowed pointer-events-none'
                : isSelected
                ? 'border-black bg-black text-white shadow-md'
                : 'border-gray-200 bg-white text-gray-900 hover:shadow-md'
            }`}
          >
            {to12h(slot)}
          </button>
        )
      })}
    </div>
  )
}
