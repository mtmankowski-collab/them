export async function notifyOther(title, body, url = '/') {
  try {
    const token = sessionStorage.getItem('them_session_token')
    if (!token) return
    await fetch('/api/notify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-session-token': token },
      body: JSON.stringify({ title, body, url }),
    })
  } catch {}
}
