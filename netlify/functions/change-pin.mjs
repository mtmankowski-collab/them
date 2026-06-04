import { createHmac } from 'crypto'
import { createClient } from '@supabase/supabase-js'

function verifyToken(token, secret) {
  if (!token) return false
  const [exp, sig] = token.split('.')
  if (!exp || !sig) return false
  if (parseInt(exp) < Math.floor(Date.now() / 1000)) return false
  const expected = createHmac('sha256', secret).update(exp).digest('hex')
  return sig === expected
}

export default async (req) => {
  if (req.method !== 'POST') return new Response('Method Not Allowed', { status: 405 })

  const token = req.headers.get('x-session-token')
  if (!verifyToken(token, process.env.SESSION_SECRET)) {
    return Response.json({ ok: false, error: 'Unauthorized' }, { status: 401 })
  }

  const { currentPin, newPin } = await req.json()
  if (!currentPin || !newPin || newPin.length !== 4) {
    return Response.json({ ok: false, error: 'Invalid input' }, { status: 400 })
  }

  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY)
  const { data } = await supabase.from('users').select('pin').limit(1).single()

  if (!data?.pin || currentPin !== data.pin) {
    return Response.json({ ok: false, error: 'Aktualny PIN jest nieprawidłowy' }, { status: 401 })
  }

  const { error } = await supabase.from('users').update({ pin: newPin }).eq('pin', currentPin)
  if (error) return Response.json({ ok: false, error: 'Błąd zapisu' }, { status: 500 })

  return Response.json({ ok: true })
}

export const config = { path: '/api/change-pin' }
