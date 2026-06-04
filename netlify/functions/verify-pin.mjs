import { createHmac } from 'crypto'
import { createClient } from '@supabase/supabase-js'

function generateToken(secret) {
  const exp = Math.floor(Date.now() / 1000) + 86400 // 24h
  const sig = createHmac('sha256', secret).update(String(exp)).digest('hex')
  return `${exp}.${sig}`
}

export default async (req) => {
  if (req.method !== 'POST') return new Response('Method Not Allowed', { status: 405 })

  const { pin } = await req.json()
  if (!pin) return Response.json({ ok: false }, { status: 400 })

  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY)
  const { data } = await supabase.from('users').select('pin').limit(1).single()

  if (!data?.pin || pin !== data.pin) {
    return Response.json({ ok: false }, { status: 401 })
  }

  const token = generateToken(process.env.SESSION_SECRET)
  return Response.json({ ok: true, token })
}

export const config = { path: '/api/verify-pin' }
