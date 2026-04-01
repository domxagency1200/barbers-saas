import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createClient as createServerClient } from '@/lib/supabase/server'

function adminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

export async function GET() {
  const supabase = await createServerClient()
  const { data, error } = await supabase
    .from('salons')
    .select('id, name, slug, city, plan, is_active, created_at')
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(req: NextRequest) {
  const { name, slug, city, phone, password } = await req.json()

  if (!name || !slug || !phone || !password) {
    return NextResponse.json({ error: 'جميع الحقول مطلوبة' }, { status: 400 })
  }

  // Normalize phone
  let normalizedPhone = phone.trim().replace(/\s+/g, '')
  if (normalizedPhone.startsWith('+966')) normalizedPhone = '0' + normalizedPhone.slice(4)
  if (normalizedPhone.startsWith('966')) normalizedPhone = '0' + normalizedPhone.slice(3)

  // Generate internal email from phone (never exposed to user)
  const email = `${normalizedPhone}@qasaty.app`

  const supabase = adminClient()

  // 1. Create salon
  const { data: salon, error: salonError } = await supabase
    .from('salons')
    .insert({ name, slug, city: city || null, whatsapp_number: normalizedPhone })
    .select('id')
    .single()

  if (salonError) return NextResponse.json({ error: salonError.message }, { status: 500 })

  // 2. Create auth user
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  })

  if (authError) {
    await supabase.from('salons').delete().eq('id', salon.id)
    return NextResponse.json({ error: authError.message }, { status: 500 })
  }

  // 3. Link in salon_members
  const { error: memberError } = await supabase
    .from('salon_members')
    .insert({ salon_id: salon.id, user_id: authData.user.id, role: 'owner' })

  if (memberError) {
    await supabase.from('salons').delete().eq('id', salon.id)
    await supabase.auth.admin.deleteUser(authData.user.id)
    return NextResponse.json({ error: memberError.message }, { status: 500 })
  }

  // 4. Create default working hours
  await supabase
    .from('working_hours')
    .insert({ salon_id: salon.id, open_at: '08:00', close_at: '22:00' })

  return NextResponse.json({ id: salon.id }, { status: 201 })
}
