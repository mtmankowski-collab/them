import Icon from './Icon'
import { PEOPLE, personColor, personSoft } from '../lib/supabase'

export function Avatar({ who, size = 34 }) {
  const p = PEOPLE[who] || PEOPLE.shared
  if (who === 'shared') {
    return (
      <div style={{ width: size, height: size, borderRadius: '50%', overflow: 'hidden', display: 'flex',
        boxShadow: 'inset 0 0 0 1px rgba(42,38,34,.08)', flexShrink: 0 }}>
        <div style={{ width: '50%', background: 'var(--a)' }} />
        <div style={{ width: '50%', background: 'var(--b)' }} />
      </div>
    )
  }
  return (
    <div style={{ width: size, height: size, borderRadius: '50%', background: p.color, color: '#fff',
      display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
      font: `500 ${Math.round(size * 0.42)}px/1 var(--font-sans)`, letterSpacing: '.01em' }}>
      {p.initial}
    </div>
  )
}

export function PersonDot({ who, size = 8 }) {
  if (who === 'shared') {
    return <span style={{ width: size, height: size, borderRadius: '50%', display: 'inline-block', flexShrink: 0,
      background: 'linear-gradient(90deg, var(--a) 0 50%, var(--b) 50% 100%)' }} />
  }
  return <span style={{ width: size, height: size, borderRadius: '50%',
    background: who === 'a' ? 'var(--a)' : 'var(--b)', display: 'inline-block', flexShrink: 0 }} />
}

export function Label({ children, style }) {
  return (
    <div style={{ font: '500 11px/1 var(--font-sans)', letterSpacing: '.14em', textTransform: 'uppercase',
      color: 'var(--ink-3)', ...style }}>{children}</div>
  )
}

export function Card({ children, style, onClick, pad = 16 }) {
  return (
    <div onClick={onClick} style={{ background: 'var(--surface)', borderRadius: 'var(--r-lg)', padding: pad,
      boxShadow: 'var(--sh-1)', border: '1px solid var(--line)', cursor: onClick ? 'pointer' : undefined, ...style }}>
      {children}
    </div>
  )
}

export function Segmented({ options, value, onChange }) {
  return (
    <div style={{ display: 'flex', gap: 3, background: 'var(--cream-warm)', borderRadius: 'var(--r-pill)',
      padding: 3, border: '1px solid var(--line)' }}>
      {options.map(o => {
        const active = o.value === value
        return (
          <button key={o.value} onClick={() => onChange(o.value)} style={{
            flex: 1, border: 'none', cursor: 'pointer', borderRadius: 'var(--r-pill)', padding: '8px 10px',
            font: '500 13px/1 var(--font-sans)', letterSpacing: '.01em',
            background: active ? 'var(--surface)' : 'transparent',
            color: active ? 'var(--ink)' : 'var(--ink-2)',
            boxShadow: active ? 'var(--sh-1)' : 'none', transition: 'all .18s ease' }}>
            {o.label}
          </button>
        )
      })}
    </div>
  )
}

function StarShape({ filled, size = 13, stroke = 1.4 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" style={{ display: 'block' }}>
      <path d="M12 3.5l2.6 5.3 5.9.9-4.2 4.1 1 5.8L12 17l-5.3 2.6 1-5.8-4.2-4.1 5.9-.9z"
        fill={filled ? 'var(--star)' : 'none'}
        stroke={filled ? 'var(--star)' : 'var(--line-strong)'}
        strokeWidth={stroke} strokeLinejoin="round" />
    </svg>
  )
}

export function Stars({ value, size = 13 }) {
  return (
    <span style={{ display: 'inline-flex', gap: 2 }}>
      {[1,2,3,4,5].map(i => <StarShape key={i} filled={i <= value} size={size} />)}
    </span>
  )
}

export function StarRate({ value, onChange, size = 18 }) {
  return (
    <span style={{ display: 'inline-flex', gap: 3 }}>
      {[1,2,3,4,5].map(i => (
        <button key={i} onClick={e => { e.stopPropagation(); onChange(i) }}
          style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', lineHeight: 0 }}>
          <StarShape filled={i <= value} size={size} stroke={1.5} />
        </button>
      ))}
    </span>
  )
}

export function EmptyState({ icon, title, sub, action }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      textAlign: 'center', padding: '48px 28px', gap: 10 }}>
      <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'var(--cream-warm)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--line)', marginBottom: 4 }}>
        <Icon name={icon} size={28} color="var(--ink-3)" stroke={1.5} />
      </div>
      <div style={{ font: '500 18px/1.2 var(--font-serif)', color: 'var(--ink)' }}>{title}</div>
      <div style={{ font: '400 13.5px/1.5 var(--font-sans)', color: 'var(--ink-2)', maxWidth: 220 }}>{sub}</div>
      {action && <div style={{ marginTop: 6 }}>{action}</div>}
    </div>
  )
}

export function ScreenHead({ title, sub, right, onBack }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 10, padding: '6px 0 14px' }}>
      {onBack && (
        <button onClick={onBack} style={{ background: 'var(--surface)', border: '1px solid var(--line)',
          width: 38, height: 38, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer', marginBottom: 2, flexShrink: 0 }}>
          <Icon name="back" size={20} color="var(--ink)" />
        </button>
      )}
      <div style={{ flex: 1 }}>
        {sub && <Label style={{ marginBottom: 6 }}>{sub}</Label>}
        <div style={{ font: '400 28px/1.1 var(--font-serif)', color: 'var(--ink)', letterSpacing: '.005em' }}>{title}</div>
      </div>
      {right}
    </div>
  )
}

export function Sheet({ open, title, sub, onClose, onSubmit, onDelete, submitLabel = 'Dodaj', accent = 'var(--ink)', children }) {
  if (!open) return null
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(26,22,18,.42)',
      display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', animation: 'them-fade .2s ease' }}
      onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{ background: 'var(--surface)', borderTopLeftRadius: 26,
        borderTopRightRadius: 26, padding: '10px 20px calc(24px + env(safe-area-inset-bottom, 0px))', maxHeight: '92%',
        overflowY: 'auto', WebkitOverflowScrolling: 'touch', overscrollBehavior: 'contain',
        boxShadow: '0 -12px 40px rgba(26,22,18,.22)', animation: 'them-slideup .26s cubic-bezier(.2,.9,.3,1)' }}>
        <div style={{ width: 38, height: 4, borderRadius: 2, background: 'var(--line-strong)', margin: '0 auto 16px' }} />
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 18 }}>
          <div>
            <div style={{ font: '400 22px/1.1 var(--font-serif)', color: 'var(--ink)' }}>{title}</div>
            {sub && <div style={{ font: '400 13px/1.4 var(--font-sans)', color: 'var(--ink-2)', marginTop: 4 }}>{sub}</div>}
          </div>
          <button onClick={onClose} style={{ background: 'var(--cream-warm)', border: '1px solid var(--line)',
            width: 34, height: 34, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', flexShrink: 0 }}>
            <Icon name="close" size={17} color="var(--ink-2)" />
          </button>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>{children}</div>
        {onSubmit && (
          <button onClick={onSubmit} style={{ width: '100%', marginTop: 22, background: accent, color: '#fff',
            border: 'none', cursor: 'pointer', borderRadius: 'var(--r-md)', padding: '15px',
            font: '600 15px/1 var(--font-sans)', boxShadow: 'var(--sh-1)' }}>{submitLabel}</button>
        )}
        {onDelete && (
          <button onClick={onDelete} style={{ width: '100%', marginTop: 10, background: 'transparent', color: '#B6543F',
            border: '1px solid #B6543F', cursor: 'pointer', borderRadius: 'var(--r-md)', padding: '13px',
            font: '500 14px/1 var(--font-sans)' }}>Usuń</button>
        )}
      </div>
    </div>
  )
}

export function Field({ label, children }) {
  return (
    <label style={{ display: 'block' }}>
      <div style={{ font: '500 12px/1 var(--font-sans)', letterSpacing: '.04em', textTransform: 'uppercase',
        color: 'var(--ink-3)', marginBottom: 9 }}>{label}</div>
      {children}
    </label>
  )
}

export function TextInput({ value, onChange, placeholder, type = 'text', prefix }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 9, background: 'var(--cream-warm)',
      border: '1px solid var(--line)', borderRadius: 'var(--r-md)', padding: '0 14px' }}>
      {prefix && <span style={{ font: '500 14px/1 var(--font-sans)', color: 'var(--ink-3)' }}>{prefix}</span>}
      <input value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} type={type}
        inputMode={type === 'number' ? 'decimal' : undefined}
        style={{ flex: 1, border: 'none', background: 'transparent', outline: 'none', padding: '13px 0',
          font: '400 14.5px/1 var(--font-sans)', color: 'var(--ink)', minWidth: 0 }} />
    </div>
  )
}

export function ChipPicker({ options, value, onChange }) {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
      {options.map(o => {
        const v = o.value !== undefined ? o.value : o
        const lbl = o.label !== undefined ? o.label : o
        const active = v === value
        return (
          <button key={v} onClick={() => onChange(v)} style={{ display: 'inline-flex', alignItems: 'center', gap: 7,
            cursor: 'pointer', borderRadius: 'var(--r-pill)', padding: '9px 14px', font: '500 13px/1 var(--font-sans)',
            background: active ? 'var(--ink)' : 'var(--cream-warm)', color: active ? '#fff' : 'var(--ink-2)',
            border: '1px solid ' + (active ? 'var(--ink)' : 'var(--line)'), transition: 'all .15s ease' }}>
            {o.dot && <span style={{ width: 9, height: 9, borderRadius: '50%', background: o.dot }} />}
            {lbl}
          </button>
        )
      })}
    </div>
  )
}

export function PersonPicker({ value, onChange }) {
  const opts = [
    { value: 'a', label: 'Maniek', dot: 'var(--a)' },
    { value: 'b', label: 'Ula', dot: 'var(--b)' },
    { value: 'shared', label: 'Wspólne', dot: 'var(--shared)' },
  ]
  return <ChipPicker options={opts} value={value} onChange={onChange} />
}

export const navBtn = {
  background: 'var(--surface)', border: '1px solid var(--line)', width: 40, height: 40,
  borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
  cursor: 'pointer', boxShadow: 'var(--sh-1)',
}

export const navBtnSm = {
  background: 'transparent', border: '1px solid var(--line)', width: 36, height: 36,
  borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
}

export function SectionTitle({ title, action, onAction }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '6px 2px 9px', gap: 10 }}>
      <div style={{ flex: 1, minWidth: 0, font: '500 13px/1 var(--font-sans)', letterSpacing: '.06em',
        textTransform: 'uppercase', color: 'var(--ink-2)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{title}</div>
      {action && (
        <button onClick={onAction} style={{ background: 'none', border: 'none', cursor: 'pointer',
          font: '500 12.5px/1 var(--font-sans)', color: 'var(--a)', display: 'flex', alignItems: 'center', gap: 2,
          whiteSpace: 'nowrap', flexShrink: 0 }}>
          {action}<Icon name="chevron" size={14} color="var(--a)" />
        </button>
      )}
    </div>
  )
}

export function AddBtn({ label, color = 'var(--ink)', onClick }) {
  return (
    <button onClick={onClick} style={{ display: 'inline-flex', alignItems: 'center', gap: 7, background: color,
      color: '#fff', border: 'none', cursor: 'pointer', borderRadius: 'var(--r-pill)', padding: '11px 18px',
      font: '500 13.5px/1 var(--font-sans)', boxShadow: 'var(--sh-1)' }}>
      <Icon name="plus" size={17} color="#fff" stroke={2} />{label}
    </button>
  )
}
