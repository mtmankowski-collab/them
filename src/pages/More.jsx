import { useState } from 'react'
import { IconShoppingCart, IconBook, IconMapPin, IconSunHigh, IconChevronLeft } from '@tabler/icons-react'
import Shopping from './subpages/Shopping'
import Knowledge from './subpages/Knowledge'
import Places from './subpages/Places'
import Vacations from './subpages/Vacations'

const TILES = [
  { id: 'shopping', label: 'Zakupy', icon: IconShoppingCart, color: '#C4703A' },
  { id: 'knowledge', label: 'Baza wiedzy', icon: IconBook, color: '#378ADD' },
  { id: 'places', label: 'Miejsca', icon: IconMapPin, color: '#7D9B7A' },
  { id: 'vacations', label: 'Wakacje', icon: IconSunHigh, color: '#F5A623' },
]

const SUBPAGES = { shopping: Shopping, knowledge: Knowledge, places: Places, vacations: Vacations }
const TITLES = { shopping: 'Zakupy', knowledge: 'Baza wiedzy', places: 'Miejsca', vacations: 'Wakacje' }

export default function More({ user }) {
  const [active, setActive] = useState(null)

  if (active) {
    const Sub = SUBPAGES[active]
    return (
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div style={styles.subHeader}>
          <button onClick={() => setActive(null)} style={styles.backBtn}>
            <IconChevronLeft size={20} />
            <span>Więcej</span>
          </button>
          <span style={styles.subTitle}>{TITLES[active]}</span>
          <div style={{ width: 60 }} />
        </div>
        <Sub user={user} />
      </div>
    )
  }

  return (
    <div className="page" style={{ padding: '16px', paddingBottom: 'calc(var(--nav-height) + var(--safe-bottom) + 24px)' }}>
      <div style={styles.grid}>
        {TILES.map(t => {
          const Icon = t.icon
          return (
            <button key={t.id} style={styles.tile} onClick={() => setActive(t.id)}>
              <div style={{ ...styles.tileIcon, background: t.color + '18' }}>
                <Icon size={28} style={{ color: t.color }} strokeWidth={1.5} />
              </div>
              <span style={styles.tileLabel}>{t.label}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

const styles = {
  grid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 },
  tile: {
    background: 'var(--white)',
    border: '0.5px solid var(--border)',
    borderRadius: 'var(--radius)',
    padding: '24px 16px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 12,
    aspectRatio: '1',
    transition: 'transform 0.15s',
  },
  tileIcon: { width: 56, height: 56, borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center' },
  tileLabel: { fontSize: 14, fontWeight: 500, color: 'var(--text)' },
  subHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '14px 16px 10px',
    borderBottom: '0.5px solid var(--border)',
    flexShrink: 0,
  },
  backBtn: { display: 'flex', alignItems: 'center', gap: 4, color: 'var(--accent-m)', fontSize: 15, fontWeight: 500 },
  subTitle: { fontFamily: "'DM Serif Display', serif", fontSize: 18 },
}
