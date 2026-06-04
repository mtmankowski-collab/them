import webpush from 'web-push'
import { createClient } from '@supabase/supabase-js'

const VAPID_PUBLIC = 'BMcZb5l5aEogdz6Q_RkxuZvVED3ty88cMIMgfusmbXUXkosDzmiPu5QtZBbVGvUv-9oM3r-0Z12yjpOt7leSgI0'

webpush.setVapidDetails('mailto:mt.mankowski@gmail.com', VAPID_PUBLIC, process.env.VAPID_PRIVATE_KEY)

function warsawNow() {
  const now = new Date()
  const warsawStr = now.toLocaleString('en-CA', { timeZone: 'Europe/Warsaw', hour12: false })
  const [datePart, timePart] = warsawStr.split(', ')
  const [h, m] = timePart.split(':').map(Number)
  return { date: datePart, hour: h, minute: m }
}

export default async (req) => {
  if (req.headers.get('authorization') !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Unauthorized', { status: 401 })
  }

  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY)
  const { date, hour } = warsawNow()

  const targetHour = hour + 1
  if (targetHour >= 24) return Response.json({ ok: true, sent: 0, reason: 'no events after midnight' })

  const from = `${String(targetHour).padStart(2,'0')}:00:00`
  const to   = `${String(targetHour).padStart(2,'0')}:59:59`

  const { data: events } = await supabase
    .from('events')
    .select('*')
    .or(`date.eq.${date},and(date.lte.${date},date_end.gte.${date})`)
    .gte('time_start', from)
    .lte('time_start', to)

  const { data: subs } = await supabase.from('push_subscriptions').select('*')

  if (!subs?.length || !events?.length) {
    return Response.json({ ok: true, sent: 0, events: events?.length || 0 })
  }

  let sent = 0
  const expired = []

  for (const e of events) {
    const time = e.time_start.slice(0, 5)
    const body = [time, e.location].filter(Boolean).join(' · ')
    const payload = JSON.stringify({
      title: `⏰ Za godzinę: ${e.title}`,
      body,
      tag: 'event-reminder',
      url: `/?date=${date}`,
    })

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
      if (results[i].status === 'rejected' && results[i].reason?.statusCode === 410)
        expired.push(sub.endpoint)
    })
  }

  if (expired.length) {
    await supabase.from('push_subscriptions').delete().in('endpoint', [...new Set(expired)])
  }

  return Response.json({ ok: true, sent, events: events.length })
}

export const config = { path: '/api/event-reminder' }
