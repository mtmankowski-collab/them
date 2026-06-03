import Icon from './Icon'

const TABS = [
  { id: 'today',    label: 'Dziś',     icon: 'today' },
  { id: 'calendar', label: 'Kalendarz', icon: 'calendar' },
  { id: 'finance',  label: 'Finanse',   icon: 'finance' },
  { id: 'films',    label: 'Filmy',     icon: 'film' },
  { id: 'more',     label: 'Więcej',    icon: 'more' },
]

export default function BottomNav({ page, onNavigate }) {
  return (
    <div className="bottomnav">
      {TABS.map(t => {
        const active = page === t.id
        return (
          <button key={t.id} className="navitem" onClick={() => onNavigate(t.id)}>
            {active && <span className="navdot" />}            <Icon name={t.icon} size={24} color={active ? 'var(--a)' : 'var(--ink-3)'} stroke={active ? 2 : 1.6} />
            <span style={{ font: '500 10px/1 var(--font-sans)', letterSpacing: '.03em',
              color: active ? 'var(--ink)' : 'var(--ink-3)' }}>{t.label}</span>
          </button>
        )
      })}
    </div>
  )
}
