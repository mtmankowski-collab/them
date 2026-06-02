import { useState, useEffect } from 'react'
import { fetchUsers, verifyPin } from '../lib/auth'

const KEYS = ['1','2','3','4','5','6','7','8','9','','0','⌫']

export default function LoginScreen({ onLogin }) {
  const [users, setUsers] = useState([])
  const [selected, setSelected] = useState(null)
  const [pin, setPin] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => { fetchUsers().then(setUsers) }, [])

  useEffect(() => {
    if (pin.length === 4 && selected) {
      handleVerify()
    }
  }, [pin])

  async function handleVerify() {
    setLoading(true)
    setError('')
    const user = await verifyPin(selected.id, pin)
    if (user) {
      onLogin(user)
    } else {
      setError('Nieprawidłowy PIN')
      setPin('')
    }
    setLoading(false)
  }

  function handleKey(k) {
    if (k === '⌫') {
      setPin(p => p.slice(0, -1))
      setError('')
    } else if (k !== '' && pin.length < 4) {
      setPin(p => p + k)
    }
  }

  function selectUser(u) {
    setSelected(u)
    setPin('')
    setError('')
  }

  return (
    <div style={styles.container}>
      <div style={styles.logo}>TheM</div>
      <p style={styles.subtitle}>Tylko dla nas.</p>

      {!selected ? (
        <div style={styles.userPicker}>
          {users.map(u => (
            <button key={u.id} style={styles.userBtn} onClick={() => selectUser(u)}>
              <div style={{ ...styles.bigAvatar, background: u.color }}>
                {u.initials}
              </div>
              <span style={styles.userName}>{u.name}</span>
            </button>
          ))}
        </div>
      ) : (
        <div style={styles.pinSection}>
          <button style={styles.backBtn} onClick={() => setSelected(null)}>
            ← zmień osobę
          </button>
          <div style={{ ...styles.bigAvatar, background: selected.color, margin: '0 auto 8px' }}>
            {selected.initials}
          </div>
          <p style={styles.userName}>{selected.name}</p>

          <div style={styles.dots}>
            {[0,1,2,3].map(i => (
              <div key={i} style={{ ...styles.dot, background: i < pin.length ? selected.color : 'var(--border)' }} />
            ))}
          </div>

          {error && <p style={styles.error}>{error}</p>}

          <div style={styles.keypad}>
            {KEYS.map((k, i) => (
              <button
                key={i}
                style={{ ...styles.key, opacity: k === '' ? 0 : 1 }}
                onClick={() => handleKey(k)}
                disabled={loading}
              >
                {k}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

const styles = {
  container: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '32px 24px',
    gap: 0,
  },
  logo: {
    fontFamily: "'DM Serif Display', serif",
    fontSize: 52,
    color: 'var(--accent-m)',
    lineHeight: 1,
    marginBottom: 8,
  },
  subtitle: {
    color: 'var(--text-secondary)',
    fontSize: 16,
    marginBottom: 48,
    letterSpacing: '0.02em',
  },
  userPicker: {
    display: 'flex',
    gap: 20,
  },
  userBtn: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 10,
    padding: '20px 28px',
    background: 'var(--white)',
    border: '0.5px solid var(--border)',
    borderRadius: 20,
    transition: 'transform 0.15s',
  },
  bigAvatar: {
    width: 64,
    height: 64,
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 24,
    fontWeight: 700,
    color: '#fff',
  },
  userName: {
    fontSize: 15,
    fontWeight: 500,
    color: 'var(--text)',
  },
  pinSection: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    width: '100%',
    maxWidth: 320,
  },
  backBtn: {
    fontSize: 13,
    color: 'var(--text-secondary)',
    marginBottom: 20,
    alignSelf: 'flex-start',
  },
  dots: {
    display: 'flex',
    gap: 14,
    margin: '20px 0 10px',
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: '50%',
    transition: 'background 0.15s',
  },
  error: {
    color: '#e05',
    fontSize: 13,
    marginBottom: 4,
  },
  keypad: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: 12,
    marginTop: 24,
    width: '100%',
    maxWidth: 280,
  },
  key: {
    width: '100%',
    aspectRatio: '1',
    borderRadius: '50%',
    background: 'var(--white)',
    border: '0.5px solid var(--border)',
    fontSize: 22,
    fontWeight: 400,
    color: 'var(--text)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'background 0.1s',
    margin: '0 auto',
    maxWidth: 72,
  },
}
