import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'

function adminClient() {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ salonId: string }> }
) {
  try {
    const { salonId } = await params
    const { name, city, plan, slug } = await req.json()
    const supabase = await createClient()
    const update: Record<string, unknown> = { name, city: city || null, plan: plan || null }
    if (slug) update.slug = slug.trim().toLowerCase()
    const { error } = await supabase
      .from('salons')
      .update(update)
      .eq('id', salonId)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true })
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ salonId: string }> }
) {
  try {
    const { salonId } = await params
    const body = await req.json()
    const is_active: boolean = body.is_active

    const supabase = await createClient()

    const { data, error } = await supabase
      .from('salons')
      .update({ is_active })
      .eq('id', salonId)
      .select('id, is_active')
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true, data })
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ salonId: string }> }
) {
  const { salonId } = await params
  const { email, password } = await req.json()

  if (email !== 'admin@salony.com' || !password) {
    return NextResponse.json({ error: 'بيانات المشرف غير صحيحة' }, { status: 403 })
  }

  const supabase = adminClient()

  // Delete related data in order
  await supabase.from('bookings').delete().eq('salon_id', salonId)
  await supabase.from('services').delete().eq('salon_id', salonId)
  await supabase.from('barbers').delete().eq('salon_id', salonId)
  await supabase.from('salon_members').delete().eq('salon_id', salonId)

  const { error } = await supabase.from('salons').delete().eq('id', salonId)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ ok: true })
}
