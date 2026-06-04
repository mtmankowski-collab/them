import { useState } from 'react'
import Icon from '../components/Icon'
import { Avatar, Card, ScreenHead, SectionTitle, Sheet, Field, TextInput } from '../components/ui'
import { supabase } from '../lib/supabase'
import { requestNotificationPermission } from '../lib/notifications'
import { subscribeToPush } from '../lib/push'
import couplePhoto from '../assets/couple.jpg'

const SERIF = "'Bodoni Moda', Georgia, serif"

export default function More({ dark, onToggleDark, onLogout, onGo, shoppingCount, knowledgeCount, placesCount, tripsCount, inspoCount }) {
  const [pinSheetOpen, setPinSheetOpen] = useState(false)
  const [notifStatus, setNotifStatus] = useState(() => {
    if (!('Notification' in window)) return 'unsupported'
    return Notification.permission
  })
  const [notifRefreshed, setNotifRefreshed] = useState(false)
  const [pinF, setPinF] = useState({ current: '', next: '', confirm: '' })
  const [pinError, setPinError] = useState('')
  const [pinSuccess, setPinSuccess] = useState(false)

  const items = [
    { id: 'shopping',   icon: 'cart',  title: 'Lista zakupów',        sub: `${shoppingCount || 0} do kupienia`,  color: 'var(--a)' },
    { id: 'knowledge',  icon: 'key',   title: 'Baza wiedzy',          sub: `${knowledgeCount || 0} wpisów`,      color: 'var(--b)' },
    { id: 'places',     icon: 'pin',   title: 'Ulubione miejsca',     sub: `${placesCount || 0} miejsc`,         color: 'var(--a-deep)' },
    { id: 'trips',      icon: 'plane', title: 'Wishlist podróży',     sub: `${tripsCount || 0} plany`,           color: 'var(--b-deep)' },
    { id: 'inspo',      icon: 'tag',   title: 'Inspiracje zakupowe',  sub: `${inspoCount || 0} linków`,          color: 'var(--a)' },
  ]

  async function enableNotifications() {
    if (notifStatus === 'granted') {
      const ok = await subscribeToPush()
      if (ok) { setNotifRefreshed(true); setTimeout(() => setNotifRefreshed(false), 2000) }
      return
    }
    const granted = await requestNotificationPermission()
    setNotifStatus(granted ? 'granted' : 'denied')
    if (granted) subscribeToPush()
  }

  function openPinSheet() {
    setPinF({ current: '', next: '', confirm: '' })
    setPinError('')
    setPinSuccess(false)
    setPinSheetOpen(true)
  }

  async function submitPinChange() {
    setPinError('')
    if (pinF.current.length !== 4) { setPinError('Aktualny PIN musi mieć 4 cyfry'); return }
    if (pinF.next.length !== 4) { setPinError('Nowy PIN musi mieć 4 cyfry'); return }
    if (pinF.next !== pinF.confirm) { setPinError('Nowe PINy nie są zgodne'); return }
    // Verify current PIN
    const { data } = await supabase.from('users').select('pin').limit(1).single()
    const currentPin = data?.pin
    if (!currentPin || pinF.current !== currentPin) { setPinError('Aktualny PIN jest nieprawidłowy'); return }
    // Save new PIN
    const { error } = await supabase.from('users').update({ pin: pinF.next }).eq('pin', currentPin)
    if (error) { setPinError('Błąd zapisu — spróbuj ponownie'); return }
    setPinSuccess(true)
    setTimeout(() => setPinSheetOpen(false), 1200)
  }

  const notifLabel = notifRefreshed ? 'Zarejestrowano ✓' : notifStatus === 'granted' ? 'Włączone — kliknij aby odświeżyć' : notifStatus === 'denied' ? 'Zablokowane (zmień w przeglądarce)' : notifStatus === 'unsupported' ? 'Niedostępne' : 'Włącz powiadomienia'

  return (
    <div className="screen">
      <ScreenHead sub="Wasza przestrzeń" title="Więcej" />

      <Card pad={14} style={{ marginBottom: 18, display: 'flex', alignItems: 'center', gap: 13 }}>
        <div style={{ width: 44, height: 44, borderRadius: '50%', overflow: 'hidden', flexShrink: 0, border: '1px solid var(--line)' }}>
          <img src={couplePhoto} alt="Maniek & Ula" style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center top' }} />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ font: `500 17px/1.1 ${SERIF}`, color: 'var(--ink)' }}>Maniek &amp; Ula</div>
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
        {/* Dark mode */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 13, padding: '14px 16px' }}>
          <Icon name="sparkle" size={20} color="var(--ink-2)" />
          <div style={{ flex: 1 }}>
            <div style={{ font: '500 14.5px/1 var(--font-sans)', color: 'var(--ink)' }}>Tryb ciemny</div>
          </div>
          <Switch on={dark} onClick={onToggleDark} />
        </div>

        {/* Notifications */}
        <div onClick={notifStatus !== 'denied' && notifStatus !== 'unsupported' ? enableNotifications : undefined}
          style={{ display: 'flex', alignItems: 'center', gap: 13, padding: '14px 16px',
            borderTop: '1px solid var(--line)', cursor: notifStatus !== 'denied' && notifStatus !== 'unsupported' ? 'pointer' : 'default' }}>
          <Icon name="bell" size={20} color={notifStatus === 'granted' ? 'var(--a)' : 'var(--ink-2)'} />
          <div style={{ flex: 1 }}>
            <div style={{ font: '500 14.5px/1 var(--font-sans)', color: 'var(--ink)' }}>Powiadomienia</div>
            <div style={{ font: '400 11.5px/1 var(--font-sans)', color: notifStatus === 'granted' ? 'var(--a)' : 'var(--ink-3)', marginTop: 4 }}>
              {notifLabel}
            </div>
          </div>
          {notifStatus === 'default' && <Icon name="chevron" size={18} color="var(--ink-3)" />}
        </div>

        {/* PIN */}
        <div onClick={openPinSheet}
          style={{ display: 'flex', alignItems: 'center', gap: 13, padding: '14px 16px',
            borderTop: '1px solid var(--line)', cursor: 'pointer' }}>
          <Icon name="lock" size={20} color="var(--ink-2)" />
          <div style={{ flex: 1 }}>
            <div style={{ font: '500 14.5px/1 var(--font-sans)', color: 'var(--ink)' }}>Prywatność i PIN</div>
            <div style={{ font: '400 11.5px/1 var(--font-sans)', color: 'var(--ink-3)', marginTop: 4 }}>Zmień PIN dostępu do aplikacji</div>
          </div>
          <Icon name="chevron" size={18} color="var(--ink-3)" />
        </div>
      </Card>

      <div style={{ textAlign: 'center', marginTop: 26, font: '400 12px/1.5 var(--font-sans)', color: 'var(--ink-3)' }}>
        Maniek &amp; Ula · razem od 2019
      </div>

      {/* PIN Change Sheet */}
      <Sheet open={pinSheetOpen} title="Zmień PIN"
        onClose={() => setPinSheetOpen(false)}
        onSubmit={submitPinChange}
        submitLabel={pinSuccess ? '✓ Zmieniono!' : 'Zmień PIN'}
        accent="var(--ink)">
        <Field label="Aktualny PIN">
          <TextInput value={pinF.current} onChange={v => setPinF(p => ({...p, current: v.replace(/\D/g,'').slice(0,4)})) } placeholder="••••" type="number" />
        </Field>
        <Field label="Nowy PIN">
          <TextInput value={pinF.next} onChange={v => setPinF(p => ({...p, next: v.replace(/\D/g,'').slice(0,4)}))} placeholder="••••" type="number" />
        </Field>
        <Field label="Powtórz nowy PIN">
          <TextInput value={pinF.confirm} onChange={v => setPinF(p => ({...p, confirm: v.replace(/\D/g,'').slice(0,4)}))} placeholder="••••" type="number" />
        </Field>
        {pinError && (
          <div style={{ font: '400 13px/1.4 var(--font-sans)', color: '#B6543F', padding: '8px 12px',
            background: 'rgba(182,84,63,.08)', borderRadius: 8, border: '1px solid rgba(182,84,63,.2)' }}>
            {pinError}
          </div>
        )}
        {pinSuccess && (
          <div style={{ font: '500 13.5px/1.4 var(--font-sans)', color: 'var(--paid)', padding: '8px 12px',
            background: 'rgba(76,175,80,.08)', borderRadius: 8, border: '1px solid rgba(76,175,80,.2)', textAlign: 'center' }}>
            PIN został zmieniony!
          </div>
        )}
      </Sheet>
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
