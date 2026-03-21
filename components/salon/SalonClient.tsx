'use client'

interface Barber {
  id: string
  name: string
}

interface Service {
  id: string
  name_ar: string
  price: number
  duration_min: number
}

interface Props {
  salon: {
    id: string
    name: string
    whatsapp_number: string | null
    city: string | null
  }
  barbers: Barber[]
  services: Service[]
}

export default function SalonClient({ salon, barbers, services }: Props) {
  return null
}
