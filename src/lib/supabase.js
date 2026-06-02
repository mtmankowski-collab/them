import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://adkfsxhswuxelpfoigik.supabase.co'
const SUPABASE_ANON_KEY = 'sb_publishable_64X2a0I1jPpr9SV2qLu2LA_-Ekyklt4'

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
