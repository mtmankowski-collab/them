import { useState, useEffect, useRef } from 'react'
import Icon from '../components/Icon'
import { PersonDot, Card, ScreenHead, EmptyState, SectionTitle, AddBtn, navBtn, navBtnSm, Sheet, Field, TextInput, PersonPicker } from '../components/ui'
import { Avatar } from '../components/ui'
import { supabase, personColor } from '../lib/supabase'
import { scheduleUpcomingEventNotifications, notifyNewEvent } from '../lib/notifications'

const DAYS = ['Pn','Wt','Śr','Cz','Pt','So','Nd']
const MONTHS = ['styczeń','luty','marzec','kwiecień','maj','czerwiec','lipiec','sierpień','wrzesień','październik','listopad','grudzień']
const LS_BIRTHDAYS = 'them_birthdays'

// Generate time options: 00:00, 00:30 … 23:30
const TIME_OPTS = []
for (let h = 0; h < 24; h++) {
  TIME_OPTS.push(`${String(h).padStart(2,'0')}:00`)
  TIME_OPTS.push(`${String(h).padStart(2,'0')}:30`)
}

function loadBirthdayMarks(month) {
  try {
    const bdays = JSON.parse(localStorage.getItem(LS_BIRTHDAYS)) || []
    const marks = {}
    bdays.forEach(b => {
      const parts = b.date.split('.')
      const mm = parseInt(parts[1])
      const dd = parseInt(parts[0])
      if (mm === month + 1) {
        if (!marks[dd]) marks[dd] = []
        marks[dd].push({ who: 'birthday' })
      }
    })
    return marks
  } catch { return {} }
}

export default function Calendar({ onGoBirthdays }) {
  const now = new Date()
  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth())
  const [sel, setSel] = useState(now.getDate())
  const [marks, setMarks] = useState({})
  const [birthdayMarks, setBirthdayMarks] = useState({})
  const [dayEvs, setDayEvs] = useState([])
  const [addOpen, setAddOpen] = useState(false)
  const [editItem, setEditItem] = useState(null)
  const [f, setF] = useState({ title: '', time: '12:00', owner: 'shared', location: '', isBirthday: false, allDay: false, day: '', month: month, year: year })

  const touchStartX = useRef(null)

  const firstDay = new Date(year, month, 1).getDay()
  const offset = firstDay === 0 ? 6 : firstDay - 1
  const daysInMonth = new Date(year, month + 1, 0).getDate()

  function prevMonth() { if (month === 0) { setMonth(11); setYear(y => y-1) } else setMonth(m => m-1) }
  function nextMonth() { if (month === 11) { setMonth(0); setYear(y => y+1) } else setMonth(m => m+1) }

  function handleTouchStart(e) { touchStartX.current = e.touches[0].clientX }
  function handleTouchEnd(e) {
    if (touchStartX.current === null) return
    const diff = touchStartX.current - e.changedTouches[0].clientX
    if (Math.abs(diff) > 50) diff > 0 ? nextMonth() : prevMonth()
    touchStartX.current = null
  }

  useEffect(() => {
    const reload = () => setBirthdayMarks(loadBirthdayMarks(month))
    window.addEventListener('birthdaysChanged', reload)
    return () => window.removeEventListener('birthdaysChanged', reload)
  }, [month])

  useEffect(() => {
    const from = `${year}-${String(month+1).padStart(2,'0')}-01`
    const to = `${year}-${String(month+1).padStart(2,'0')}-${String(daysInMonth).padStart(2,'0')}`
    supabase.from('events').select('*').gte('date', from).lte('date', to).then(({ data }) => {
      if (!data) return
      const m = {}
      data.forEach(e => {
        const d = parseInt(e.date.split('-')[2])
        if (!m[d]) m[d] = []
        m[d].push({ who: e.owner })
      })
      setMarks(m)
      scheduleUpcomingEventNotifications(data)
    })
    setBirthdayMarks(loadBirthdayMarks(month))
  }, [year, month])

  useEffect(() => {
    const date = `${year}-${String(month+1).padStart(2,'0')}-${String(sel).padStart(2,'0')}`
    supabase.from('events').select('*').eq('date', date).order('time_start').then(({ data }) => setDayEvs(data || []))
  }, [sel, year, month])

  async function submitEvent() {
    if (!f.title.trim()) return
    const dayNum = parseInt(f.day) || sel
    const evMonth = (f.month !== undefined ? f.month : month)
    const evYear = (f.year !== undefined ? f.year : year)
    const date = `${evYear}-${String(evMonth+1).padStart(2,'0')}-${String(dayNum).padStart(2,'0')}`

    // When birthday checkbox is on: only save to localStorage, don't create a calendar event
    if (!editItem && f.isBirthday) {
      const bdDay = String(dayNum).padStart(2, '0')
      const bdMonth = String(evMonth + 1).padStart(2, '0')
      const bdDate = `${bdDay}.${bdMonth}`
      try {
        const existing = JSON.parse(localStorage.getItem(LS_BIRTHDAYS)) || []
        const updated = [...existing, { id: Date.now(), name: f.title.trim(), date: bdDate, rel: 'Inne', year: undefined }]
        localStorage.setItem(LS_BIRTHDAYS, JSON.stringify(updated))
        window.dispatchEvent(new CustomEvent('birthdaysChanged'))
      } catch {}
      setAddOpen(false)
      setEditItem(null)
      return
    }

    const timeStart = f.allDay ? null : (f.time + ':00')

    if (editItem) {
      await supabase.from('events').update({ title: f.title, time_start: timeStart, location: f.location, owner: f.owner }).eq('id', editItem.id)
      setDayEvs(prev => prev.map(e => e.id === editItem.id ? { ...e, title: f.title, time_start: timeStart, location: f.location, owner: f.owner } : e))
    } else {
      const { data } = await supabase.from('events').insert({ title: f.title, date, time_start: timeStart, location: f.location, owner: f.owner }).select().single()
      if (data) {
        const d = parseInt(date.split('-')[2])
        if (evYear === year && evMonth === month) {
          setMarks(prev => { const m = { ...prev }; if (!m[d]) m[d] = []; m[d] = [...m[d], { who: f.owner }]; return m })
        }
        const selDate = `${year}-${String(month+1).padStart(2,'0')}-${String(sel).padStart(2,'0')}`
        if (date === selDate) setDayEvs(prev => [...prev, data].sort((a,b) => (a.time_start||'').localeCompare(b.time_start||'')))
        notifyNewEvent(f.title, date, f.time)
        scheduleUpcomingEventNotifications([data])
      }
    }
    setAddOpen(false)
    setEditItem(null)
  }

  function openEdit(ev) {
    setEditItem(ev)
    const evDate = ev.date ? new Date(ev.date + 'T12:00:00') : null
    const evMonth = evDate ? evDate.getMonth() : month
    const evYear = evDate ? evDate.getFullYear() : year
    const evDay = evDate ? String(evDate.getDate()) : ''
    setF({ title: ev.title, time: ev.time_start?.slice(0,5) || '12:00', owner: ev.owner, location: ev.location || '', isBirthday: false, allDay: !ev.time_start, day: evDay, month: evMonth, year: evYear })
    setAddOpen(true)
  }

  async function deleteEvent() {
    if (!editItem) return
    await supabase.from('events').delete().eq('id', editItem.id)
    setDayEvs(prev => prev.filter(e => e.id !== editItem.id))
    setAddOpen(false)
    setEditItem(null)
    const from = `${year}-${String(month+1).padStart(2,'0')}-01`
    const to = `${year}-${String(month+1).padStart(2,'0')}-${String(daysInMonth).padStart(2,'0')}`
    supabase.from('events').select('*').gte('date', from).lte('date', to).then(({ data }) => {
      if (!data) return
      const m = {}
      data.forEach(e => { const d = parseInt(e.date.split('-')[2]); if (!m[d]) m[d] = []; m[d].push({ who: e.owner }) })
      setMarks(m)
    })
  }

  function openAdd() {
    setEditItem(null)
    setF({ title: '', time: '12:00', owner: 'shared', location: '', isBirthday: false, allDay: false, day: String(sel), month, year })
    setAddOpen(true)
  }

  const selBirthdays = (() => {
    try {
      const bdays = JSON.parse(localStorage.getItem(LS_BIRTHDAYS)) || []
      return bdays.filter(b => {
        const parts = b.date.split('.')
        return parseInt(parts[1]) === month + 1 && parseInt(parts[0]) === sel
      })
    } catch { return [] }
  })()

  const selDateLabel = `${sel} ${MONTHS[month]}`

  return (
    <div className="screen" style={{ position: 'relative' }}>
      <ScreenHead sub={`${MONTHS[month]} ${year}`} title="Kalendarz" right={
        <div style={{ display: 'flex', gap: 8 }}>
          <button style={navBtn} onClick={onGoBirthdays}><Icon name="cake" size={20} color="var(--ink)" /></button>
          <button style={navBtn} onClick={openAdd}><Icon name="plus" size={20} color="var(--ink)" /></button>
        </div>
      } />

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <button style={navBtnSm} onClick={prevMonth}><Icon name="back" size={18} color="var(--ink-2)" /></button>
        <div style={{ font: `500 18px/1 'Bodoni Moda', Georgia, serif`, color: 'var(--ink)' }}>{MONTHS[month].charAt(0).toUpperCase() + MONTHS[month].slice(1)}</div>
        <button style={navBtnSm} onClick={nextMonth}><Icon name="chevron" size={18} color="var(--ink-2)" /></button>
      </div>

      <div onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd} style={{ touchAction: 'pan-y' }}>
      <Card pad={14} style={{ marginBottom: 16 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', marginBottom: 8 }}>
          {DAYS.map(d => <div key={d} style={{ textAlign: 'center', font: '500 11px/1 var(--font-sans)', color: 'var(--ink-3)', letterSpacing: '.04em' }}>{d}</div>)}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 2, rowGap: 4 }}>
          {Array(offset).fill(null).map((_, i) => <div key={'e'+i} />)}
          {Array.from({ length: daysInMonth }, (_, i) => i+1).map(d => {
            const ev = marks[d] || []
            const bd = birthdayMarks[d] || []
            const isSel = d === sel
            const isToday = d === now.getDate() && month === now.getMonth() && year === now.getFullYear()
            return (
              <button key={d} onClick={() => setSel(d)} style={{ aspectRatio: '1', border: isToday && !isSel ? '1.5px solid var(--a)' : 'none',
                cursor: 'pointer', background: isSel ? 'var(--ink)' : 'transparent', borderRadius: 12,
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 3, padding: '4px 0' }}>
                <span style={{ font: '500 14px/1 var(--font-sans)', color: isSel ? 'var(--cream)' : 'var(--ink)' }}>{d}</span>
                <span style={{ display: 'flex', gap: 2.5, height: 5 }}>
                  {ev.slice(0,2).map((e, i) => <span key={'e'+i} style={{ width: 5, height: 5, borderRadius: '50%',
                    background: isSel ? 'var(--cream)' : personColor(e.who) }} />)}
                  {bd.length > 0 && <span style={{ width: 5, height: 5, borderRadius: '50%',
                    background: isSel ? 'var(--cream)' : '#4A90D9' }} />}
                </span>
              </button>
            )
          })}
        </div>
      </Card>
      </div>

      <div style={{ display: 'flex', gap: 16, marginBottom: 18, padding: '0 2px', flexWrap: 'wrap' }}>
        <Legend who="a" label="Maniek" />
        <Legend who="b" label="Ula" />
        <Legend who="shared" label="Wspólne" />
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#4A90D9', display: 'inline-block' }} />
          <span style={{ font: '400 12px/1 var(--font-sans)', color: 'var(--ink-2)' }}>Urodziny</span>
        </div>
      </div>

      <SectionTitle title={selDateLabel} />

      {selBirthdays.map(b => (
        <Card key={b.id} pad={13} style={{ marginBottom: 8, borderLeft: '4px solid #4A90D9', overflow: 'hidden' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 18 }}>🎂</span>
            <div>
              <div style={{ font: '500 14.5px/1 var(--font-sans)', color: 'var(--ink)' }}>{b.name}</div>
              <div style={{ font: '400 12px/1 var(--font-sans)', color: 'var(--ink-2)', marginTop: 3 }}>{b.rel}{b.year ? ` · kończy ${new Date().getFullYear() - b.year} lat` : ''}</div>
            </div>
          </div>
        </Card>
      ))}

      {dayEvs.length ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {dayEvs.map(e => (
            <Card key={e.id} pad={0} style={{ overflow: 'hidden', cursor: 'pointer' }} onClick={() => openEdit(e)}>
              <div style={{ display: 'flex', alignItems: 'stretch' }}>
                <div style={{ width: 5, background: personColor(e.owner) }} />
                <div style={{ padding: '13px 15px', flex: 1, display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ textAlign: 'center', flexShrink: 0 }}>
                    <div style={{ font: '500 14px/1 var(--font-sans)', color: 'var(--ink)' }}>
                      {e.time_start ? e.time_start.slice(0,5) : 'cały dzień'}
                    </div>
                  </div>
                  <div style={{ width: 1, alignSelf: 'stretch', background: 'var(--line)' }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ font: '500 15px/1.2 var(--font-sans)', color: 'var(--ink)' }}>{e.title}</div>
                    {e.location && <div style={{ font: '400 12.5px/1 var(--font-sans)', color: 'var(--ink-2)', marginTop: 4 }}>{e.location}</div>}
                  </div>
                  <Icon name="chevron" size={17} color="var(--ink-3)" />
                  <Avatar who={e.owner} size={28} />
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : !selBirthdays.length ? (
        <EmptyState icon="calendar" title="Na razie pusto" sub="Brak wydarzeń. Dodajcie coś nowego."
          action={<AddBtn label="Dodaj wydarzenie" onClick={openAdd} />} />
      ) : null}

      <Sheet open={addOpen} title={editItem ? 'Edytuj wydarzenie' : 'Nowe wydarzenie'}
        onClose={() => { setAddOpen(false); setEditItem(null) }}
        onSubmit={submitEvent} submitLabel={editItem ? 'Zapisz zmiany' : 'Dodaj do kalendarza'}
        onDelete={editItem ? deleteEvent : undefined}>
        <Field label="Wydarzenie"><TextInput value={f.title} onChange={v => setF(p => ({...p, title: v}))} placeholder="np. Wizyta u lekarza" /></Field>

        {/* All day toggle */}
        <label style={{ display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer', padding: '2px 0' }}>
          <div onClick={() => setF(p => ({...p, allDay: !p.allDay}))}
            style={{ width: 24, height: 24, borderRadius: 8, border: '1.8px solid ' + (f.allDay ? 'var(--ink)' : 'var(--line-strong)'),
              background: f.allDay ? 'var(--ink)' : 'transparent',
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            {f.allDay && <Icon name="check" size={15} color="#fff" stroke={2.2} />}
          </div>
          <span style={{ font: '500 13.5px/1 var(--font-sans)', color: 'var(--ink)' }}>Cały dzień</span>
        </label>

        {/* Date row: always shown */}
        <div style={{ display: 'flex', gap: 8 }}>
          <div style={{ flex: 2 }}>
            <Field label="Miesiąc">
              <SelectPill value={f.month} onChange={v => setF(p => ({...p, month: parseInt(v)}))}>
                {MONTHS.map((m, i) => <option key={i} value={i}>{m.charAt(0).toUpperCase() + m.slice(1)}</option>)}
              </SelectPill>
            </Field>
          </div>
          <div style={{ flex: 1 }}>
            <Field label="Dzień">
              <TextInput value={f.day ?? String(sel)} onChange={v => setF(p => ({...p, day: v}))} placeholder={String(sel)} />
            </Field>
          </div>
          <div style={{ flex: 1 }}>
            <Field label="Rok">
              <SelectPill value={f.year} onChange={v => setF(p => ({...p, year: parseInt(v)}))}>
                {[year - 1, year, year + 1].map(y => <option key={y} value={y}>{y}</option>)}
              </SelectPill>
            </Field>
          </div>
        </div>

        {!f.allDay && (
          <Field label="Godzina">
            <div style={{ display: 'flex', alignItems: 'center', background: 'var(--cream-warm)', border: '1px solid var(--line)', borderRadius: 'var(--r-md)', padding: '0 14px' }}>
              <select value={f.time} onChange={e => setF(p => ({...p, time: e.target.value}))}
                style={{ flex: 1, border: 'none', background: 'transparent', outline: 'none', padding: '13px 0',
                  font: '400 16px/1 var(--font-sans)', color: 'var(--ink)', cursor: 'pointer', appearance: 'none', WebkitAppearance: 'none' }}>
                {TIME_OPTS.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
              <Icon name="chevron" size={16} color="var(--ink-3)" />
            </div>
          </Field>
        )}

        <Field label="Miejsce (opcjonalnie)"><TextInput value={f.location} onChange={v => setF(p => ({...p, location: v}))} placeholder="np. ul. Lipowa 4" /></Field>
        <Field label="Kto"><PersonPicker value={f.owner} onChange={v => setF(p => ({...p, owner: v}))} /></Field>

        {!editItem && (
          <label style={{ display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer', padding: '4px 0' }}>
            <div onClick={() => setF(p => ({...p, isBirthday: !p.isBirthday}))}
              style={{ width: 24, height: 24, borderRadius: 8, border: '1.8px solid ' + (f.isBirthday ? 'var(--star)' : 'var(--line-strong)'),
                background: f.isBirthday ? 'var(--star)' : 'transparent',
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              {f.isBirthday && <Icon name="check" size={15} color="#fff" stroke={2.2} />}
            </div>
            <div>
              <div style={{ font: '500 13.5px/1 var(--font-sans)', color: 'var(--ink)' }}>Dodaj jako urodziny</div>
              <div style={{ font: '400 11.5px/1 var(--font-sans)', color: 'var(--ink-3)', marginTop: 3 }}>Tylko w urodzinach, bez wpisu w kalendarzu</div>
            </div>
          </label>
        )}
      </Sheet>
    </div>
  )
}

function SelectPill({ value, onChange, children }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', background: 'var(--cream-warm)', border: '1px solid var(--line)', borderRadius: 'var(--r-md)', padding: '0 14px' }}>
      <select value={value} onChange={e => onChange(e.target.value)}
        style={{ flex: 1, border: 'none', background: 'transparent', outline: 'none', padding: '13px 0',
          font: '400 16px/1 var(--font-sans)', color: 'var(--ink)', cursor: 'pointer', appearance: 'none', WebkitAppearance: 'none', width: '100%' }}>
        {children}
      </select>
      <Icon name="chevron" size={14} color="var(--ink-3)" style={{ flexShrink: 0 }} />
    </div>
  )
}

function Legend({ who, label }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <PersonDot who={who} size={8} />
      <span style={{ font: '400 12px/1 var(--font-sans)', color: 'var(--ink-2)' }}>{label}</span>
    </div>
  )
}
