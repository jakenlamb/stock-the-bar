import { createBrowserClient } from '@supabase/auth-helpers-nextjs'
import type { SupabaseClient } from '@supabase/supabase-js'

let browserClient: SupabaseClient | null = null

function getBrowserClient(): SupabaseClient {
  if (!browserClient) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
      if (!url || !anonKey) {
        console.error(
          '[supabase] Browser client init: missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY'
        )
      }
    }
    browserClient = createBrowserClient(url!, anonKey!)
  }
  return browserClient
}

/** Lazy browser client; guide name preserved (v0.15 uses `createBrowserClient`). */
export const supabase = new Proxy({} as SupabaseClient, {
  get(_, prop) {
    const client = getBrowserClient()
    const value = Reflect.get(client as object, prop)
    if (typeof value === 'function') {
      return value.bind(client)
    }
    return value
  },
})
