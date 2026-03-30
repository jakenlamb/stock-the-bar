'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import type { Registry } from '@/lib/types'

function normalizeSlug(raw: string) {
  return raw
    .trim()
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

export default function DashboardPage() {
  const router = useRouter()
  const [registries, setRegistries] = useState<Registry[]>([])
  const [loading, setLoading] = useState(true)
  const [coupleName, setCoupleName] = useState('')
  const [slug, setSlug] = useState('')
  const [weddingDate, setWeddingDate] = useState('')
  const [createError, setCreateError] = useState('')
  const [creating, setCreating] = useState(false)

  const loadRegistries = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      setLoading(false)
      router.push('/login')
      return
    }

    const { data } = await supabase
      .from('registries')
      .select('*')
      .eq('owner_id', user.id)
      .order('created_at', { ascending: false })

    setRegistries(data || [])
    setLoading(false)
  }, [router])

  useEffect(() => {
    void loadRegistries()
  }, [loadRegistries])

  const handleCreateRegistry = async () => {
    setCreateError('')
    const name = coupleName.trim()
    const normalized = normalizeSlug(slug || name)
    if (!name) {
      setCreateError('Add a display name for this registry (e.g. couple or event name).')
      return
    }
    if (!normalized) {
      setCreateError('Add a URL slug (letters, numbers, and hyphens).')
      return
    }

    setCreating(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      setCreating(false)
      router.push('/login')
      return
    }

    const { data: created, error } = await supabase
      .from('registries')
      .insert({
        owner_id: user.id,
        couple_name: name,
        wedding_date: weddingDate || null,
        slug: normalized,
      })
      .select()
      .single()

    if (error) {
      setCreateError(error.message)
      setCreating(false)
      return
    }

    setCoupleName('')
    setSlug('')
    setWeddingDate('')
    setCreating(false)
    if (created) {
      router.push(`/dashboard/${created.id}`)
    } else {
      void loadRegistries()
    }
  }

  if (loading) return <p className="text-center mt-20">Loading...</p>

  return (
    <main className="max-w-2xl mx-auto px-4 py-10">
      <h1 className="text-2xl font-bold mb-2">Your registries</h1>
      <p className="text-gray-600 text-sm mb-8">
        Create a registry for each event. Guests use the public link to view and claim bottles.
      </p>

      {registries.length === 0 && (
        <p className="text-gray-500 mb-6">You don&apos;t have any registries yet. Create one below.</p>
      )}

      {registries.length > 0 && (
        <ul className="flex flex-col gap-3 mb-10">
          {registries.map((reg) => (
            <li key={reg.id}>
              <Link
                href={`/dashboard/${reg.id}`}
                className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border rounded-lg p-4 bg-white hover:border-gray-400 transition"
              >
                <div>
                  <p className="font-semibold">🥃 {reg.couple_name}</p>
                  {reg.wedding_date && (
                    <p className="text-sm text-gray-500">
                      {new Date(reg.wedding_date).toLocaleDateString('en-US', {
                        month: 'long',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </p>
                  )}
                  <p className="text-xs text-gray-400 mt-1">/{reg.slug}</p>
                </div>
                <span className="text-sm font-medium text-gray-900">Manage →</span>
              </Link>
            </li>
          ))}
        </ul>
      )}

      <div className="border rounded-lg p-4 bg-gray-50">
        <h2 className="text-lg font-semibold mb-4">Create a registry</h2>
        <div className="flex flex-col gap-3">
          <input
            className="border rounded-lg p-3 bg-white"
            placeholder="Display name (e.g. Mike & Sarah)"
            value={coupleName}
            onChange={(e) => setCoupleName(e.target.value)}
          />
          <input
            className="border rounded-lg p-3 bg-white"
            placeholder="URL slug (e.g. mike-and-sarah)"
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
          />
          <input
            className="border rounded-lg p-3 bg-white"
            type="date"
            value={weddingDate}
            onChange={(e) => setWeddingDate(e.target.value)}
          />
          {createError && <p className="text-red-500 text-sm">{createError}</p>}
          <button
            type="button"
            onClick={handleCreateRegistry}
            disabled={creating}
            className="bg-black text-white py-3 rounded-lg font-medium hover:bg-gray-800 disabled:opacity-50"
          >
            {creating ? 'Creating…' : 'Create registry'}
          </button>
        </div>
      </div>
    </main>
  )
}
