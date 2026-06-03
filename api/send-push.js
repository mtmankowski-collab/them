import webpush from 'web-push'
import { createClient } from '@supabase/supabase-js'

webpush.setVapidDetails(
  'mailto:them@app.local',
  process.env.VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
)

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  const token = req.headers['x-push-token']
  if (!token || token !== process.env.CRON_SECRET) return res.status(401).end()

  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY
  )

  const { title, body, tag } = req.body
  if (!title) return res.status(400).json({ error: 'title required' })

  const { data: subs } = await supabase.from('push_subscriptions').select('*')
  if (!subs?.length) return res.json({ sent: 0 })

  const payload = JSON.stringify({ title, body, tag: tag || 'them' })
  const results = await Promise.allSettled(
    subs.map(sub =>
      webpush.sendNotification(
        { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
        payload
      )
    )
  )

  // Clean up expired subscriptions (410 Gone)
  const expired = subs.filter((_, i) => {
    const r = results[i]
    return r.status === 'rejected' && r.reason?.statusCode === 410
  })
  if (expired.length) {
    await supabase.from('push_subscriptions')
      .delete()
      .in('endpoint', expired.map(s => s.endpoint))
  }

  const sent = results.filter(r => r.status === 'fulfilled').length
  const errors = results.filter(r => r.status === 'rejected').map(r => r.reason?.message || r.reason?.statusCode || String(r.reason))
  console.log('send-push results:', { sent, total: subs.length, errors })
  res.json({ sent, total: subs.length, errors })
}
