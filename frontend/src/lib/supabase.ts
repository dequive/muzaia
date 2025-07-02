import { createClient } from '@supabase/supabase-js'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import type { Database } from '@/types/supabase'

// Cliente para uso em componentes
export const createClient = () => {
  return createClientComponentClient<Database>()
}

// Cliente para uso em server-side
export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// Helper para tipagem
export type SupabaseClient = ReturnType<typeof createClient>
