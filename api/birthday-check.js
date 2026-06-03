import webpush from 'web-push'
import { createClient } from '@supabase/supabase-js'

webpush.setVapidDetails(
  'mailto:mt.mankowski@gmail.com',
  process.env.VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
)

export default async function handler(req, res) {
  // Protect cron endpoint
  if (req.headers.authorization !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).end()
  }

  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY
  )

  const today = new Date()
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)

  const fmt = d => `${String(d.getDate()).padStart(2,'0')}.${String(d.getMonth()+1).padStart(2,'0')}`
  const todayStr = fmt(today)
  const tomorrowStr = fmt(tomorrow)

  const [{ data: birthdays }, { data: subs }] = await Promise.all([
    supabase.from('birthdays').select('*'),
    supabase.from('push_subscriptions').select('*'),
  ])

  if (!subs?.length || !birthdays?.length) return res.json({ ok: true, sent: 0 })

  const notifications = []

  birthdays.forEach(b => {
    if (b.date === todayStr) {
      const age = b.year ? ` (${today.getFullYear() - b.year} lat)` : ''
      notifications.push({ title: `🎂 Dziś urodziny!`, body: `${b.name}${age}` })
    }
    if (b.date === tomorrowStr) {
      const age = b.year ? ` (${tomorrow.getFullYear() - b.year} lat)` : ''
      notifications.push({ title: `🎂 Jutro urodziny`, body: `${b.name}${age} — pamiętaj!` })
    }
  })

  let sent = 0
  const expired = []

  for (const notif of notifications) {
    const payload = JSON.stringify({ title: notif.title, body: notif.body, tag: 'birthday' })
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

  res.json({ ok: true, sent, notifications: notifications.length })
}
