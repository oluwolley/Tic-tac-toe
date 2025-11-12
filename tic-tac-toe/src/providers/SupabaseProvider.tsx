import type { TypedSupabaseClient } from '../lib/supabase'
import { supabase } from '../lib/supabase'
import { SupabaseContext } from './SupabaseContext'

type SupabaseProviderProps = {
  client?: TypedSupabaseClient
  children: React.ReactNode
}

export function SupabaseProvider({ client = supabase, children }: SupabaseProviderProps) {
  return <SupabaseContext.Provider value={client}>{children}</SupabaseContext.Provider>
}
