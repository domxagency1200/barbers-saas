import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import webpush from 'web-push'

function adminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

export async function GET() {
  const vapidPublic  = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? ''
  const vapidPrivate = process.env.VAPID_PRIVATE_KEY ?? ''
  const vapidEmail   = process.env.VAPID_EMAIL ?? ''
  const normalizeKey = (k: string) => k.replace(/\s/g, '').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '')
  const cleanPublic  = normalizeKey(vapidPublic)
  const cleanPrivate = normalizeKey(vapidPrivate)
  return NextResponse.json({
    email: vapidEmail ? vapidEmail.slice(0, 20) + '...' : 'NOT SET',
    publicKey:  cleanPublic  ? cleanPublic.slice(0, 20)  + `... (len:${cleanPublic.length})`  : 'NOT SET',
    privateKey: cleanPrivate ? cleanPrivate.slice(0, 10) + `... (len:${cleanPrivate.length})` : 'NOT SET',
    publicKeyValid:  /^[A-Za-z0-9\-_]+$/.test(cleanPublic),
    privateKeyValid: /^[A-Za-z0-9\-_]+$/.test(cleanPrivate),
  })
}

export async function POST(req: NextRequest) {
  try {
    const vapidEmail   = process.env.VAPID_EMAIL
    const vapidPublic  = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
    const vapidPrivate = process.env.VAPID_PRIVATE_KEY

    if (!vapidEmail || !vapidPublic || !vapidPrivate) {
      return NextResponse.json({
        error: 'missing env vars',
        has: { vapidEmail: !!vapidEmail, vapidPublic: !!vapidPublic, vapidPrivate: !!vapidPrivate },
      }, { status: 500 })
    }

    const subject = vapidEmail.startsWith('mailto:') || vapidEmail.startsWith('https://')
      ? vapidEmail
      : `mailto:${vapidEmail}`

    // Normalize to URL-safe base64 (no padding, - instead of +, _ instead of /)
    const normalizeKey = (k: string) => k.replace(/\s/g, '').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '')

    const cleanPublic  = normalizeKey(vapidPublic)
    const cleanPrivate = normalizeKey(vapidPrivate)

    // Debug: return key preview so we can verify format
    if (req.nextUrl.searchParams.get('debug') === '1') {
      return NextResponse.json({ cleanPublic: cleanPublic.slice(0, 20) + '...', len: cleanPublic.length })
    }

    webpush.setVapidDetails(subject, cleanPublic, cleanPrivate)

    const { salon_id, title, body } = await req.json()
    if (!salon_id) return NextResponse.json({ error: 'missing salon_id' }, { status: 400 })

    const supabase = adminClient()
    const { data: subs, error: dbErr } = await supabase
      .from('push_subscriptions')
      .select('endpoint, p256dh, auth')
      .eq('salon_id', salon_id)

    if (dbErr) return NextResponse.json({ error: 'db: ' + dbErr.message }, { status: 500 })
    if (!subs?.length) return NextResponse.json({ ok: true, sent: 0, note: 'no subscriptions found for this salon_id' })

    const payload = JSON.stringify({ title, body, url: '/dashboard/bookings' })

    const results = await Promise.allSettled(subs.map(s =>
      webpush.sendNotification(
        { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
        payload
      )
    ))

    const failed = results
      .filter(r => r.status === 'rejected')
      .map(r => (r as PromiseRejectedResult).reason?.message ?? String((r as PromiseRejectedResult).reason))

    return NextResponse.json({ ok: true, sent: subs.length, failed })

  } catch (err) {
    return NextResponse.json({ error: (err as Error).message ?? String(err) }, { status: 500 })
  }
}
