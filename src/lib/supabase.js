import { createClient } from '@supabase/supabase-js'

const URL  = 'https://adkfsxhswuxelpfoigik.supabase.co'
const KEY  = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFka2ZzeGhzd3V4ZWxwZm9pZ2lrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA0MDExNTksImV4cCI6MjA5NTk3NzE1OX0.Ef3TgksYM85HjruUHLQ59ZZ6HKl7HAc-gvMYovTa-PM'

export const supabase = createClient(URL, KEY)

export const PEOPLE = {
  a:      { id: 'a',      name: 'Maniek', initial: 'M', color: 'var(--a)', soft: 'var(--a-soft)' },
  b:      { id: 'b',      name: 'Ula',    initial: 'U', color: 'var(--b)', soft: 'var(--b-soft)' },
  shared: { id: 'shared', name: 'Wspólne',initial: '◆', color: 'var(--shared)', soft: 'var(--shared-soft)' },
}

export function personColor(who) {
  if (who === 'a') return 'var(--a)'
  if (who === 'b') return 'var(--b)'
  return 'var(--shared)'
}

export function personSoft(who) {
  if (who === 'a') return 'var(--a-soft)'
  if (who === 'b') return 'var(--b-soft)'
  return 'var(--shared-soft)'
}
