'use client'
import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { Item } from '@/lib/types'

export default function AddItemForm({ registryId, onAdd }: { registryId: string; onAdd: (item: Item) => void }) {
  const [name, setName] = useState('')
  const [brand, setBrand] = useState('')
  const [type, setType] = useState('spirit')
  const [quantity, setQuantity] = useState(1)
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)

  const handleAdd = async () => {
    if (!name.trim()) return
    setLoading(true)
    const { data, error } = await supabase.from('items').insert({
      registry_id: registryId,
      name,
      brand,
      type,
      quantity_requested: quantity,
      notes,
    }).select().single()

    if (!error && data) {
      onAdd(data)
      setName(''); setBrand(''); setNotes(''); setQuantity(1); setType('spirit')
    }
    setLoading(false)
  }

  return (
    <div className="border rounded-lg p-4 bg-white">
      <h2 className="font-semibold mb-4">Add an Item</h2>
      <div className="grid grid-cols-2 gap-3">
        <input className="border rounded-lg p-2 col-span-2" placeholder="Item name (e.g. Tito's Vodka)" value={name} onChange={e => setName(e.target.value)} />
        <input className="border rounded-lg p-2" placeholder="Brand (optional)" value={brand} onChange={e => setBrand(e.target.value)} />
        <select className="border rounded-lg p-2" value={type} onChange={e => setType(e.target.value)}>
          <option value="spirit">Spirit</option>
          <option value="wine">Wine</option>
          <option value="beer">Beer</option>
          <option value="other">Other</option>
        </select>
        <input className="border rounded-lg p-2" type="number" min={1} placeholder="Quantity" value={quantity} onChange={e => setQuantity(parseInt(e.target.value))} />
        <input className="border rounded-lg p-2" placeholder="Notes (optional)" value={notes} onChange={e => setNotes(e.target.value)} />
      </div>
      <button onClick={handleAdd} disabled={loading} className="mt-4 bg-black text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-gray-800 disabled:opacity-50">
        {loading ? 'Adding...' : 'Add Item'}
      </button>
    </div>
  )
}
