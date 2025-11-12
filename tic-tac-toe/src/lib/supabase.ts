import { createClient } from '@supabase/supabase-js'

import type { Database } from './database.types'

type SupabaseClientType = ReturnType<typeof createClient<Database>>

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

let client: SupabaseClientType

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    '[supabase] Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY. ' +
      'Configure env vars to enable realtime features.',
  )
  client = new Proxy(
    {},
    {
      get() {
        throw new Error(
          'Supabase client is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your environment.',
        )
      },
    },
  ) as SupabaseClientType
} else {
  client = createClient<Database>(supabaseUrl, supabaseAnonKey, {
    realtime: {
      params: {
        eventsPerSecond: 10,
      },
    },
    auth: {
      persistSession: false,
    },
  })
}

export const supabase = client
export type TypedSupabaseClient = SupabaseClientType

