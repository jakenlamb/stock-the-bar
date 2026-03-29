'use client'
import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function SignupPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [coupleName, setCoupleName] = useState('')
  const [weddingDate, setWeddingDate] = useState('')
  const [slug, setSlug] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSignup = async () => {
    setLoading(true)
    setError('')

    const { data: authData, error: authError } = await supabase.auth.signUp({ email, password })
    if (authError) { setError(authError.message); setLoading(false); return }

    const userId = authData.user?.id
    if (!userId) { setError('Signup failed.'); setLoading(false); return }

    const { error: registryError } = await supabase.from('registries').insert({
      owner_id: userId,
      couple_name: coupleName,
      wedding_date: weddingDate || null,
      slug: slug.toLowerCase().replace(/\s+/g, '-'),
    })

    if (registryError) { setError(registryError.message); setLoading(false); return }

    router.push('/dashboard')
  }

  return (
    <main className="max-w-md mx-auto mt-20 px-4">
      <h1 className="text-2xl font-bold mb-6">Create Your Registry</h1>
      <div className="flex flex-col gap-4">
        <input className="border rounded-lg p-3" placeholder="Your names (e.g. Mike & Sarah)" value={coupleName} onChange={e => setCoupleName(e.target.value)} />
        <input className="border rounded-lg p-3" placeholder="Registry URL slug (e.g. mike-and-sarah)" value={slug} onChange={e => setSlug(e.target.value)} />
        <input className="border rounded-lg p-3" type="date" value={weddingDate} onChange={e => setWeddingDate(e.target.value)} />
        <input className="border rounded-lg p-3" type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} />
        <input className="border rounded-lg p-3" type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} />
        {error && <p className="text-red-500 text-sm">{error}</p>}
        <button onClick={handleSignup} disabled={loading} className="bg-black text-white py-3 rounded-lg font-medium hover:bg-gray-800 disabled:opacity-50">
          {loading ? 'Creating...' : 'Create Registry'}
        </button>
      </div>
    </main>
  )
}
