'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import type { User } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'

export default function ProfilePage() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    void supabase.auth.getUser().then(({ data: { user: u } }) => {
      setUser(u ?? null)
      setLoading(false)
    })
  }, [])

  if (loading) {
    return <p className="text-center mt-20 text-gray-600">Loading...</p>
  }

  if (!user) {
    return (
      <main className="max-w-md mx-auto px-4 py-10">
        <h1 className="text-2xl font-bold mb-4">Profile</h1>
        <p className="text-gray-600 mb-4">Log in to view your account.</p>
        <Link href="/login" className="inline-block bg-black text-white px-6 py-3 rounded-lg font-medium hover:bg-gray-800">
          Log in
        </Link>
      </main>
    )
  }

  return (
    <main className="max-w-md mx-auto px-4 py-10">
      <h1 className="text-2xl font-bold mb-6">Profile</h1>
      <div className="rounded-lg border border-gray-200 bg-white p-4 space-y-4">
        {(user.user_metadata?.full_name as string | undefined) && (
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Name</p>
            <p className="mt-1 text-gray-900">{String(user.user_metadata.full_name)}</p>
          </div>
        )}
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Email</p>
          <p className="mt-1 text-gray-900">{user.email}</p>
        </div>
      </div>
      <Link href="/dashboard" className="mt-6 inline-block text-sm text-blue-600 underline hover:text-blue-800">
        Go to dashboard
      </Link>
    </main>
  )
}
