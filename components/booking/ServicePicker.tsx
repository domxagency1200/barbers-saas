'use client'

import { useState } from 'react'

interface Service {
  id: string
  name_ar: string
  name_en: string
  price: number
  duration_min: number
}

interface ServicePickerProps {
  services: Service[]
  onSelect?: (services: Service[]) => void
}

export default function ServicePicker({ services, onSelect }: ServicePickerProps) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  function toggle(service: Service) {
    const next = new Set(selectedIds)
    if (next.has(service.id)) next.delete(service.id)
    else next.add(service.id)
    setSelectedIds(next)
    onSelect?.(services.filter((s) => next.has(s.id)))
  }

  const selectedServices = services.filter((s) => selectedIds.has(s.id))
  const totalPrice = selectedServices.reduce((sum, s) => sum + s.price, 0)
  const totalDuration = selectedServices.reduce((sum, s) => sum + s.duration_min, 0)

  return (
    <div className="space-y-3">
      <ul className="space-y-3">
        {services.map((service) => {
          const selected = selectedIds.has(service.id)
          return (
            <li key={service.id}>
              <button
                type="button"
                onClick={() => toggle(service)}
                className={`w-full text-left rounded-xl border px-5 py-4 flex items-center justify-between transition-all shadow-sm ${
                  selected
                    ? 'border-black bg-black text-white shadow-md'
                    : 'border-gray-200 bg-white text-gray-900 hover:shadow-md'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className={`w-5 h-5 rounded border flex items-center justify-center flex-shrink-0 ${
                    selected ? 'border-white bg-white' : 'border-gray-300'
                  }`}>
                    {selected && <span className="text-black text-xs font-bold">✓</span>}
                  </span>
                  <div>
                    <p className="font-medium">{service.name_ar}</p>
                    <p className={`text-sm mt-0.5 ${selected ? 'text-gray-300' : 'text-gray-400'}`}>
                      {service.duration_min} min
                    </p>
                  </div>
                </div>
                <p className="font-semibold text-base">
                  ر.س {service.price}
                </p>
              </button>
            </li>
          )
        })}
      </ul>

      {selectedIds.size > 0 && (
        <div className="rounded-xl border border-gray-200 bg-white px-5 py-3 flex justify-between text-sm shadow-sm">
          <span className="text-gray-500">{totalDuration} min total</span>
          <span className="font-semibold text-gray-900">ر.س {totalPrice} total</span>
        </div>
      )}
    </div>
  )
}
