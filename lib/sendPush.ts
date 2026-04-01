import webpush from 'web-push'
import { createClient } from '@supabase/supabase-js'

export async function sendPushToSalon(salon_id: string, title: string, body: string) {
  webpush.setVapidDetails(
    process.env.VAPID_EMAIL!,
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? 'BNEgTj_n0t5fSrQGKtaQhHUi5lAhpiuoInXwWRsy8LWXOKcyh9kUxFKH23FbRtRi7ZCFYaCskHUtnePDnn1k0R4',
    process.env.VAPID_PRIVATE_KEY!,
  )

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )

  const { data: subs } = await supabase
    .from('push_subscriptions')
    .select('endpoint, p256dh, auth')
    .eq('salon_id', salon_id)

  if (!subs?.length) return

  const payload = JSON.stringify({ title, body, url: '/dashboard/bookings' })

  await Promise.allSettled(subs.map(s =>
    webpush.sendNotification(
      { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
      payload
    )
  ))
}
