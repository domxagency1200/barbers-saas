'use client'

import { useState } from 'react'

export default function PricingCalculator({ salonCount }: { salonCount: number }) {
  const [price, setPrice] = useState(399)
  const revenue = salonCount * price

  return (
    <div className="rounded-2xl border border-white/10 p-6 space-y-5" style={{ backgroundColor: '#242424' }}>
      <h2 className="text-base font-bold text-white">حاسبة الإيراد المتوقع</h2>

      <div className="flex flex-wrap items-end gap-4">
        <label className="space-y-1.5">
          <span className="text-xs text-gray-400">السعر لكل صالون (ر.س)</span>
          <input
            type="number"
            min={0}
            value={price}
            onChange={e => setPrice(Number(e.target.value) || 0)}
            className="block w-32 rounded-xl border border-white/10 bg-[#1a1a1a] px-3 py-2 text-sm text-white focus:border-[#D4A843]/60 focus:outline-none"
          />
        </label>

        <div className="flex items-center gap-3 pb-2 text-sm text-gray-400">
          <span className="text-white font-semibold">{salonCount}</span>
          <span>صالون</span>
          <span>×</span>
          <span className="text-white font-semibold">{price}</span>
          <span>ر.س</span>
          <span>=</span>
          <span className="text-2xl font-extrabold" style={{ color: '#D4A843' }}>
            {revenue.toLocaleString('ar-SA')}
          </span>
          <span>ر.س / شهر</span>
        </div>
      </div>
    </div>
  )
}
