'use client'

import { useState } from 'react'

interface Barber {
  id: string
  name: string
}

interface BarberPickerProps {
  barbers: Barber[]
  onSelect?: (barber: Barber) => void
}

export default function BarberPicker({ barbers, onSelect }: BarberPickerProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null)

  function handleSelect(barber: Barber) {
    setSelectedId(barber.id)
    onSelect?.(barber)
  }

  return (
    <ul className="space-y-3">
      {barbers.map((barber) => {
        const selected = selectedId === barber.id
        return (
          <li key={barber.id}>
            <button
              type="button"
              onClick={() => handleSelect(barber)}
              className={`w-full text-left rounded-xl border px-5 py-4 transition-all shadow-sm ${
                selected
                  ? 'border-black bg-black text-white shadow-md'
                  : 'border-gray-200 bg-white text-gray-900 hover:shadow-md'
              }`}
            >
              <p className="font-medium">{barber.name}</p>
            </button>
          </li>
        )
      })}
    </ul>
  )
}
