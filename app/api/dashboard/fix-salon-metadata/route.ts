import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: member } = await supabase
    .from('salon_members')
    .select('salon_id')
    .eq('user_id', user.id)
    .single()

  if (!member?.salon_id) {
    return NextResponse.json({ error: 'No salon found' }, { status: 404 })
  }

  return NextResponse.json({ salon_id: member.salon_id })
}
