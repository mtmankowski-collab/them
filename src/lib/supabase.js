import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://adkfsxhswuxelpfoigik.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFka2ZzeGhzd3V4ZWxwZm9pZ2lrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA0MDExNTksImV4cCI6MjA5NTk3NzE1OX0.Ef3TgksYM85HjruUHLQ59ZZ6HKl7HAc-gvMYovTa-PM'

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
