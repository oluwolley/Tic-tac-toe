import { useContext } from 'react'

import { SupabaseContext } from '../providers/SupabaseContext'

export function useSupabaseClient() {
  const client = useContext(SupabaseContext)
  if (!client) {
    throw new Error('useSupabaseClient must be used within a SupabaseProvider')
  }
  return client
}

