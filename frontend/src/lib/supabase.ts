import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/supabase'

// Cliente para uso em componentes
export const createClient = () => {
  return createClientComponentClient<Database>()
}

// Cliente para uso em server-side
export const supabase = createSupabaseClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export type SupabaseClient = ReturnType<typeof createClient>
