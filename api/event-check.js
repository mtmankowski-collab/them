import webpush from 'web-push'
import { createClient } from '@supabase/supabase-js'

const VAPID_PUBLIC = 'BMcZb5l5aEogdz6Q_RkxuZvVED3ty88cMIMgfusmbXUXkosDzmiPu5QtZBbVGvUv-9oM3r-0Z12yjpOt7leSgI0'

webpush.setVapidDetails('mailto:mt.mankowski@gmail.com', VAPID_PUBLIC, process.env.VAPID_PRIVATE_KEY)

function localDateStr(d) {
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
}

export default async function handler(req, res) {
  if (req.headers.authorization !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).end()
  }

  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY)

  const today = localDateStr(new Date())

  // Fetch all events happening today (including multi-day events spanning today)
  const { data: events } = await supabase
    .from('events')
    .select('*')
    .or(`date.eq.${today},and(date.lte.${today},date_end.gte.${today})`)
    .order('time_start', { nullsFirst: true })

  const { data: subs } = await supabase.from('push_subscriptions').select('*')

  if (!subs?.length || !events?.length) {
    return res.json({ ok: true, sent: 0, events: events?.length || 0 })
  }

  const notifications = events.map(e => {
    const time = e.time_start ? e.time_start.slice(0, 5) : null
    const body = [time, e.location].filter(Boolean).join(' · ')
    return {
      title: `📅 ${e.title}`,
      body: body || 'Dziś',
      url: `/?date=${today}`,
    }
  })

  let sent = 0
  const expired = []

  for (const notif of notifications) {
    const payload = JSON.stringify({ title: notif.title, body: notif.body, tag: 'event', url: notif.url })
    const results = await Promise.allSettled(
      subs.map(sub =>
        webpush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          payload
        )
      )
    )
    sent += results.filter(r => r.status === 'fulfilled').length
    subs.forEach((sub, i) => {
      if (results[i].status === 'rejected' && results[i].reason?.statusCode === 410) {
        expired.push(sub.endpoint)
      }
    })
  }

  if (expired.length) {
    await supabase.from('push_subscriptions').delete().in('endpoint', [...new Set(expired)])
  }

  res.json({ ok: true, sent, events: notifications.length })
}
