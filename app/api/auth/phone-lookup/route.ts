import { NextRequest, NextResponse } from 'next/server'
import { createClient as createAdmin } from '@supabase/supabase-js'
import { createClient as createServerClient } from '@/lib/supabase/server'

function adminClient() {
  return createAdmin(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

function normalizePhone(raw: string): string {
  let p = raw.trim().replace(/\s+/g, '')
  if (p.startsWith('+966')) p = '0' + p.slice(4)
  if (p.startsWith('966')) p = '0' + p.slice(3)
  return p
}

export async function POST(req: NextRequest) {
  const { phone, password } = await req.json()
  if (!phone || !password) {
    return NextResponse.json({ error: 'رقم الجوال وكلمة المرور مطلوبان' }, { status: 400 })
  }

  const normalized = normalizePhone(phone)
  const supabase = adminClient()

  // 1. Find salon by whatsapp_number
  const { data: salon } = await supabase
    .from('salons')
    .select('id')
    .eq('whatsapp_number', normalized)
    .single()

  if (!salon) {
    return NextResponse.json({ error: 'رقم الجوال أو كلمة المرور غير صحيحة' }, { status: 401 })
  }

  // 2. Get user_id from salon_members
  const { data: member } = await supabase
    .from('salon_members')
    .select('user_id')
    .eq('salon_id', salon.id)
    .eq('role', 'owner')
    .single()

  if (!member) {
    return NextResponse.json({ error: 'رقم الجوال أو كلمة المرور غير صحيحة' }, { status: 401 })
  }

  // 3. Get email (stays on server only)
  const { data: userData } = await supabase.auth.admin.getUserById(member.user_id)
  const email = userData?.user?.email
  if (!email) {
    return NextResponse.json({ error: 'رقم الجوال أو كلمة المرور غير صحيحة' }, { status: 401 })
  }

  // 4. Sign in server-side and set cookies
  const serverSupabase = await createServerClient()
  const { error: authError } = await serverSupabase.auth.signInWithPassword({ email, password })

  if (authError) {
    return NextResponse.json({ error: 'رقم الجوال أو كلمة المرور غير صحيحة' }, { status: 401 })
  }

  return NextResponse.json({ ok: true })
}
