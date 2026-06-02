import Icon from '../components/Icon'
import { Avatar, Card, ScreenHead, SectionTitle } from '../components/ui'

const SERIF = "'Bodoni Moda', Georgia, serif"

export default function More({ dark, onToggleDark, onLogout, onGo, shoppingCount, knowledgeCount, placesCount, tripsCount, inspoCount }) {
  const items = [
    { id: 'shopping',   icon: 'cart',  title: 'Lista zakupów',        sub: `${shoppingCount || 0} do kupienia`,  color: 'var(--a)' },
    { id: 'knowledge',  icon: 'key',   title: 'Baza wiedzy',          sub: `${knowledgeCount || 0} wpisów`,      color: 'var(--b)' },
    { id: 'places',     icon: 'pin',   title: 'Ulubione miejsca',     sub: `${placesCount || 0} miejsc`,         color: 'var(--a-deep)' },
    { id: 'trips',      icon: 'plane', title: 'Wishlist podróży',     sub: `${tripsCount || 0} plany`,           color: 'var(--b-deep)' },
    { id: 'inspo',      icon: 'tag',   title: 'Inspiracje zakupowe',  sub: `${inspoCount || 0} linków`,          color: 'var(--a)' },
  ]

  return (
    <div className="screen">
      <ScreenHead sub="Wasza przestrzeń" title="Więcej" />

      <Card pad={14} style={{ marginBottom: 18, display: 'flex', alignItems: 'center', gap: 13 }}>
        <Avatar who="shared" size={44} />
        <div style={{ flex: 1 }}>
          <div style={{ font: `500 17px/1.1 ${SERIF}`, color: 'var(--ink)' }}>Maniek &amp; Ula</div>
          <div style={{ font: '400 12px/1 var(--font-sans)', color: 'var(--ink-2)', marginTop: 4 }}>Wspólne konto TheM</div>
        </div>
        <button onClick={onLogout} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'var(--cream-warm)',
          border: '1px solid var(--line)', cursor: 'pointer', borderRadius: 'var(--r-pill)', padding: '8px 13px',
          font: '500 12px/1 var(--font-sans)', color: 'var(--ink)' }}>
          <Icon name="lock" size={14} color="var(--ink-2)" />Wyloguj
        </button>
      </Card>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 18 }}>
        {items.map(it => (
          <Card key={it.id} pad={16} onClick={() => onGo(it.id)} style={{ cursor: 'pointer' }}>
            <div style={{ width: 44, height: 44, borderRadius: 14, background: it.color,
              display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14 }}>
              <Icon name={it.icon} size={22} color="#fff" stroke={1.7} />
            </div>
            <div style={{ font: `500 16px/1.15 ${SERIF}`, color: 'var(--ink)', marginBottom: 5 }}>{it.title}</div>
            <div style={{ font: '400 12px/1 var(--font-sans)', color: 'var(--ink-2)' }}>{it.sub}</div>
          </Card>
        ))}
      </div>

      <SectionTitle title="Ustawienia" />
      <Card pad={0}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 13, padding: '14px 16px' }}>
          <Icon name="sparkle" size={20} color="var(--ink-2)" />
          <div style={{ flex: 1 }}>
            <div style={{ font: '500 14.5px/1 var(--font-sans)', color: 'var(--ink)' }}>Tryb ciemny</div>
            <div style={{ font: '400 11.5px/1 var(--font-sans)', color: 'var(--ink-2)', marginTop: 4 }}>
              {dark ? 'Ciemne tło' : 'Kremowe tło'}
            </div>
          </div>
          <Switch on={dark} onClick={onToggleDark} />
        </div>
        {[
          { icon: 'bell', label: 'Powiadomienia' },
          { icon: 'lock', label: 'Prywatność i PIN' },
          { icon: 'settings', label: 'Ustawienia ogólne' },
        ].map((r, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 13, padding: '14px 16px',
            borderTop: '1px solid var(--line)' }}>
            <Icon name={r.icon} size={20} color="var(--ink-2)" />
            <span style={{ flex: 1, font: '500 14.5px/1 var(--font-sans)', color: 'var(--ink)' }}>{r.label}</span>
            <Icon name="chevron" size={18} color="var(--ink-3)" />
          </div>
        ))}
      </Card>

      <div style={{ textAlign: 'center', marginTop: 26, font: '400 12px/1.5 var(--font-sans)', color: 'var(--ink-3)' }}>
        Maniek &amp; Ula · razem od 2019
      </div>
    </div>
  )
}

function Switch({ on, onClick }) {
  return (
    <button onClick={onClick} style={{ width: 46, height: 28, borderRadius: 999, border: 'none', cursor: 'pointer',
      background: on ? 'var(--a)' : 'var(--line-strong)', position: 'relative', transition: 'background .2s ease', flexShrink: 0 }}>
      <span style={{ position: 'absolute', top: 3, left: on ? 21 : 3, width: 22, height: 22, borderRadius: '50%',
        background: '#fff', transition: 'left .2s ease', boxShadow: '0 1px 3px rgba(0,0,0,.25)' }} />
    </button>
  )
}
