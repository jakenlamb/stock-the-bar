'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import AddItemForm from '@/components/AddItemForm'
import { supabase } from '@/lib/supabase'
import type { Claim, Item, Registry } from '@/lib/types'

export default function RegistryManagePage() {
  const router = useRouter()
  const params = useParams<{ registryId: string }>()
  const registryId = typeof params.registryId === 'string' ? params.registryId : ''

  const [registry, setRegistry] = useState<Registry | null>(null)
  const [items, setItems] = useState<Item[]>([])
  const [claims, setClaims] = useState<Claim[]>([])
  const [loading, setLoading] = useState(true)
  const [registryUrl, setRegistryUrl] = useState('')

  useEffect(() => {
    if (!registryId) {
      setLoading(false)
      return
    }

    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setLoading(false)
        router.push('/login')
        return
      }

      const { data: reg, error: regError } = await supabase
        .from('registries')
        .select('*')
        .eq('id', registryId)
        .single()

      if (regError || !reg || reg.owner_id !== user.id) {
        setRegistry(null)
        setLoading(false)
        return
      }

      setRegistry(reg)

      const { data: itemData } = await supabase
        .from('items')
        .select('*')
        .eq('registry_id', reg.id)
        .order('created_at', { ascending: true })

      setItems(itemData || [])

      const itemIds = (itemData || []).map((i) => i.id)
      if (itemIds.length > 0) {
        const { data: claimData } = await supabase
          .from('claims')
          .select('*')
          .in('item_id', itemIds)
        setClaims(claimData || [])
      } else {
        setClaims([])
      }

      setLoading(false)
    }
    void load()
    // eslint-disable-next-line react-hooks/exhaustive-deps -- load when registry id changes
  }, [registryId])

  useEffect(() => {
    if (registry && typeof window !== 'undefined') {
      setRegistryUrl(`${window.location.origin}/registry/${registry.slug}`)
    }
  }, [registry])

  const deleteItem = async (itemId: string) => {
    await supabase.from('items').delete().eq('id', itemId)
    setItems((prev) => prev.filter((i) => i.id !== itemId))
  }

  const claimsForItem = (itemId: string) => claims.filter((c) => c.item_id === itemId)

  if (loading) return <p className="text-center mt-20">Loading...</p>
  if (!registry) {
    return (
      <main className="max-w-2xl mx-auto px-4 py-10">
        <p className="text-gray-600 mb-4">Registry not found or you don&apos;t have access.</p>
        <Link href="/dashboard" className="text-blue-600 underline text-sm">
          Back to dashboard
        </Link>
      </main>
    )
  }

  return (
    <main className="max-w-2xl mx-auto px-4 py-10">
      <Link href="/dashboard" className="text-sm text-gray-500 hover:text-gray-800 mb-4 inline-block">
        ← All registries
      </Link>
      <h1 className="text-2xl font-bold mb-2">🥃 {registry.couple_name}</h1>
      {registry.wedding_date && (
        <p className="text-gray-500 mb-4">
          {new Date(registry.wedding_date).toLocaleDateString('en-US', {
            month: 'long',
            day: 'numeric',
            year: 'numeric',
          })}
        </p>
      )}

      <div className="bg-gray-100 rounded-lg p-4 mb-8">
        <p className="text-sm text-gray-500 mb-1">Your shareable registry link:</p>
        <a href={registryUrl || '#'} target="_blank" rel="noreferrer" className="text-blue-600 underline break-all">
          {registryUrl || '…'}
        </a>
      </div>

      <AddItemForm registryId={registry.id} onAdd={(item) => setItems((prev) => [...prev, item])} />

      <h2 className="text-lg font-semibold mb-4 mt-8">Your Items ({items.length})</h2>
      {items.length === 0 && <p className="text-gray-400">No items yet. Add something above.</p>}
      <div className="flex flex-col gap-4">
        {items.map((item) => {
          const itemClaims = claimsForItem(item.id)
          const totalClaimed = itemClaims.reduce((sum, c) => sum + c.quantity_claimed, 0)
          const remaining = item.quantity_requested - totalClaimed

          return (
            <div key={item.id} className="border rounded-lg p-4 bg-white">
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-semibold">{item.name}</p>
                  {item.brand && <p className="text-sm text-gray-500">{item.brand}</p>}
                  <p className="text-xs text-gray-400 capitalize mt-1">{item.type}</p>
                  {item.notes && <p className="text-sm text-gray-600 mt-1">{item.notes}</p>}
                  <p className="text-sm mt-2">
                    <span className={remaining > 0 ? 'text-green-600' : 'text-red-500'}>
                      {remaining > 0
                        ? `${remaining} of ${item.quantity_requested} available`
                        : 'Fully claimed'}
                    </span>
                  </p>
                  {itemClaims.length > 0 && (
                    <ul className="mt-2 text-sm text-gray-500">
                      {itemClaims.map((c) => (
                        <li key={c.id}>
                          ✓ {c.guest_name} ({c.quantity_claimed})
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => deleteItem(item.id)}
                  className="text-xs text-red-400 hover:underline ml-4"
                >
                  Remove
                </button>
              </div>
            </div>
          )
        })}
      </div>
    </main>
  )
}
