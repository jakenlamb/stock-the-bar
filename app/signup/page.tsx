'use client'

import { useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function SignupPage() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  /** Set when sign-up succeeded but there is no session yet (e.g. email confirmation required). */
  const [awaitingEmail, setAwaitingEmail] = useState(false)

  const handleSignup = async () => {
    setLoading(true)
    setError('')
    setAwaitingEmail(false)

    const trimmedName = name.trim()
    if (!trimmedName || !email.trim() || !password) {
      setError('Please fill in name, email, and password.')
      setLoading(false)
      return
    }

    const { data, error: authError } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        data: { full_name: trimmedName },
      },
    })

    if (authError) {
      setError(authError.message)
      setLoading(false)
      return
    }

    // With "Confirm email" enabled, Supabase usually returns user but no session until they click the link.
    if (!data.session) {
      setAwaitingEmail(true)
      setLoading(false)
      return
    }

    router.push('/dashboard')
    router.refresh()
  }

  if (awaitingEmail) {
    return (
      <main className="max-w-md mx-auto px-4 py-10">
        <h1 className="text-2xl font-bold mb-4">Check your email</h1>
        <p className="text-gray-600 text-sm mb-6">
          We sent a confirmation link to <span className="font-medium text-gray-900">{email.trim()}</span>.
          Open it to verify your account, then you can{' '}
          <Link href="/login" className="text-blue-600 underline hover:text-blue-800">
            log in
          </Link>
          .
        </p>
      </main>
    )
  }

  return (
    <main className="max-w-md mx-auto px-4 py-10">
      <h1 className="text-2xl font-bold mb-6">Create your account</h1>
      <p className="text-gray-600 text-sm mb-6">
        After signing up you can create one or more registries from your dashboard.
      </p>
      <div className="flex flex-col gap-4">
        <input
          className="border rounded-lg p-3"
          placeholder="Your name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          autoComplete="name"
        />
        <input
          className="border rounded-lg p-3"
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="email"
        />
        <input
          className="border rounded-lg p-3"
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="new-password"
        />
        {error && <p className="text-red-500 text-sm">{error}</p>}
        <button
          type="button"
          onClick={handleSignup}
          disabled={loading}
          className="bg-black text-white py-3 rounded-lg font-medium hover:bg-gray-800 disabled:opacity-50"
        >
          {loading ? 'Creating account…' : 'Create account'}
        </button>
      </div>
    </main>
  )
}
