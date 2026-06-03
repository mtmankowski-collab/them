export async function requestNotificationPermission() {
  if (!('Notification' in window)) return false
  if (Notification.permission === 'granted') return true
  if (Notification.permission === 'denied') return false
  const result = await Notification.requestPermission()
  return result === 'granted'
}

export async function notify(title, body) {
  if (!('Notification' in window) || Notification.permission !== 'granted') return
  const icon = '/icons/icon-192.png'
  if ('serviceWorker' in navigator) {
    try {
      const reg = await navigator.serviceWorker.ready
      reg.showNotification(title, { body, icon, badge: icon, vibrate: [100, 50, 100] })
      return
    } catch {}
  }
  new Notification(title, { body, icon })
}

const scheduledIds = new Set()

export function scheduleUpcomingEventNotifications(events) {
  const now = new Date()
  events.forEach(ev => {
    if (scheduledIds.has(ev.id)) return
    const timeStr = ev.time_start?.slice(0, 5) || '09:00'
    const eventDate = new Date(`${ev.date}T${timeStr}:00`)
    const msUntil = eventDate - now

    // notify 30 min before
    const notifyAt = msUntil - 30 * 60 * 1000
    if (notifyAt > 0 && notifyAt < 24 * 60 * 60 * 1000) {
      scheduledIds.add(ev.id)
      setTimeout(() => {
        notify(`⏰ Za 30 min: ${ev.title}`, ev.location ? `📍 ${ev.location}` : `Dziś o ${timeStr}`)
      }, notifyAt)
    }
    // notify at event time (if in future, within 24h)
    if (msUntil > 0 && msUntil < 24 * 60 * 60 * 1000) {
      scheduledIds.add(ev.id + '_at')
      setTimeout(() => {
        notify(`📅 Teraz: ${ev.title}`, ev.location ? `📍 ${ev.location}` : `Zaczyna się teraz`)
      }, msUntil)
    }
  })
}

export function notifyNewShoppingItem(title, addedBy) {
  const who = addedBy === 'a' ? 'Maniek' : addedBy === 'b' ? 'Ula' : 'Ktoś'
  notify('🛒 Nowy produkt na liście', `${who} dodał/a: ${title}`)
}

export function notifyNewEvent(title, date, time) {
  notify('📅 Nowe wydarzenie w kalendarzu', `${title} · ${date} o ${time}`)
}
