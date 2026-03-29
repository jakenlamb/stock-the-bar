'use client'
import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { Item } from '@/lib/types'

export default function ClaimModal({ item, onClose, onClaimed }: { item: Item; onClose: () => void; onClaimed: () => void }) {
  const [guestName, setGuestName] = useState('')
  const [quantity, setQuantity] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleClaim = async () => {
    if (!guestName.trim()) { setError('Please enter your name.'); return }
    setLoading(true)
    const { error } = await supabase.from('claims').insert({
      item_id: item.id,
      guest_name: guestName,
      quantity_claimed: quantity,
    })
    if (error) { setError(error.message); setLoading(false); return }
    onClaimed()
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4">
      <div className="bg-white rounded-xl p-6 max-w-sm w-full">
        <h2 className="text-lg font-bold mb-1">Claim: {item.name}</h2>
        {item.brand && <p className="text-sm text-gray-500 mb-4">{item.brand}</p>}
        <div className="flex flex-col gap-3">
          <input
            className="border rounded-lg p-3"
            placeholder="Your name"
            value={guestName}
            onChange={e => setGuestName(e.target.value)}
          />
          <div>
            <label className="text-sm text-gray-500">Quantity</label>
            <input
              className="border rounded-lg p-3 w-full mt-1"
              type="number"
              min={1}
              max={item.quantity_requested}
              value={quantity}
              onChange={e => setQuantity(parseInt(e.target.value))}
            />
          </div>
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <button onClick={handleClaim} disabled={loading} className="bg-black text-white py-3 rounded-lg font-medium hover:bg-gray-800 disabled:opacity-50">
            {loading ? 'Claiming...' : 'Claim This Item'}
          </button>
          <button onClick={onClose} className="text-sm text-gray-400 hover:underline text-center">
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}
