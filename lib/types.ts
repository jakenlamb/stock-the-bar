export type Registry = {
  id: string
  owner_id: string
  couple_name: string
  wedding_date: string | null
  slug: string
  created_at?: string
}

export type Item = {
  id: string
  registry_id: string
  name: string
  type: string
  brand: string | null
  notes: string | null
  image_url: string | null
  quantity_requested: number
  created_at?: string
}

export type Claim = {
  id: string
  item_id: string
  guest_name: string
  quantity_claimed: number
  claimed_at?: string
}
