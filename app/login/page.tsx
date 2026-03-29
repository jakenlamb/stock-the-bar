'use client'
import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  const handleLogin = async () => {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) { setError(error.message); return }
    router.push('/dashboard')
  }

  return (
    <main className="max-w-md mx-auto mt-20 px-4">
      <h1 className="text-2xl font-bold mb-6">Log In</h1>
      <div className="flex flex-col gap-4">
        <input className="border rounded-lg p-3" type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} />
        <input className="border rounded-lg p-3" type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} />
        {error && <p className="text-red-500 text-sm">{error}</p>}
        <button onClick={handleLogin} className="bg-black text-white py-3 rounded-lg font-medium hover:bg-gray-800">
          Log In
        </button>
      </div>
    </main>
  )
}
