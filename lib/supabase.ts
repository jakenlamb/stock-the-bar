import { createBrowserClient } from '@supabase/auth-helpers-nextjs'
import type { SupabaseClient } from '@supabase/supabase-js'

let browserClient: SupabaseClient | null = null

function getBrowserClient(): SupabaseClient {
  if (!browserClient) {
    browserClient = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
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
