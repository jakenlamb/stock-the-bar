# Stock the Bar — Full Build Guide

## Stack
- **Frontend/Framework:** Next.js 14 (App Router)
- **Database + Auth:** Supabase
- **Hosting:** Vercel
- **Language:** TypeScript

---

## Part 1: Project Setup

### 1. Create your accounts (all free)
1. [github.com](https://github.com) — create a new repo called `stock-the-bar`
2. [supabase.com](https://supabase.com) — create a new project
3. [vercel.com](https://vercel.com) — connect your GitHub account

### 2. Initialize the Next.js app locally (or in Cursor/Windsurf)
```bash
npx create-next-app@latest stock-the-bar --typescript --tailwind --eslint --app
cd stock-the-bar
npm install @supabase/supabase-js @supabase/auth-helpers-nextjs
```

### 3. Environment Variables
Create a `.env.local` file in the root:
```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```
Find these in Supabase → Project Settings → API.

---

## Part 2: Supabase Setup

### Run this SQL in Supabase → SQL Editor

```sql
-- Registries table
create table registries (
  id uuid default gen_random_uuid() primary key,
  owner_id uuid references auth.users(id) on delete cascade not null,
  couple_name text not null,
  wedding_date date,
  slug text unique not null,
  created_at timestamp with time zone default now()
);

-- Items table
create table items (
  id uuid default gen_random_uuid() primary key,
  registry_id uuid references registries(id) on delete cascade not null,
  name text not null,
  type text check (type in ('spirit', 'wine', 'beer', 'other')) default 'other',
  brand text,
  quantity_requested integer default 1,
  notes text,
  image_url text,
  created_at timestamp with time zone default now()
);

-- Claims table
create table claims (
  id uuid default gen_random_uuid() primary key,
  item_id uuid references items(id) on delete cascade not null,
  guest_name text not null,
  quantity_claimed integer default 1,
  claimed_at timestamp with time zone default now()
);

-- Row Level Security
alter table registries enable row level security;
alter table items enable row level security;
alter table claims enable row level security;

-- Policies: registries
create policy "Owners can manage their registry"
  on registries for all using (auth.uid() = owner_id);

create policy "Anyone can view registries"
  on registries for select using (true);

-- Policies: items
create policy "Owners can manage items"
  on items for all using (
    auth.uid() = (select owner_id from registries where id = items.registry_id)
  );

create policy "Anyone can view items"
  on items for select using (true);

-- Policies: claims
create policy "Anyone can insert a claim"
  on claims for insert with check (true);

create policy "Anyone can view claims"
  on claims for select using (true);

create policy "Owners can delete claims"
  on claims for delete using (
    auth.uid() = (
      select r.owner_id from registries r
      join items i on i.registry_id = r.id
      where i.id = claims.item_id
    )
  );
```

---

## Part 3: File Structure

```
stock-the-bar/
├── app/
│   ├── layout.tsx
│   ├── page.tsx                        ← landing / redirect
│   ├── login/
│   │   └── page.tsx
│   ├── signup/
│   │   └── page.tsx
│   ├── dashboard/
│   │   └── page.tsx                    ← couple dashboard
│   └── registry/
│       └── [slug]/
│           └── page.tsx                ← public guest view
├── components/
│   ├── AddItemForm.tsx
│   ├── ItemCard.tsx
│   └── ClaimModal.tsx
├── lib/
│   └── supabase.ts
├── middleware.ts
└── .env.local
```

---

## Part 4: Code

### `lib/supabase.ts`
```typescript
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

export const supabase = createClientComponentClient()
```

---

### `middleware.ts`
```typescript
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  const supabase = createMiddlewareClient({ req, res })
  await supabase.auth.getSession()
  return res
}
```

---

### `app/layout.tsx`
```tsx
import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Stock the Bar',
  description: 'A wedding alcohol registry',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-gray-50 text-gray-900 min-h-screen">
        {children}
      </body>
    </html>
  )
}
```

---

### `app/page.tsx` — Landing Page
```tsx
import Link from 'next/link'

export default function Home() {
  return (
    <main className="flex flex-col items-center justify-center min-h-screen gap-6 text-center px-4">
      <h1 className="text-4xl font-bold">🥃 Stock the Bar</h1>
      <p className="text-gray-500 text-lg max-w-md">
        Create an alcohol registry for your wedding or party. Guests can claim bottles — no duplicates, no guessing.
      </p>
      <div className="flex gap-4">
        <Link href="/signup" className="bg-black text-white px-6 py-3 rounded-lg font-medium hover:bg-gray-800">
          Create a Registry
        </Link>
        <Link href="/login" className="border border-gray-300 px-6 py-3 rounded-lg font-medium hover:bg-gray-100">
          Log In
        </Link>
      </div>
    </main>
  )
}
```

---

### `app/signup/page.tsx`
```tsx
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
```

---

### `app/login/page.tsx`
```tsx
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
```

---

### `app/dashboard/page.tsx`
```tsx
'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import AddItemForm from '@/components/AddItemForm'

export default function DashboardPage() {
  const router = useRouter()
  const [registry, setRegistry] = useState<any>(null)
  const [items, setItems] = useState<any[]>([])
  const [claims, setClaims] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }

      const { data: reg } = await supabase
        .from('registries')
        .select('*')
        .eq('owner_id', user.id)
        .single()

      if (!reg) { router.push('/signup'); return }
      setRegistry(reg)

      const { data: itemData } = await supabase
        .from('items')
        .select('*')
        .eq('registry_id', reg.id)
        .order('created_at', { ascending: true })

      setItems(itemData || [])

      const itemIds = (itemData || []).map((i: any) => i.id)
      if (itemIds.length > 0) {
        const { data: claimData } = await supabase
          .from('claims')
          .select('*')
          .in('item_id', itemIds)
        setClaims(claimData || [])
      }

      setLoading(false)
    }
    load()
  }, [])

  const deleteItem = async (itemId: string) => {
    await supabase.from('items').delete().eq('id', itemId)
    setItems(prev => prev.filter(i => i.id !== itemId))
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  const claimsForItem = (itemId: string) =>
    claims.filter(c => c.item_id === itemId)

  if (loading) return <p className="text-center mt-20">Loading...</p>

  const registryUrl = `${window.location.origin}/registry/${registry.slug}`

  return (
    <main className="max-w-2xl mx-auto px-4 py-10">
      <div className="flex justify-between items-center mb-2">
        <h1 className="text-2xl font-bold">🥃 {registry.couple_name}</h1>
        <button onClick={handleLogout} className="text-sm text-gray-500 hover:underline">Log out</button>
      </div>
      {registry.wedding_date && (
        <p className="text-gray-500 mb-4">{new Date(registry.wedding_date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
      )}

      <div className="bg-gray-100 rounded-lg p-4 mb-8">
        <p className="text-sm text-gray-500 mb-1">Your shareable registry link:</p>
        <a href={registryUrl} target="_blank" className="text-blue-600 underline break-all">{registryUrl}</a>
      </div>

      <AddItemForm registryId={registry.id} onAdd={item => setItems(prev => [...prev, item])} />

      <h2 className="text-lg font-semibold mb-4 mt-8">Your Items ({items.length})</h2>
      {items.length === 0 && <p className="text-gray-400">No items yet. Add something above.</p>}
      <div className="flex flex-col gap-4">
        {items.map(item => {
          const itemClaims = claimsForItem(item.id)
          const totalClaimed = itemClaims.reduce((sum: number, c: any) => sum + c.quantity_claimed, 0)
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
                      {remaining > 0 ? `${remaining} of ${item.quantity_requested} available` : 'Fully claimed'}
                    </span>
                  </p>
                  {itemClaims.length > 0 && (
                    <ul className="mt-2 text-sm text-gray-500">
                      {itemClaims.map((c: any) => (
                        <li key={c.id}>✓ {c.guest_name} ({c.quantity_claimed})</li>
                      ))}
                    </ul>
                  )}
                </div>
                <button onClick={() => deleteItem(item.id)} className="text-xs text-red-400 hover:underline ml-4">Remove</button>
              </div>
            </div>
          )
        })}
      </div>
    </main>
  )
}
```

---

### `components/AddItemForm.tsx`
```tsx
'use client'
import { useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function AddItemForm({ registryId, onAdd }: { registryId: string, onAdd: (item: any) => void }) {
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
```

---

### `app/registry/[slug]/page.tsx` — Public Guest View
```tsx
'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import ClaimModal from '@/components/ClaimModal'

export default function RegistryPage({ params }: { params: { slug: string } }) {
  const [registry, setRegistry] = useState<any>(null)
  const [items, setItems] = useState<any[]>([])
  const [claims, setClaims] = useState<any[]>([])
  const [selectedItem, setSelectedItem] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  const load = async () => {
    const { data: reg } = await supabase
      .from('registries')
      .select('*')
      .eq('slug', params.slug)
      .single()

    if (!reg) { setLoading(false); return }
    setRegistry(reg)

    const { data: itemData } = await supabase
      .from('items')
      .select('*')
      .eq('registry_id', reg.id)
      .order('created_at', { ascending: true })

    setItems(itemData || [])

    const itemIds = (itemData || []).map((i: any) => i.id)
    if (itemIds.length > 0) {
      const { data: claimData } = await supabase.from('claims').select('*').in('item_id', itemIds)
      setClaims(claimData || [])
    }

    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const claimsForItem = (itemId: string) => claims.filter(c => c.item_id === itemId)

  if (loading) return <p className="text-center mt-20">Loading registry...</p>
  if (!registry) return <p className="text-center mt-20">Registry not found.</p>

  return (
    <main className="max-w-2xl mx-auto px-4 py-10">
      <h1 className="text-3xl font-bold mb-1">🥃 {registry.couple_name}</h1>
      {registry.wedding_date && (
        <p className="text-gray-500 mb-2">{new Date(registry.wedding_date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
      )}
      <p className="text-gray-400 text-sm mb-8">Help stock the bar! Claim a bottle below so we don't end up with 6 bottles of the same thing.</p>

      <div className="flex flex-col gap-4">
        {items.map(item => {
          const itemClaims = claimsForItem(item.id)
          const totalClaimed = itemClaims.reduce((sum: number, c: any) => sum + c.quantity_claimed, 0)
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
                      {itemClaims.map((c: any) => <li key={c.id}>✓ {c.guest_name}</li>)}
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
          onClaimed={() => { setSelectedItem(null); load() }}
        />
      )}
    </main>
  )
}
```

---

### `components/ClaimModal.tsx`
```tsx
'use client'
import { useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function ClaimModal({ item, onClose, onClaimed }: { item: any, onClose: () => void, onClaimed: () => void }) {
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
```

---

## Part 5: Deploy to Vercel

1. Push code to GitHub
2. Go to [vercel.com](https://vercel.com) → New Project → Import your repo
3. Add environment variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. Deploy — Vercel handles everything automatically

Your app will be live at `https://stock-the-bar.vercel.app` (or whatever name you pick).

---

## Quick Reference

| Route | Who sees it |
|---|---|
| `/` | Everyone — landing page |
| `/signup` | Couple — create account + registry |
| `/login` | Couple — log back in |
| `/dashboard` | Couple only — manage items, see claims |
| `/registry/[slug]` | Guests — public view, claim items |

---

## Notes
- The slug is set at signup and becomes the sharable URL (e.g. `/registry/mike-and-sarah`)
- Guests never need to create an account
- The couple can remove items from the dashboard but can't edit them in v1 (easy to add later)
- Supabase free tier supports up to 500MB storage and 50,000 monthly active users — more than enough
