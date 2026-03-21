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
    .select('id, name, slug, city, plan, created_at')
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(req: NextRequest) {
  const { name, slug, city, email, password } = await req.json()

  if (!name || !slug || !email || !password) {
    return NextResponse.json({ error: 'جميع الحقول مطلوبة' }, { status: 400 })
  }

  const supabase = adminClient()

  // 1. Create salon
  const { data: salon, error: salonError } = await supabase
    .from('salons')
    .insert({ name, slug, city: city || null })
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

  return NextResponse.json({ id: salon.id }, { status: 201 })
}
