export async function notifyOther(title, body, url = '/') {
  try {
    await fetch('/api/notify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-push-token': import.meta.env.VITE_NOTIFY_TOKEN || '' },
      body: JSON.stringify({ title, body, url }),
    })
  } catch {}
}
