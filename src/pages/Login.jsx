import { useState } from 'react'
import Icon from '../components/Icon'
import { verifyPin } from '../lib/auth'

const SERIF = "'Bodoni Moda', Georgia, serif"

export default function Login({ onUnlock }) {
  const [pin, setPin] = useState('')
  const [shake, setShake] = useState(false)

  async function press(d) {
    if (pin.length >= 4) return
    const next = pin + d
    setPin(next)
    if (next.length === 4) {
      setTimeout(async () => {
        const ok = await verifyPin(next)
        if (ok) {
          onUnlock()
        } else {
          setShake(true)
          setTimeout(() => { setShake(false); setPin('') }, 450)
        }
      }, 180)
    }
  }

  const del = () => setPin(p => p.slice(0, -1))
  const keys = ['1','2','3','4','5','6','7','8','9','','0','del']

  return (
    <div style={{ position: 'absolute', inset: 0, background: 'var(--cream)', display: 'flex',
      flexDirection: 'column', alignItems: 'center', justifyContent: 'space-between', padding: '76px 30px 40px' }}>

      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 24, marginTop: 18 }}>
        <div style={{ width: 64, height: 64, borderRadius: '24%', background: 'var(--ink)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: 'var(--sh-2)' }}>
          <span style={{ font: `700 46px/1 ${SERIF}`, color: 'var(--cream)' }}>M</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'baseline', lineHeight: 1 }}>
          <span style={{ font: `400 38px/1 ${SERIF}`, color: 'var(--ink)' }}>The</span>
          <span style={{ font: `700 42px/1 ${SERIF}`, color: 'var(--ink)', marginLeft: '-.10em' }}>M</span>
        </div>
        <div style={{ font: '400 13.5px/1 var(--font-sans)', color: 'var(--ink-2)', letterSpacing: '.04em', marginTop: -10 }}>
          Nasze centrum sterowania
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 22 }}>
        <div style={{ font: '500 11px/1 var(--font-sans)', letterSpacing: '.14em', textTransform: 'uppercase',
          color: 'var(--ink-3)' }}>Wprowadź PIN</div>
        <div style={{ display: 'flex', gap: 16, animation: shake ? 'them-shake .45s ease' : 'none' }}>
          {[0,1,2,3].map(i => (
            <div key={i} style={{ width: 13, height: 13, borderRadius: '50%',
              background: i < pin.length ? 'var(--ink)' : 'transparent',
              border: '1.5px solid ' + (i < pin.length ? 'var(--ink)' : 'var(--line-strong)'),
              transition: 'all .15s ease' }} />
          ))}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 74px)', gap: 16 }}>
        {keys.map((k, i) => {
          if (k === '') return <div key={i} />
          if (k === 'del') return (
            <button key={i} onClick={del} style={keyStyle(true)}>
              <Icon name="back" size={24} color="var(--ink-2)" />
            </button>
          )
          return <button key={i} onClick={() => press(k)} style={keyStyle(false)}>{k}</button>
        })}
      </div>
    </div>
  )
}

function keyStyle(isDel) {
  return {
    width: 74, height: 74, borderRadius: '50%', cursor: 'pointer',
    background: isDel ? 'transparent' : 'var(--surface)',
    border: '1px solid ' + (isDel ? 'transparent' : 'var(--line)'),
    boxShadow: isDel ? 'none' : 'var(--sh-1)',
    font: `400 28px/1 ${SERIF}`, color: 'var(--ink)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  }
}
