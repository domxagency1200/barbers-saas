import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function adminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ salonId: string }> }
) {
  try {
    const { salonId } = await params
    const { email, password } = await req.json()

    if (!email || !password) {
      return NextResponse.json({ error: 'البريد وكلمة المرور مطلوبان' }, { status: 400 })
    }

    const supabase = adminClient()

    // 1. Create new auth user
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    })
    if (authError) return NextResponse.json({ error: authError.message }, { status: 500 })

    const newUserId = authData.user.id

    // 2. Get current owner
    const { data: currentOwner } = await supabase
      .from('salon_members')
      .select('user_id')
      .eq('salon_id', salonId)
      .eq('role', 'owner')
      .single()

    // 3. Insert new owner
    const { error: insertError } = await supabase
      .from('salon_members')
      .insert({ salon_id: salonId, user_id: newUserId, role: 'owner' })

    if (insertError) {
      await supabase.auth.admin.deleteUser(newUserId)
      return NextResponse.json({ error: insertError.message }, { status: 500 })
    }

    // 4. Delete old owner
    if (currentOwner?.user_id) {
      await supabase
        .from('salon_members')
        .delete()
        .eq('salon_id', salonId)
        .eq('user_id', currentOwner.user_id)
        .eq('role', 'owner')
    }

    return NextResponse.json({ ok: true })
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? 'Internal server error' }, { status: 500 })
  }
}
