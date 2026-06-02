import { supabase } from './supabase'

const FALLBACK_USERS = [
  { id: 1, name: 'Maniek', initials: 'M', color: '#C4703A', pin: '1234' },
  { id: 2, name: 'Ania', initials: 'A', color: '#378ADD', pin: '5678' },
]

export async function fetchUsers() {
  try {
    const { data, error } = await supabase.from('users').select('*')
    if (error || !data?.length) return FALLBACK_USERS
    return data
  } catch {
    return FALLBACK_USERS
  }
}

export async function verifyPin(userId, pin) {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single()
    if (error || !data) {
      const fallback = FALLBACK_USERS.find(u => u.id === userId)
      return fallback?.pin === pin ? fallback : null
    }
    return data.pin === pin ? data : null
  } catch {
    const fallback = FALLBACK_USERS.find(u => u.id === userId)
    return fallback?.pin === pin ? fallback : null
  }
}
