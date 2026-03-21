'use client'

import { useState } from 'react'
import ServicePicker from './ServicePicker'
import BarberPicker from './BarberPicker'
import TimeSlotGrid from './TimeSlotGrid'

interface Service {
  id: string
  name_ar: string
  name_en: string
  price: number
  duration_min: number
}

interface Barber {
  id: string
  name: string
}

interface BookingFlowProps {
  salonId: string
  services: Service[]
  barbers: Barber[]
}

export default function BookingFlow({ salonId, services, barbers }: BookingFlowProps) {
  const [open, setOpen] = useState(false)
  const [selectedServices, setSelectedServices] = useState<Service[]>([])
  const [selectedBarber, setSelectedBarber] = useState<Barber | null>(null)
  const [selectedDate, setSelectedDate] = useState<string>('')
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null)
  const [customerName, setCustomerName] = useState('')
  const [customerPhone, setCustomerPhone] = useState('05')
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const totalDuration = selectedServices.reduce((sum, s) => sum + s.duration_min, 0)
  const totalPrice = selectedServices.reduce((sum, s) => sum + s.price, 0)

  async function handleConfirm() {
    if (!selectedServices.length || !selectedBarber || !selectedDate || !selectedSlot || !customerName || !customerPhone) {
      setError('Please complete all steps before confirming.')
      return
    }

    if (!/^05\d{8}$/.test(customerPhone)) {
      setError('Phone number must start with 05 and be exactly 10 digits.')
      return
    }

    const starts = new Date(`${selectedDate}T${selectedSlot}:00`)
    const ends = new Date(starts.getTime() + totalDuration * 60000)

    setSubmitting(true)
    setError(null)

    try {
      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          salon_id: salonId,
          barber_id: selectedBarber.id,
          service_id: selectedServices[0].id,
          customer_name: customerName,
          customer_phone: customerPhone,
          starts_at: starts.toISOString(),
          ends_at: ends.toISOString(),
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error ?? 'Booking failed.')
      }

      setSuccess(true)
      setTimeout(() => {
        setOpen(false)
        setSuccess(false)
        setSelectedServices([])
        setSelectedBarber(null)
        setSelectedDate('')
        setSelectedSlot(null)
        setCustomerName('')
        setCustomerPhone('05')
        setError(null)
      }, 2000)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  const modalContent = success ? (
    <div className="bg-white rounded-xl border border-gray-200 px-6 py-10 text-center shadow-sm">
      <p className="text-2xl font-bold text-gray-900 mb-2">Booking confirmed!</p>
      <p className="text-gray-500 text-sm">We'll see you on {selectedDate} at {selectedSlot}.</p>
    </div>
  ) : (
    <div className="space-y-8">
      {/* Step 1: Services */}
      <section>
        <h2 className="text-lg font-semibold text-gray-700 mb-4">1. Choose services</h2>
        <ServicePicker services={services} onSelect={(s) => { setSelectedServices(s); setSelectedSlot(null) }} />
      </section>

      {/* Step 2: Barber */}
      <section>
        <h2 className="text-lg font-semibold text-gray-700 mb-4">2. Choose a barber</h2>
        <BarberPicker barbers={barbers} onSelect={(b) => { setSelectedBarber(b); setSelectedSlot(null) }} />
      </section>

      {/* Step 3: Date */}
      <section>
        <h2 className="text-lg font-semibold text-gray-700 mb-4">3. Choose a date</h2>
        <input
          type="date"
          value={selectedDate}
          min={new Date().toISOString().split('T')[0]}
          onChange={(e) => { setSelectedDate(e.target.value); setSelectedSlot(null) }}
          className="rounded-lg border border-gray-200 px-4 py-2 text-sm text-gray-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-black"
        />
      </section>

      {/* Step 4: Time slot — only show when services + barber + date selected */}
      {selectedServices.length > 0 && selectedBarber && selectedDate && (
        <section>
          <h2 className="text-lg font-semibold text-gray-700 mb-4">4. Choose a time</h2>
          <TimeSlotGrid
            barber_id={selectedBarber.id}
            date={selectedDate}
            totalDuration={totalDuration}
            onSelect={setSelectedSlot}
          />
        </section>
      )}

      {/* Step 5: Details */}
      {selectedSlot && (
        <section>
          <h2 className="text-lg font-semibold text-gray-700 mb-4">5. Your details</h2>
          <div className="space-y-3">
            <input
              type="text"
              placeholder="Full name"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              className="w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm text-gray-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-black"
            />
            <input
              type="tel"
              placeholder="05XXXXXXXX"
              value={customerPhone}
              onChange={(e) => {
                const digits = e.target.value.replace(/\D/g, '')
                const enforced = digits.startsWith('05') ? digits : '05' + digits.replace(/^0*5?/, '')
                setCustomerPhone(enforced.slice(0, 10))
              }}
              onKeyDown={(e) => {
                if (customerPhone.length <= 2 && (e.key === 'Backspace' || e.key === 'Delete')) e.preventDefault()
              }}
              className="w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm text-gray-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-black"
            />
          </div>
        </section>
      )}

      {/* Summary + Confirm */}
      {selectedSlot && (
        <section className="bg-white rounded-xl border border-gray-200 px-5 py-5 shadow-sm space-y-3">
          <h2 className="text-lg font-semibold text-gray-700">Summary</h2>
          <div className="text-sm text-gray-600 space-y-1">
            <p><span className="font-medium">Services:</span> {selectedServices.map(s => s.name_ar).join(', ')}</p>
            <p><span className="font-medium">Duration:</span> {totalDuration} min</p>
            {selectedBarber && <p><span className="font-medium">Barber:</span> {selectedBarber.name}</p>}
            <p><span className="font-medium">Date:</span> {selectedDate} at {selectedSlot}</p>
            <p><span className="font-medium">Total:</span> ر.س {totalPrice}</p>
          </div>

          {error && <p className="text-sm text-red-500">{error}</p>}

          <button
            type="button"
            onClick={handleConfirm}
            disabled={submitting}
            className="w-full rounded-lg bg-black text-white py-3 text-sm font-semibold hover:bg-gray-800 transition-colors disabled:opacity-50"
          >
            {submitting ? 'Confirming...' : 'Confirm booking'}
          </button>
        </section>
      )}
    </div>
  )

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-lg bg-black text-white px-6 py-3 text-sm font-semibold hover:bg-gray-800 transition-colors"
      >
        Book Now
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 overflow-y-auto py-8">
          <div className="relative bg-gray-50 rounded-xl w-full max-w-2xl mx-4 p-6">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 text-xl font-bold leading-none"
            >
              ✕
            </button>
            {modalContent}
          </div>
        </div>
      )}
    </>
  )
}
