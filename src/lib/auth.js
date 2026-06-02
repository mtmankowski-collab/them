import { supabase } from './supabase'

const FALLBACK_PIN = '2407'

export async function verifyPin(pin) {
  try {
    const { data } = await supabase.from('users').select('pin').limit(1).single()
    const correctPin = data?.pin || FALLBACK_PIN
    return pin === correctPin
  } catch {
    return pin === FALLBACK_PIN
  }
}
