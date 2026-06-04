export async function verifyPin(pin) {
  try {
    const res = await fetch('/api/verify-pin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pin }),
    })
    if (!res.ok) return null
    const { token } = await res.json()
    return token || null
  } catch {
    return null
  }
}
