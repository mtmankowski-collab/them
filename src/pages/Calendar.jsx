import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { IconPlus, IconChevronLeft, IconChevronRight, IconX } from '@tabler/icons-react'

const OWNER_COLORS = { M: '#C4703A', A: '#378ADD', shared: '#7D9B7A' }
const DAYS_PL = ['Pn','Wt','Śr','Cz','Pt','Sb','Nd']
const MONTHS_PL = ['Styczeń','Luty','Marzec','Kwiecień','Maj','Czerwiec','Lipiec','Sierpień','Wrzesień','Październik','Listopad','Grudzień']

function daysInMonth(year, month) {
  return new Date(year, month + 1, 0).getDate()
}

function firstDayOfMonth(year, month) {
  let d = new Date(year, month, 1).getDay()
  return d === 0 ? 6 : d - 1
}

export default function Calendar({ user }) {
  const now = new Date()
  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth())
  const [selectedDay, setSelectedDay] = useState(now.getDate())
  const [events, setEvents] = useState([])
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState({ title: '', date: '', time_start: '', time_end: '', location: '', owner: 'shared' })

  useEffect(() => { loadEvents() }, [year, month])

  async function loadEvents() {
    const from = `${year}-${String(month+1).padStart(2,'0')}-01`
    const to = `${year}-${String(month+1).padStart(2,'0')}-${String(daysInMonth(year,month)).padStart(2,'0')}`
    const { data, error } = await supabase.from('events').select('*').gte('date', from).lte('date', to)
    if (!error) setEvents(data || [])
  }

  function prevMonth() {
    if (month === 0) { setYear(y => y-1); setMonth(11) }
    else setMonth(m => m-1)
    setSelectedDay(1)
  }

  function nextMonth() {
    if (month === 11) { setYear(y => y+1); setMonth(0) }
    else setMonth(m => m+1)
    setSelectedDay(1)
  }

  const days = daysInMonth(year, month)
  const firstDay = firstDayOfMonth(year, month)
  const todayStr = now.toISOString().slice(0, 10)
  const selectedStr = `${year}-${String(month+1).padStart(2,'0')}-${String(selectedDay).padStart(2,'0')}`
  const dayEvents = events.filter(e => e.date === selectedStr).sort((a,b) => (a.time_start||'') > (b.time_start||'') ? 1 : -1)

  function dotsForDay(d) {
    const s = `${year}-${String(month+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`
    return events.filter(e => e.date === s)
  }

  async function saveEvent() {
    if (!form.title || !form.date) return
    await supabase.from('events').insert({ ...form, added_by: user.initials })
    setShowModal(false)
    setForm({ title: '', date: '', time_start: '', time_end: '', location: '', owner: 'shared' })
    loadEvents()
  }

  return (
    <div className="page" style={{ padding: '16px', paddingBottom: 'calc(var(--nav-height) + var(--safe-bottom) + 24px)' }}>
      {/* Month nav */}
      <div style={styles.monthNav}>
        <button onClick={prevMonth} style={styles.navBtn}><IconChevronLeft size={20} /></button>
        <h2 style={{ fontSize: 22 }}>{MONTHS_PL[month]} {year}</h2>
        <button onClick={nextMonth} style={styles.navBtn}><IconChevronRight size={20} /></button>
      </div>

      {/* Calendar grid */}
      <div className="card" style={{ marginBottom: 16, padding: '12px' }}>
        <div style={styles.daysHeader}>
          {DAYS_PL.map(d => <div key={d} style={styles.dayLabel}>{d}</div>)}
        </div>
        <div style={styles.grid}>
          {Array.from({ length: firstDay }).map((_, i) => <div key={`e${i}`} />)}
          {Array.from({ length: days }).map((_, i) => {
            const d = i + 1
            const s = `${year}-${String(month+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`
            const isToday = s === todayStr
            const isSelected = d === selectedDay
            const dots = dotsForDay(d)
            return (
              <button key={d} onClick={() => setSelectedDay(d)} style={{ ...styles.dayCell, background: isSelected ? user.color || 'var(--accent-m)' : 'transparent' }}>
                <span style={{ ...styles.dayNum, color: isSelected ? '#fff' : isToday ? user.color || 'var(--accent-m)' : 'var(--text)', fontWeight: isToday ? 700 : 400 }}>
                  {d}
                </span>
                <div style={styles.dotRow}>
                  {dots.slice(0,3).map((ev, idx) => (
                    <div key={idx} style={{ ...styles.calDot, background: isSelected ? 'rgba(255,255,255,0.6)' : OWNER_COLORS[ev.owner] || OWNER_COLORS.shared }} />
                  ))}
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* Day events */}
      <div style={styles.dayLabel2}>
        {selectedStr === todayStr ? 'Dziś' : new Date(selectedStr + 'T00:00:00').toLocaleDateString('pl-PL', { weekday: 'long', day: 'numeric', month: 'long' })}
      </div>
      {dayEvents.length === 0 ? (
        <p style={{ color: 'var(--text-secondary)', fontSize: 14, padding: '8px 4px' }}>Brak wydarzeń.</p>
      ) : (
        dayEvents.map(ev => (
          <div key={ev.id} className="card" style={{ marginBottom: 8, display: 'flex', gap: 12, alignItems: 'flex-start' }}>
            <div style={{ width: 4, borderRadius: 4, background: OWNER_COLORS[ev.owner] || OWNER_COLORS.shared, alignSelf: 'stretch', minHeight: 40 }} />
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 500, fontSize: 15 }}>{ev.title}</div>
              {ev.time_start && <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 2 }}>{ev.time_start?.slice(0,5)}{ev.time_end ? ' – '+ev.time_end?.slice(0,5) : ''}</div>}
              {ev.location && <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>📍 {ev.location}</div>}
            </div>
          </div>
        ))
      )}

      {/* FAB */}
      <button className="fab" onClick={() => { setForm(f => ({ ...f, date: selectedStr })); setShowModal(true) }}>
        <IconPlus size={24} />
      </button>

      {showModal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowModal(false)}>
          <div className="modal-sheet">
            <div className="modal-handle" />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h3 className="modal-title" style={{ margin: 0 }}>Nowe wydarzenie</h3>
              <button onClick={() => setShowModal(false)}><IconX size={20} color="var(--text-secondary)" /></button>
            </div>
            <div className="form-group">
              <label className="form-label">Tytuł</label>
              <input className="form-input" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Co się dzieje?" />
            </div>
            <div className="form-group">
              <label className="form-label">Data</label>
              <input className="form-input" type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} />
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <div className="form-group" style={{ flex: 1 }}>
                <label className="form-label">Od</label>
                <input className="form-input" type="time" value={form.time_start} onChange={e => setForm(f => ({ ...f, time_start: e.target.value }))} />
              </div>
              <div className="form-group" style={{ flex: 1 }}>
                <label className="form-label">Do</label>
                <input className="form-input" type="time" value={form.time_end} onChange={e => setForm(f => ({ ...f, time_end: e.target.value }))} />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Miejsce</label>
              <input className="form-input" value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))} placeholder="Opcjonalne" />
            </div>
            <div className="form-group">
              <label className="form-label">Kto</label>
              <select className="form-input" value={form.owner} onChange={e => setForm(f => ({ ...f, owner: e.target.value }))}>
                <option value="shared">Wspólne</option>
                <option value="M">Mańka</option>
                <option value="A">Ani</option>
              </select>
            </div>
            <button className="btn-primary" onClick={saveEvent}>Zapisz wydarzenie</button>
          </div>
        </div>
      )}
    </div>
  )
}

const styles = {
  monthNav: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 },
  navBtn: { width: 36, height: 36, borderRadius: '50%', background: 'var(--white)', border: '0.5px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text)' },
  daysHeader: { display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', marginBottom: 6 },
  dayLabel: { textAlign: 'center', fontSize: 11, color: 'var(--text-secondary)', fontWeight: 600, padding: '4px 0' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '2px 0' },
  dayCell: { border: 'none', borderRadius: 8, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '4px 2px', transition: 'background 0.1s' },
  dayNum: { fontSize: 14, lineHeight: 1.6 },
  dotRow: { display: 'flex', gap: 2, height: 6, alignItems: 'center' },
  calDot: { width: 4, height: 4, borderRadius: '50%' },
  dayLabel2: { fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'capitalize', marginBottom: 10, paddingLeft: 4 },
}
