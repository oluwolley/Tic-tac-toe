import { createContext } from 'react'

import type { TypedSupabaseClient } from '../lib/supabase'
import { supabase } from '../lib/supabase'

export const SupabaseContext = createContext<TypedSupabaseClient>(supabase)

