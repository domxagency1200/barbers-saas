import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  const body = await req.json()

  const { barber_id, service_id, customer_name, customer_phone, starts_at, ends_at, salon_id } = body

  if (!barber_id || !service_id || !customer_name || !customer_phone || !starts_at || !ends_at || !salon_id) {
    return NextResponse.json({ error: 'All fields are required' }, { status: 400 })
  }

  const supabase = await createClient()

  const { data: customer, error: customerError } = await supabase
    .from('customers')
    .upsert({ name: customer_name, phone: customer_phone }, { onConflict: 'phone' })
    .select('id')
    .single()

  if (customerError) {
    return NextResponse.json({ error: customerError.message }, { status: 500 })
  }

  const { data, error } = await supabase
    .from('bookings')
    .insert({
      barber_id,
      service_id,
      customer_id: customer.id,
      starts_at,
      ends_at,
      salon_id,
      status: 'pending',
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data, { status: 201 })
}
