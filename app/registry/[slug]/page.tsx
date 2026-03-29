'use client'
import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import ClaimModal from '@/components/ClaimModal'
import type { Claim, Item, Registry } from '@/lib/types'

function slugFromParams(raw: string | string[] | undefined): string {
  if (typeof raw === 'string') return raw
  if (Array.isArray(raw) && raw[0]) return raw[0]
  return ''
}

export default function RegistryPage() {
  const routeParams = useParams<{ slug?: string | string[] }>()
  const slug = slugFromParams(routeParams.slug)

  const [registry, setRegistry] = useState<Registry | null>(null)
  const [items, setItems] = useState<Item[]>([])
  const [claims, setClaims] = useState<Claim[]>([])
  const [selectedItem, setSelectedItem] = useState<Item | null>(null)
  const [loading, setLoading] = useState(true)

  const load = async (slugForQuery: string) => {
    console.log('[registry] load start', { slug: slugForQuery, routeParams })

    if (!slugForQuery) {
      console.warn('[registry] empty slug; skipping query')
      setRegistry(null)
      setItems([])
      setClaims([])
      setLoading(false)
      return
    }

    const {
      data: reg,
      error: regError,
    } = await supabase.from('registries').select('*').eq('slug', slugForQuery).single()

    console.log('[registry] registries query result', { data: reg, error: regError })

    if (regError) {
      console.error('[registry] registries query error', regError)
    }

    if (!reg) {
      setRegistry(null)
      setItems([])
      setClaims([])
      setLoading(false)
      return
    }
    setRegistry(reg)

    const { data: itemData, error: itemsError } = await supabase
      .from('items')
      .select('*')
      .eq('registry_id', reg.id)
      .order('created_at', { ascending: true })

    if (itemsError) {
      console.error('[registry] items query error', itemsError)
    }
    console.log('[registry] items query result', { data: itemData, error: itemsError })

    setItems(itemData || [])

    const itemIds = (itemData || []).map((i) => i.id)
    if (itemIds.length > 0) {
      const { data: claimData, error: claimsError } = await supabase
        .from('claims')
        .select('*')
        .in('item_id', itemIds)

      if (claimsError) {
        console.error('[registry] claims query error', claimsError)
      }
      console.log('[registry] claims query result', { data: claimData, error: claimsError })
      setClaims(claimData || [])
    } else {
      setClaims([])
    }

    setLoading(false)
  }

  useEffect(() => {
    setLoading(true)
    void load(slug)
  }, [slug])

  const claimsForItem = (itemId: string) => claims.filter(c => c.item_id === itemId)

  if (loading) return <p className="text-center mt-20">Loading registry...</p>
  if (!registry) return <p className="text-center mt-20">Registry not found.</p>

  return (
    <main className="max-w-2xl mx-auto px-4 py-10">
      <h1 className="text-3xl font-bold mb-1">🥃 {registry.couple_name}</h1>
      {registry.wedding_date && (
        <p className="text-gray-500 mb-2">{new Date(registry.wedding_date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
      )}
      <p className="text-gray-400 text-sm mb-8">Help stock the bar! Claim a bottle below so we don&apos;t end up with 6 bottles of the same thing.</p>

      <div className="flex flex-col gap-4">
        {items.map(item => {
          const itemClaims = claimsForItem(item.id)
          const totalClaimed = itemClaims.reduce((sum, c) => sum + c.quantity_claimed, 0)
          const remaining = item.quantity_requested - totalClaimed
          const isClaimed = remaining <= 0

          return (
            <div key={item.id} className={`border rounded-lg p-4 bg-white ${isClaimed ? 'opacity-50' : ''}`}>
              <div className="flex justify-between items-center">
                <div>
                  <p className="font-semibold">{item.name}</p>
                  {item.brand && <p className="text-sm text-gray-500">{item.brand}</p>}
                  <p className="text-xs text-gray-400 capitalize">{item.type}</p>
                  {item.notes && <p className="text-sm text-gray-600 mt-1">{item.notes}</p>}
                  <p className="text-sm mt-2">
                    {isClaimed
                      ? <span className="text-red-500 font-medium">✓ Fully claimed</span>
                      : <span className="text-green-600">{remaining} of {item.quantity_requested} still needed</span>
                    }
                  </p>
                  {itemClaims.length > 0 && (
                    <ul className="mt-1 text-xs text-gray-400">
                      {itemClaims.map((c) => <li key={c.id}>✓ {c.guest_name}</li>)}
                    </ul>
                  )}
                </div>
                {!isClaimed && (
                  <button
                    onClick={() => setSelectedItem(item)}
                    className="bg-black text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-800"
                  >
                    Claim
                  </button>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {selectedItem && (
        <ClaimModal
          item={selectedItem}
          onClose={() => setSelectedItem(null)}
          onClaimed={() => { setSelectedItem(null); void load(slug) }}
        />
      )}
    </main>
  )
}
