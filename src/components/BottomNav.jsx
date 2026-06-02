import { useNavigate, useLocation } from 'react-router-dom'
import {
  IconSun, IconCalendar, IconWallet, IconMovie, IconDots
} from '@tabler/icons-react'

const TABS = [
  { path: '/', icon: IconSun, label: 'Dziś' },
  { path: '/kalendarz', icon: IconCalendar, label: 'Kalendarz' },
  { path: '/finanse', icon: IconWallet, label: 'Finanse' },
  { path: '/filmy', icon: IconMovie, label: 'Filmy' },
  { path: '/wiecej', icon: IconDots, label: 'Więcej' },
]

export default function BottomNav({ user }) {
  const navigate = useNavigate()
  const { pathname } = useLocation()

  return (
    <nav style={styles.nav}>
      {TABS.map(({ path, icon: Icon, label }) => {
        const active = pathname === path
        return (
          <button key={path} style={styles.tab} onClick={() => navigate(path)}>
            <Icon
              size={24}
              strokeWidth={active ? 2 : 1.5}
              style={{ color: active ? user?.color || 'var(--accent-m)' : 'var(--text-secondary)' }}
            />
            <span style={{
              ...styles.label,
              color: active ? user?.color || 'var(--accent-m)' : 'var(--text-secondary)',
              fontWeight: active ? 600 : 400,
            }}>
              {label}
            </span>
          </button>
        )
      })}
    </nav>
  )
}

const styles = {
  nav: {
    display: 'flex',
    background: 'rgba(248,247,242,0.92)',
    backdropFilter: 'blur(12px)',
    borderTop: '0.5px solid var(--border)',
    paddingBottom: 'var(--safe-bottom)',
    height: 'var(--nav-height)',
    flexShrink: 0,
  },
  tab: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
    paddingBottom: 4,
    transition: 'opacity 0.1s',
  },
  label: {
    fontSize: 10,
    letterSpacing: '0.02em',
  },
}
