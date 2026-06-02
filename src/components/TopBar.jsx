export default function TopBar({ user, onLogout, title }) {
  return (
    <header style={styles.bar}>
      <span style={styles.title}>{title}</span>
      <button style={styles.avatarBtn} onClick={onLogout} title="Wyloguj">
        <div style={{ ...styles.avatar, background: user?.color || 'var(--accent-m)' }}>
          {user?.initials || '?'}
        </div>
      </button>
    </header>
  )
}

const styles = {
  bar: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '14px 20px 10px',
    background: 'var(--bg)',
    borderBottom: '0.5px solid var(--border)',
    flexShrink: 0,
    paddingTop: 'max(14px, env(safe-area-inset-top))',
  },
  title: {
    fontFamily: "'DM Serif Display', serif",
    fontSize: 22,
    color: 'var(--text)',
  },
  avatarBtn: { padding: 0 },
  avatar: {
    width: 34,
    height: 34,
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 14,
    fontWeight: 700,
    color: '#fff',
  },
}
