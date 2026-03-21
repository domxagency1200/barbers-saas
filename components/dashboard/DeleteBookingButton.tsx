'use client'

import { useTransition } from 'react'

export default function DeleteBookingButton({ onDelete }: { onDelete: () => Promise<void> }) {
  const [pending, startTransition] = useTransition()

  function handleClick() {
    if (!confirm('هل أنت متأكد من حذف هذا الحجز؟')) return
    startTransition(() => onDelete())
  }

  return (
    <button
      onClick={handleClick}
      disabled={pending}
      className="text-xs px-2 py-0.5 rounded-full font-medium bg-red-900/40 text-red-400 disabled:opacity-50"
    >
      {pending ? '...' : 'حذف'}
    </button>
  )
}
