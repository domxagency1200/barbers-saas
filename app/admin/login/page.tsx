'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function AdminLoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (email === 'admin@halaqy.com') {
      localStorage.setItem('isAdmin', 'true')
      router.push('/admin')
    } else {
      setError('البريد الإلكتروني أو كلمة المرور غير صحيحة')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#1a1a1a] p-4">
      <div className="w-full max-w-sm rounded-2xl border border-white/10 p-8 space-y-6" style={{ backgroundColor: '#242424' }}>
        <h1 className="text-xl font-bold text-white text-center">تسجيل دخول المشرف</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <label className="block space-y-1.5">
            <span className="text-sm text-gray-400">البريد الإلكتروني</span>
            <input
              type="email"
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-[#1a1a1a] px-4 py-2.5 text-sm text-white placeholder:text-gray-600 focus:border-[#D4A843]/60 focus:outline-none"
              placeholder="admin@halaqy.com"
            />
          </label>
          <label className="block space-y-1.5">
            <span className="text-sm text-gray-400">كلمة المرور</span>
            <input
              type="password"
              required
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-[#1a1a1a] px-4 py-2.5 text-sm text-white placeholder:text-gray-600 focus:border-[#D4A843]/60 focus:outline-none"
              placeholder="••••••••"
            />
          </label>
          {error && <p className="text-xs text-red-400">{error}</p>}
          <button
            type="submit"
            className="w-full rounded-xl py-2.5 text-sm font-bold text-black"
            style={{ backgroundColor: '#D4A843' }}
          >
            دخول
          </button>
        </form>
      </div>
    </div>
  )
}
