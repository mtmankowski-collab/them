import { supabase } from './supabase'

const VAPID_PUBLIC_KEY = 'BMcZb5l5aEogdz6Q_RkxuZvVED3ty88cMIMgfusmbXUXkosDzmiPu5QtZBbVGvUv-9oM3r-0Z12yjpOt7leSgI0'

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const raw = atob(base64)
  return Uint8Array.from([...raw].map(c => c.charCodeAt(0)))
}

export async function subscribeToPush() {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    console.error('push: SW or PushManager not supported')
    return false
  }
  try {
    console.log('push: waiting for SW...')
    const swTimeout = new Promise((_, rej) => setTimeout(() => rej(new Error('SW timeout')), 8000))
    const reg = await Promise.race([navigator.serviceWorker.ready, swTimeout])
    console.log('push: SW ready')
    let sub = await reg.pushManager.getSubscription()
    if (!sub) {
      console.log('push: creating new subscription...')
      sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
      })
    }
    console.log('push: saving to DB...')
    const j = sub.toJSON()
    const { error } = await supabase.from('push_subscriptions').upsert({
      endpoint: j.endpoint,
      p256dh: j.keys.p256dh,
      auth: j.keys.auth,
    }, { onConflict: 'endpoint' })
    if (error) { console.error('push: DB error', error); return false }
    console.log('push: done OK')
    return true
  } catch (e) {
    console.error('push subscribe error', e)
    return false
  }
}

export async function sendPush(title, body, tag = 'them', url = '/') {
  try {
    const res = await fetch('/api/send-push', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-push-token': import.meta.env.VITE_PUSH_TOKEN || '',
      },
      body: JSON.stringify({ title, body, tag, url }),
    })
    const data = await res.json().catch(() => ({}))
    console.log('sendPush response:', res.status, data)
  } catch (e) {
    console.error('sendPush error:', e)
  }
}
