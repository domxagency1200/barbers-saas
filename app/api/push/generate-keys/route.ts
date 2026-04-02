import { NextResponse } from 'next/server'
import webpush from 'web-push'

export async function GET() {
  const keys = webpush.generateVAPIDKeys()
  return NextResponse.json({
    NEXT_PUBLIC_VAPID_PUBLIC_KEY: keys.publicKey,
    VAPID_PRIVATE_KEY: keys.privateKey,
    note: 'Copy these to Vercel env vars, then re-subscribe on device',
  })
}
