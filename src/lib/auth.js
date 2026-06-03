import { supabase } from './supabase'

export async function verifyPin(pin) {
  try {
    const { data } = await supabase.from('users').select('pin').limit(1).single()
    if (!data?.pin) return false
    return pin === data.pin
  } catch {
    return false
  }
}
