'use client'

import { useRouter, usePathname } from 'next/navigation'

export default function DatePicker({ value }: { value: string }) {
  const router = useRouter()
  const pathname = usePathname()

  return (
    <input
      type="date"
      defaultValue={value}
      onChange={e => {
        if (e.target.value) router.push(`${pathname}?date=${e.target.value}`)
      }}
      className="rounded-xl border border-white/10 px-3 py-2 text-sm text-white bg-transparent focus:outline-none"
      style={{ colorScheme: 'dark' }}
    />
  )
}
