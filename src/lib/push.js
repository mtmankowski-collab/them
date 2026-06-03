import { supabase } from './supabase'

const VAPID_PUBLIC_KEY = 'BPo3Ry4qTXS3dqrLNX6vkVgfKDbwFoad8SILQyFEOZbcxSmSAKHQuDPsOPjOZIrf-OYchFUtb1LWSAFgntWIK8g'

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const raw = atob(base64)
  return Uint8Array.from([...raw].map(c => c.charCodeAt(0)))
}

export async function subscribeToPush() {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) return false
  try {
    const reg = await navigator.serviceWorker.ready
    let sub = await reg.pushManager.getSubscription()
    if (!sub) {
      sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
      })
    }
    const j = sub.toJSON()
    await supabase.from('push_subscriptions').upsert({
      endpoint: j.endpoint,
      p256dh: j.keys.p256dh,
      auth: j.keys.auth,
    }, { onConflict: 'endpoint' })
    return true
  } catch (e) {
    console.error('push subscribe error', e)
    return false
  }
}

export async function sendPush(title, body, tag = 'them') {
  try {
    await fetch('/api/send-push', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, body, tag }),
    })
  } catch {}
}
