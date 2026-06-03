import webpush from 'web-push'
import { createClient } from '@supabase/supabase-js'

const VAPID_PUBLIC = 'BMcZb5l5aEogdz6Q_RkxuZvVED3ty88cMIMgfusmbXUXkosDzmiPu5QtZBbVGvUv-9oM3r-0Z12yjpOt7leSgI0'
const VAPID_PRIVATE = 'xbI6ic-kBPNwRRkF9eEAcCWyiA1Oa8efK_J3qnR3wEM'

webpush.setVapidDetails('mailto:mt.mankowski@gmail.com', VAPID_PUBLIC, VAPID_PRIVATE)

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

  const { data: subs, error: subsError } = await supabase.from('push_subscriptions').select('*')
  console.log('push_subscriptions query:', { count: subs?.length, error: subsError?.message })
  if (!subs?.length) return res.json({ sent: 0, subsError: subsError?.message, debug: 'no subs found' })

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
  const errors = results.filter(r => r.status === 'rejected').map(r => ({
    msg: r.reason?.message,
    status: r.reason?.statusCode,
    body: r.reason?.body,
  }))
  console.log('send-push results:', { sent, total: subs.length, errors })
  res.json({ sent, total: subs.length, errors })
}
