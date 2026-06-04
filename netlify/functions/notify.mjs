import { createHmac } from 'crypto'
import webpush from 'web-push'
import { createClient } from '@supabase/supabase-js'

const VAPID_PUBLIC = 'BMcZb5l5aEogdz6Q_RkxuZvVED3ty88cMIMgfusmbXUXkosDzmiPu5QtZBbVGvUv-9oM3r-0Z12yjpOt7leSgI0'

webpush.setVapidDetails('mailto:mt.mankowski@gmail.com', VAPID_PUBLIC, process.env.VAPID_PRIVATE_KEY)

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
    return new Response('Unauthorized', { status: 401 })
  }

  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY)

  const { title, body, url } = await req.json()
  if (!title) return Response.json({ error: 'title required' }, { status: 400 })

  const { data: subs } = await supabase.from('push_subscriptions').select('*')
  if (!subs?.length) return Response.json({ sent: 0 })

  const payload = JSON.stringify({ title, body: body || '', tag: 'them', url: url || '/' })

  const results = await Promise.allSettled(
    subs.map(sub =>
      webpush.sendNotification(
        { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
        payload
      )
    )
  )

  const expired = subs.filter((_, i) => {
    const r = results[i]
    return r.status === 'rejected' && r.reason?.statusCode === 410
  })
  if (expired.length) {
    await supabase.from('push_subscriptions').delete().in('endpoint', expired.map(s => s.endpoint))
  }

  return Response.json({ sent: results.filter(r => r.status === 'fulfilled').length })
}

export const config = { path: '/api/notify' }
