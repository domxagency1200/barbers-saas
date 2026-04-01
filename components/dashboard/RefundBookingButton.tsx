'use client'

import { useState } from 'react'

export default function RefundBookingButton({ onRefund }: { onRefund: () => Promise<void> }) {
  const [confirming, setConfirming] = useState(false)
  const [loading, setLoading] = useState(false)

  if (confirming) return (
    <div className="flex items-center gap-1">
      <button
        onClick={async () => { setLoading(true); await onRefund(); setLoading(false); setConfirming(false) }}
        disabled={loading}
        className="text-xs px-2 py-0.5 rounded-full font-medium"
        style={{ backgroundColor: 'rgba(59,130,246,0.15)', color: '#60a5fa', border: '1px solid rgba(59,130,246,0.3)' }}
      >
        {loading ? '...' : 'تأكيد'}
      </button>
      <button
        onClick={() => setConfirming(false)}
        className="text-xs px-2 py-0.5 rounded-full font-medium"
        style={{ backgroundColor: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.4)', border: '1px solid rgba(255,255,255,0.08)' }}
      >
        إلغاء
      </button>
    </div>
  )

  return (
    <button
      onClick={() => setConfirming(true)}
      className="text-xs px-2 py-0.5 rounded-full font-medium transition-all"
      style={{ backgroundColor: 'rgba(59,130,246,0.1)', color: '#93c5fd', border: '1px solid rgba(59,130,246,0.2)' }}
    >
      استرداد
    </button>
  )
}
