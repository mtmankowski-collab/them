import { useState, useEffect, useRef } from 'react'
import Icon from '../components/Icon'
import { Avatar, navBtnSm } from '../components/ui'
import { supabase, personColor, PEOPLE } from '../lib/supabase'

const SERIF = "'Bodoni Moda', Georgia, serif"

export default function Chat({ onBack }) {
  const [msgs, setMsgs] = useState([])
  const [draft, setDraft] = useState('')
  const [sender, setSender] = useState('a')
  const endRef = useRef(null)
  const seenIds = useRef(new Set())

  useEffect(() => {
    supabase.from('board').select('*').order('created_at').then(({ data }) => {
      if (data) {
        const mapped = data.map(m => ({ id: m.id, who: m.author, text: m.message, at: fmtTime(m.created_at) }))
        mapped.forEach(m => seenIds.current.add(m.id))
        setMsgs(mapped)
      }
    })
    const sub = supabase.channel('board-live')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'board' }, payload => {
        const m = payload.new
        if (seenIds.current.has(m.id)) return
        seenIds.current.add(m.id)
        setMsgs(prev => [...prev, { id: m.id, who: m.author, text: m.message, at: fmtTime(m.created_at) }])
      }).subscribe()
    return () => supabase.removeChannel(sub)
  }, [])

  useEffect(() => {
    if (endRef.current) endRef.current.scrollTop = endRef.current.scrollHeight
  }, [msgs])

  async function send() {
    const text = draft.trim()
    if (!text) return
    setDraft('')
    const tmpId = 'tmp-' + Date.now()
    seenIds.current.add(tmpId)
    setMsgs(prev => [...prev, { id: tmpId, who: sender, text, at: 'teraz' }])
    const { data } = await supabase.from('board').insert({ message: text, author: sender }).select().single()
    if (data) {
      seenIds.current.add(data.id)
      setMsgs(prev => prev.map(m => m.id === tmpId ? { id: data.id, who: data.author, text: data.message, at: fmtTime(data.created_at) } : m))
    }
  }

  async function clearChat() {
    if (!window.confirm('Wyczyścić historię rozmowy?')) return
    await supabase.from('board').delete().gte('created_at', '1970-01-01')
    seenIds.current.clear()
    setMsgs([])
  }

  return (
    <div className="screen-full" style={{ background: 'var(--cream)' }}>
      <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--line)', display: 'flex',
        alignItems: 'center', gap: 12, background: 'var(--surface)', flexShrink: 0 }}>
        <button onClick={onBack} style={navBtnSm}><Icon name="back" size={18} color="var(--ink)" /></button>
        <div style={{ display: 'flex', marginRight: 4 }}>
          <Avatar who="a" size={34} />
          <div style={{ marginLeft: -9 }}><Avatar who="b" size={34} /></div>
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ font: `500 16px/1 ${SERIF}`, color: 'var(--ink)' }}>Maniek &amp; Ula</div>
          <div style={{ font: '400 11.5px/1 var(--font-sans)', color: 'var(--ink-2)', marginTop: 3 }}>Wasza rozmowa</div>
        </div>
        <button onClick={clearChat} style={{ background: 'var(--cream-warm)', border: '1px solid var(--line)',
          borderRadius: 'var(--r-pill)', padding: '7px 13px', font: '500 12px/1 var(--font-sans)',
          color: 'var(--ink-2)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
          <Icon name="close" size={13} color="var(--ink-3)" />wyczyść czat
        </button>
      </div>

      <div ref={endRef} style={{ flex: 1, overflowY: 'auto', padding: '18px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div style={{ textAlign: 'center', font: '400 11px/1 var(--font-sans)', color: 'var(--ink-3)', margin: '4px 0 8px' }}>Dzisiaj</div>
        {msgs.map((m, i) => {
          const mine = m.who === sender
          return (
            <div key={m.id || i} style={{ display: 'flex', gap: 8, justifyContent: mine ? 'flex-end' : 'flex-start', alignItems: 'flex-end' }}>
              {!mine && <Avatar who={m.who} size={24} />}
              <div style={{ maxWidth: '72%' }}>
                <div style={{ padding: '10px 14px', borderRadius: 18,
                  borderBottomRightRadius: mine ? 5 : 18, borderBottomLeftRadius: mine ? 18 : 5,
                  background: mine ? personColor(m.who) : 'var(--surface)',
                  color: mine ? '#fff' : 'var(--ink)', border: mine ? 'none' : '1px solid var(--line)',
                  font: '400 14px/1.4 var(--font-sans)', boxShadow: 'var(--sh-1)' }}>
                  {m.text}
                </div>
                <div style={{ font: '400 10.5px/1 var(--font-sans)', color: 'var(--ink-3)', marginTop: 4,
                  textAlign: mine ? 'right' : 'left', padding: '0 4px' }}>
                  {PEOPLE[m.who]?.name} · {m.at}
                </div>
              </div>
              {mine && <Avatar who={m.who} size={24} />}
            </div>
          )
        })}
      </div>

      <div style={{ padding: '10px 14px 16px', borderTop: '1px solid var(--line)', background: 'var(--surface)', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 9 }}>
          <span style={{ font: '400 11.5px/1 var(--font-sans)', color: 'var(--ink-3)' }}>Pisze:</span>
          {['a','b'].map(id => {
            const on = sender === id
            return (
              <button key={id} onClick={() => setSender(id)} style={{ display: 'inline-flex', alignItems: 'center', gap: 6,
                cursor: 'pointer', borderRadius: 'var(--r-pill)', padding: '5px 11px 5px 5px',
                background: on ? personColor(id) : 'var(--cream-warm)', border: '1px solid ' + (on ? 'transparent' : 'var(--line)') }}>
                <Avatar who={id} size={20} />
                <span style={{ font: '500 12px/1 var(--font-sans)', color: on ? '#fff' : 'var(--ink-2)' }}>{PEOPLE[id].name}</span>
              </button>
            )
          })}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', background: 'var(--cream-warm)',
            borderRadius: 'var(--r-pill)', padding: '4px 4px 4px 16px', border: '1px solid var(--line)' }}>
            <input value={draft} onChange={e => setDraft(e.target.value)} onKeyDown={e => e.key === 'Enter' && send()}
              placeholder="Napisz wiadomość…" style={{ flex: 1, border: 'none', background: 'transparent', outline: 'none',
              fontSize: 16, fontFamily: 'var(--font-sans)', color: 'var(--ink)', minWidth: 0 }} />
            <button onClick={send} style={{ width: 38, height: 38, borderRadius: '50%', background: personColor(sender),
              border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Icon name="send" size={18} color="#fff" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function fmtTime(iso) {
  if (!iso) return 'teraz'
  try { return new Date(iso).toLocaleTimeString('pl', { hour: '2-digit', minute: '2-digit' }) } catch { return '' }
}
