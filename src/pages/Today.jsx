import { useState, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'
import {
  IconSend, IconPlus, IconCheck, IconShoppingCart
} from '@tabler/icons-react'

const OWNER_COLORS = { M: '#C4703A', A: '#378ADD', shared: '#7D9B7A' }
const OWNER_LABELS = { M: 'Mańka', A: 'Ani', shared: 'Wspólne' }

function formatTime(t) {
  if (!t) return ''
  return t.slice(0, 5)
}

function greet(name) {
  const h = new Date().getHours()
  if (h < 12) return `Dzień dobry, ${name}.`
  if (h < 18) return `Cześć, ${name}.`
  return `Dobry wieczór, ${name}.`
}

function formatDate() {
  return new Date().toLocaleDateString('pl-PL', { weekday: 'long', day: 'numeric', month: 'long' })
}

export default function Today({ user }) {
  const [events, setEvents] = useState([])
  const [board, setBoard] = useState([])
  const [shopping, setShopping] = useState([])
  const [expenses, setExpenses] = useState([])
  const [bills, setBills] = useState([])
  const [message, setMessage] = useState('')
  const boardRef = useRef(null)

  const today = new Date().toISOString().slice(0, 10)
  const thisMonth = new Date().toISOString().slice(0, 7)

  useEffect(() => {
    loadData()
    const channel = supabase
      .channel('board-realtime')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'board' }, payload => {
        setBoard(prev => [...prev, payload.new])
      })
      .subscribe()
    return () => supabase.removeChannel(channel)
  }, [])

  useEffect(() => {
    if (boardRef.current) boardRef.current.scrollTop = boardRef.current.scrollHeight
  }, [board])

  async function loadData() {
    const [evRes, boardRes, shopRes, expRes, billRes] = await Promise.all([
      supabase.from('events').select('*').eq('date', today).order('time_start'),
      supabase.from('board').select('*').order('created_at').limit(50),
      supabase.from('shopping').select('*').eq('done', false).limit(5),
      supabase.from('expenses').select('*').gte('date', thisMonth + '-01'),
      supabase.from('bills').select('*'),
    ])
    if (!evRes.error) setEvents(evRes.data || [])
    if (!boardRes.error) setBoard(boardRes.data || [])
    if (!shopRes.error) setShopping(shopRes.data || [])
    if (!expRes.error) setExpenses(expRes.data || [])
    if (!billRes.error) setBills(billRes.data || [])
  }

  async function sendMessage() {
    if (!message.trim()) return
    await supabase.from('board').insert({ message: message.trim(), author: user.initials })
    setMessage('')
  }

  const totalExpenses = expenses.reduce((s, e) => s + Number(e.amount), 0)

  const today_day = new Date().getDate()
  const nextBill = bills
    .filter(b => !b.paid_months?.includes(thisMonth))
    .sort((a, b) => {
      const da = a.due_day >= today_day ? a.due_day - today_day : 31 - today_day + a.due_day
      const db = b.due_day >= today_day ? b.due_day - today_day : 31 - today_day + b.due_day
      return da - db
    })[0]

  return (
    <div className="page" style={{ padding: '20px 16px', paddingBottom: 'calc(var(--nav-height) + var(--safe-bottom) + 24px)' }}>
      {/* Powitanie */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 28, lineHeight: 1.2, marginBottom: 4 }}>{greet(user.name)}</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: 14, textTransform: 'capitalize' }}>{formatDate()}</p>
      </div>

      {/* Plan dnia */}
      <Section title="Plan dnia">
        {events.length === 0 ? (
          <p style={{ color: 'var(--text-secondary)', fontSize: 14, padding: '4px 0' }}>Brak wydarzeń na dziś.</p>
        ) : (
          events.map(ev => (
            <div key={ev.id} style={styles.eventRow}>
              <div style={{ ...styles.eventDot, background: OWNER_COLORS[ev.owner] || OWNER_COLORS.shared }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={styles.eventTitle}>{ev.title}</div>
                {ev.location && <div style={styles.eventSub}>{ev.location}</div>}
              </div>
              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                {ev.time_start && <div style={styles.eventTime}>{formatTime(ev.time_start)}</div>}
                <div style={{ ...styles.ownerChip, background: OWNER_COLORS[ev.owner] + '22', color: OWNER_COLORS[ev.owner] }}>
                  {OWNER_LABELS[ev.owner] || ev.owner}
                </div>
              </div>
            </div>
          ))
        )}
      </Section>

      {/* Finanse */}
      <Section title="Finanse">
        <div style={styles.finRow}>
          <div>
            <div style={styles.finLabel}>Wydatki w {new Date().toLocaleDateString('pl-PL', { month: 'long' })}</div>
            <div style={styles.finAmount}>{totalExpenses.toFixed(2)} zł</div>
          </div>
          {nextBill && (
            <div style={{ textAlign: 'right' }}>
              <div style={styles.finLabel}>Najbliższa opłata</div>
              <div style={styles.finAmount}>{nextBill.title}</div>
              <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{nextBill.amount} zł · {nextBill.due_day}. dnia</div>
            </div>
          )}
        </div>
      </Section>

      {/* Tablica */}
      <div style={styles.boardCard}>
        <div style={styles.boardHeader}>
          <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.6)' }}>Tablica</span>
        </div>
        <div ref={boardRef} style={styles.boardMessages}>
          {board.length === 0 && (
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 14, textAlign: 'center', padding: '12px 0' }}>Zacznijcie rozmowę...</p>
          )}
          {board.map(m => {
            const mine = m.author === user.initials
            return (
              <div key={m.id} style={{ ...styles.bubble, alignSelf: mine ? 'flex-end' : 'flex-start', background: mine ? 'var(--accent-m)' : 'rgba(255,255,255,0.12)' }}>
                {!mine && <span style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.5)', display: 'block', marginBottom: 2 }}>{m.author}</span>}
                <span style={{ fontSize: 14, color: '#fff' }}>{m.message}</span>
              </div>
            )
          })}
        </div>
        <div style={styles.boardInput}>
          <input
            style={styles.boardField}
            value={message}
            onChange={e => setMessage(e.target.value)}
            placeholder="Napisz coś..."
            onKeyDown={e => e.key === 'Enter' && sendMessage()}
          />
          <button style={styles.sendBtn} onClick={sendMessage}>
            <IconSend size={18} />
          </button>
        </div>
      </div>

      {/* Zakupy */}
      <Section title={`Zakupy (${shopping.length})`}>
        {shopping.length === 0 ? (
          <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>Lista pusta.</p>
        ) : (
          shopping.map(item => (
            <div key={item.id} style={styles.shopItem}>
              <IconShoppingCart size={14} style={{ color: 'var(--text-secondary)', flexShrink: 0 }} />
              <span style={{ fontSize: 14 }}>{item.title}</span>
            </div>
          ))
        )}
      </Section>
    </div>
  )
}

function Section({ title, children }) {
  return (
    <div className="card" style={{ marginBottom: 12 }}>
      <div className="section-header" style={{ marginBottom: 10 }}>
        <span className="section-title">{title}</span>
      </div>
      {children}
    </div>
  )
}

const styles = {
  eventRow: { display: 'flex', alignItems: 'flex-start', gap: 10, paddingBottom: 10, marginBottom: 10, borderBottom: '0.5px solid var(--border)' },
  eventDot: { width: 8, height: 8, borderRadius: '50%', marginTop: 5, flexShrink: 0 },
  eventTitle: { fontSize: 14, fontWeight: 500, color: 'var(--text)' },
  eventSub: { fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 },
  eventTime: { fontSize: 13, fontWeight: 600, color: 'var(--text)' },
  ownerChip: { fontSize: 10, fontWeight: 600, borderRadius: 4, padding: '2px 6px', marginTop: 2, display: 'inline-block' },
  finRow: { display: 'flex', justifyContent: 'space-between', gap: 12 },
  finLabel: { fontSize: 11, color: 'var(--text-secondary)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 },
  finAmount: { fontSize: 20, fontFamily: "'DM Serif Display', serif" },
  boardCard: {
    background: '#1a1a2e',
    borderRadius: 'var(--radius)',
    marginBottom: 12,
    overflow: 'hidden',
  },
  boardHeader: { padding: '12px 16px 0' },
  boardMessages: {
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
    padding: '10px 14px',
    minHeight: 120,
    maxHeight: 220,
    overflowY: 'auto',
  },
  bubble: {
    padding: '8px 12px',
    borderRadius: 14,
    maxWidth: '80%',
  },
  boardInput: {
    display: 'flex',
    gap: 8,
    padding: '10px 14px 14px',
    borderTop: '0.5px solid rgba(255,255,255,0.08)',
  },
  boardField: {
    flex: 1,
    background: 'rgba(255,255,255,0.08)',
    border: '0.5px solid rgba(255,255,255,0.12)',
    borderRadius: 20,
    padding: '9px 14px',
    color: '#fff',
    fontSize: 14,
    outline: 'none',
  },
  sendBtn: {
    width: 38,
    height: 38,
    borderRadius: '50%',
    background: 'var(--accent-m)',
    color: '#fff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  shopItem: { display: 'flex', alignItems: 'center', gap: 8, padding: '5px 0', fontSize: 14 },
}
