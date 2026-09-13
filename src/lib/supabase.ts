import { createClient } from '@supabase/supabase-js'

const DEFAULT_SUPABASE_URL = 'https://xiejbwdvyjnfhlcnxhen.supabase.co'
const DEFAULT_SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_6cO5yz4wACPOtfR66K30Pg_Vq_PoE4z'

export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL || DEFAULT_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || DEFAULT_SUPABASE_PUBLISHABLE_KEY,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  },
)

export function captaCityRedirectUrl() {
  if (typeof window === 'undefined') return 'https://aureon-tech.github.io/CAPTA-CITY/'
  return `${window.location.origin}${import.meta.env.BASE_URL}`
}
