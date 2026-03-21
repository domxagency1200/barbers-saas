import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import NewDashboardClient from '@/components/dashboard/NewDashboardClient'

export default async function NewDashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/dashboard/login')

  const { data: member } = await supabase
    .from('salon_members')
    .select('salon_id')
    .eq('user_id', user.id)
    .single()

  const salonId = member?.salon_id

  const now = new Date()
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0).toISOString()
  const todayEnd   = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 0).toISOString()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
  const monthEnd   = new Date(now.getFullYear(), now.getMonth() + 1, 1).toISOString()

  const bookingSelect = 'id, starts_at, ends_at, status, customers(name, phone), barbers(name), services(name_ar, price)'

  let todayQ = supabase
    .from('bookings')
    .select(bookingSelect)
    .gte('starts_at', todayStart)
    .lt('starts_at', todayEnd)
    .order('starts_at', { ascending: true })

  let monthQ = supabase
    .from('bookings')
    .select(bookingSelect)
    .gte('starts_at', monthStart)
    .lt('starts_at', monthEnd)
    .order('starts_at', { ascending: true })

  if (salonId) {
    todayQ = todayQ.eq('salon_id', salonId)
    monthQ = monthQ.eq('salon_id', salonId)
  }

  const [
    { data: todayBookings },
    { data: monthBookings },
  ] = await Promise.all([todayQ, monthQ])

  return (
    <NewDashboardClient
      todayBookings={todayBookings ?? []}
      monthBookings={monthBookings ?? []}
    />
  )
}
