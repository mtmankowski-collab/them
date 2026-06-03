import { useState, useEffect, useRef } from 'react'
import Icon from '../components/Icon'
import { PersonDot, Card, ScreenHead, EmptyState, SectionTitle, AddBtn, navBtn, navBtnSm, Sheet, Field, TextInput, PersonPicker, ChipPicker } from '../components/ui'
import { Avatar } from '../components/ui'
import { supabase, personColor } from '../lib/supabase'
import { scheduleUpcomingEventNotifications } from '../lib/notifications'
import { sendPush } from '../lib/push'

const DAYS = ['Pn','Wt','Śr','Cz','Pt','So','Nd']
const MONTHS = ['styczeń','luty','marzec','kwiecień','maj','czerwiec','lipiec','sierpień','wrzesień','październik','listopad','grudzień']
const MONTH_GEN = ['stycznia','lutego','marca','kwietnia','maja','czerwca','lipca','sierpnia','września','października','listopada','grudnia']

function fmtEndDate(dateStr) {
  if (!dateStr) return ''
  const [, m, d] = dateStr.split('-')
  return `${parseInt(d)} ${MONTH_GEN[parseInt(m)-1]}`
}
const LS_BIRTHDAYS = 'them_birthdays'

function parseTime(v) {
  const m = v.match(/^(\d{1,2}):(\d{2})$/)
  if (!m) return null
  const h = parseInt(m[1]), min = parseInt(m[2])
  if (h > 23 || min > 59) return null
  return `${String(h).padStart(2,'0')}:${String(min).padStart(2,'0')}`
}

const TIME_OPTS = []
for (let h = 0; h < 24; h++) {
  for (let m = 0; m < 60; m += 15) {
    TIME_OPTS.push(`${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}`)
  }
}

function birthdayMarksFromData(bdays, month) {
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
}

export default function Calendar({ onGoBirthdays, initialDate }) {
  const now = new Date()
  const initD = initialDate ? new Date(initialDate + 'T12:00:00') : now
  const [year, setYear] = useState(initD.getFullYear())
  const [month, setMonth] = useState(initD.getMonth())
  const [sel, setSel] = useState(initD.getDate())

  useEffect(() => {
    if (!initialDate) return
    const d = new Date(initialDate + 'T12:00:00')
    setYear(d.getFullYear())
    setMonth(d.getMonth())
    setSel(d.getDate())
  }, [initialDate])
  const [marks, setMarks] = useState({})
  const [birthdayMarks, setBirthdayMarks] = useState({})
  const [dayEvs, setDayEvs] = useState([])
  const [addOpen, setAddOpen] = useState(false)
  const [editItem, setEditItem] = useState(null)
  const [f, setF] = useState({ title: '', time: '12:00', owner: 'shared', location: '', isBirthday: false, allDay: false, multiDay: false, day: '', month: month, year: year, dateEnd: '', endDay: '', endMonth: month, endYear: year })
  const [bdEditOpen, setBdEditOpen] = useState(false)
  const [bdEditItem, setBdEditItem] = useState(null)
  const [bdF, setBdF] = useState({ name: '', day: '', month: 0, rel: 'Rodzina', year: '' })

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

  function loadBdMarks(month) {
    supabase.from('birthdays').select('id,date').then(({ data }) => {
      if (data) setBirthdayMarks(birthdayMarksFromData(data, month))
    })
  }

  useEffect(() => {
    const reload = () => loadBdMarks(month)
    window.addEventListener('birthdaysChanged', reload)
    return () => window.removeEventListener('birthdaysChanged', reload)
  }, [month])

  useEffect(() => {
    const from = `${year}-${String(month+1).padStart(2,'0')}-01`
    const to = `${year}-${String(month+1).padStart(2,'0')}-${String(daysInMonth).padStart(2,'0')}`
    supabase.from('events').select('*').or(`date.gte.${from},date_end.gte.${from}`).lte('date', to).then(({ data }) => {
      if (!data) return
      const m = {}
      data.forEach(e => {
        const start = new Date(e.date + 'T12:00:00')
        const end = e.date_end ? new Date(e.date_end + 'T12:00:00') : start
        for (let cur = new Date(start); cur <= end; cur.setDate(cur.getDate() + 1)) {
          if (cur.getFullYear() === year && cur.getMonth() === month) {
            const d = cur.getDate()
            if (!m[d]) m[d] = []
            m[d].push({ who: e.owner })
          }
        }
      })
      setMarks(m)
      scheduleUpcomingEventNotifications(data)
    })
    loadBdMarks(month)
  }, [year, month])

  useEffect(() => {
    const date = `${year}-${String(month+1).padStart(2,'0')}-${String(sel).padStart(2,'0')}`
    supabase.from('events').select('*')
      .or(`date.eq.${date},and(date.lte.${date},date_end.gte.${date})`)
      .order('time_start', { nullsFirst: true })
      .then(({ data }) => setDayEvs(data || []))
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
        const id = Date.now()
        await supabase.from('birthdays').insert({ id, name: f.title.trim(), date: bdDate, rel: 'Inne', year: null })
        const existing = JSON.parse(localStorage.getItem(LS_BIRTHDAYS)) || []
        const updated = [...existing, { id, name: f.title.trim(), date: bdDate, rel: 'Inne' }]
        localStorage.setItem(LS_BIRTHDAYS, JSON.stringify(updated))
        window.dispatchEvent(new CustomEvent('birthdaysChanged'))
      } catch {}
      setAddOpen(false)
      setEditItem(null)
      return
    }

    const timeStart = f.allDay ? null : ((parseTime(f.time) || f.time) + ':00')
    const dateEnd = f.multiDay && f.endDay
      ? `${f.endYear}-${String(f.endMonth+1).padStart(2,'0')}-${String(f.endDay).padStart(2,'0')}`
      : null

    if (editItem) {
      await supabase.from('events').update({ title: f.title, time_start: timeStart, location: f.location, owner: f.owner, date_end: dateEnd }).eq('id', editItem.id)
      setDayEvs(prev => prev.map(e => e.id === editItem.id ? { ...e, title: f.title, time_start: timeStart, location: f.location, owner: f.owner, date_end: dateEnd } : e))
    } else {
      const { data } = await supabase.from('events').insert({ title: f.title, date, time_start: timeStart, location: f.location, owner: f.owner, date_end: dateEnd }).select().single()
      if (data) {
        const d = parseInt(date.split('-')[2])
        if (evYear === year && evMonth === month) {
          setMarks(prev => { const m = { ...prev }; if (!m[d]) m[d] = []; m[d] = [...m[d], { who: f.owner }]; return m })
        }
        const selDate = `${year}-${String(month+1).padStart(2,'0')}-${String(sel).padStart(2,'0')}`
        if (date === selDate) setDayEvs(prev => [...prev, data].sort((a,b) => (a.time_start||'').localeCompare(b.time_start||'')))
        const timeLabel = f.allDay ? 'cały dzień' : f.time
        sendPush(`📅 Nowe wydarzenie`, `${f.title} · ${date} · ${timeLabel}`, 'calendar', `/?date=${date}`)
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
    const hasEnd = !!ev.date_end
    const endD = hasEnd ? new Date(ev.date_end + 'T12:00:00') : null
    setF({ title: ev.title, time: ev.time_start?.slice(0,5) || '12:00', owner: ev.owner, location: ev.location || '', isBirthday: false, allDay: !ev.time_start, multiDay: hasEnd, day: evDay, month: evMonth, year: evYear, dateEnd: ev.date_end || '', endDay: endD ? String(endD.getDate()) : '', endMonth: endD ? endD.getMonth() : evMonth, endYear: endD ? endD.getFullYear() : evYear })
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

  function openBdEdit(b) {
    setBdEditItem(b)
    const parts = b.date.split('.')
    setBdF({ name: b.name, day: parts[0], month: parseInt(parts[1]) - 1, rel: b.rel || 'Rodzina', year: b.year ? String(b.year) : '' })
    setBdEditOpen(true)
  }

  async function submitBdEdit() {
    if (!bdF.name.trim() || !bdF.day) return
    const dateStr = `${String(bdF.day).padStart(2,'0')}.${String(bdF.month + 1).padStart(2,'0')}`
    const record = { name: bdF.name.trim(), date: dateStr, rel: bdF.rel, year: bdF.year ? parseInt(bdF.year) : null }
    await supabase.from('birthdays').update(record).eq('id', bdEditItem.id)
    try {
      const existing = JSON.parse(localStorage.getItem(LS_BIRTHDAYS)) || []
      const updated = existing.map(b => b.id === bdEditItem.id ? { ...b, ...record } : b)
      localStorage.setItem(LS_BIRTHDAYS, JSON.stringify(updated))
      window.dispatchEvent(new CustomEvent('birthdaysChanged'))
    } catch {}
    setBdEditOpen(false)
    setBdEditItem(null)
  }

  async function deleteBd() {
    if (!bdEditItem) return
    await supabase.from('birthdays').delete().eq('id', bdEditItem.id)
    try {
      const existing = JSON.parse(localStorage.getItem(LS_BIRTHDAYS)) || []
      localStorage.setItem(LS_BIRTHDAYS, JSON.stringify(existing.filter(b => b.id !== bdEditItem.id)))
      window.dispatchEvent(new CustomEvent('birthdaysChanged'))
    } catch {}
    setBdEditOpen(false)
    setBdEditItem(null)
  }

  function openAdd() {
    setEditItem(null)
    setF({ title: '', time: '12:00', owner: 'shared', location: '', isBirthday: false, allDay: false, multiDay: false, day: String(sel), month, year, dateEnd: '', endDay: String(sel), endMonth: month, endYear: year })
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
        <Card key={b.id} pad={13} style={{ marginBottom: 8, borderLeft: '4px solid #4A90D9', overflow: 'hidden', cursor: 'pointer' }} onClick={() => openBdEdit(b)}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 18 }}>🎂</span>
            <div style={{ flex: 1 }}>
              <div style={{ font: '500 14.5px/1 var(--font-sans)', color: 'var(--ink)' }}>{b.name}</div>
              <div style={{ font: '400 12px/1 var(--font-sans)', color: 'var(--ink-2)', marginTop: 3 }}>{b.rel}{b.year ? ` · kończy ${new Date().getFullYear() - b.year} lat` : ''}</div>
            </div>
            <Icon name="edit" size={16} color="var(--ink-3)" />
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
                  {e.time_start && <>
                    <div style={{ textAlign: 'center', flexShrink: 0 }}>
                      <div style={{ font: '500 14px/1 var(--font-sans)', color: 'var(--ink)' }}>{e.time_start.slice(0,5)}</div>
                    </div>
                    <div style={{ width: 1, alignSelf: 'stretch', background: 'var(--line)' }} />
                  </>}
                  <div style={{ flex: 1 }}>
                    <div style={{ font: '500 15px/1.2 var(--font-sans)', color: 'var(--ink)' }}>{e.title}</div>
                    {e.location && <div style={{ font: '400 12.5px/1 var(--font-sans)', color: 'var(--ink-2)', marginTop: 4 }}>{e.location}</div>}
                    {e.date_end && <div style={{ font: '400 11.5px/1 var(--font-sans)', color: 'var(--ink-3)', marginTop: 4 }}>do {fmtEndDate(e.date_end)}</div>}
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

      {dayEvs.length > 0 && (
        <div style={{ marginTop: 12, display: 'flex', justifyContent: 'center' }}>
          <AddBtn label="Dodaj wydarzenie" onClick={openAdd} />
        </div>
      )}

      <Sheet open={addOpen} title={editItem ? 'Edytuj wydarzenie' : 'Nowe wydarzenie'}
        onClose={() => { setAddOpen(false); setEditItem(null) }}
        onSubmit={submitEvent} submitLabel={editItem ? 'Zapisz zmiany' : 'Dodaj do kalendarza'}
        onDelete={editItem ? deleteEvent : undefined}>
        <Field label="Wydarzenie"><TextInput value={f.title} onChange={v => setF(p => ({...p, title: v}))} placeholder="np. Wizyta u lekarza" /></Field>

        {/* Toggles row */}
        <div style={{ display: 'flex', gap: 16 }}>
          {[{ key: 'allDay', label: 'Cały dzień' }, { key: 'multiDay', label: 'Wydarzenie parodniowe' }].map(({ key, label }) => (
            <label key={key} style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
              <div onClick={() => setF(p => ({...p, [key]: !p[key]}))}
                style={{ width: 22, height: 22, borderRadius: 7, border: '1.8px solid ' + (f[key] ? 'var(--ink)' : 'var(--line-strong)'),
                  background: f[key] ? 'var(--ink)' : 'transparent',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                {f[key] && <Icon name="check" size={13} color="#fff" stroke={2.2} />}
              </div>
              <span style={{ font: '500 13px/1 var(--font-sans)', color: 'var(--ink)' }}>{label}</span>
            </label>
          ))}
        </div>

        {/* Start date */}
        <div style={{ display: 'flex', gap: 8 }}>
          <div style={{ flex: 3 }}>
            <Field label="Miesiąc">
              <SelectPill value={f.month} onChange={v => setF(p => ({...p, month: parseInt(v)}))}>
                {MONTHS.map((m, i) => <option key={i} value={i}>{m.charAt(0).toUpperCase() + m.slice(1)}</option>)}
              </SelectPill>
            </Field>
          </div>
          <div style={{ flex: 2 }}>
            <Field label="Dzień">
              <SelectPill value={parseInt(f.day) || sel} onChange={v => setF(p => ({...p, day: v}))}>
                {Array.from({ length: new Date(f.year, f.month + 1, 0).getDate() }, (_, i) => i + 1).map(d => <option key={d} value={d}>{d}</option>)}
              </SelectPill>
            </Field>
          </div>
          <div style={{ flex: 2 }}>
            <Field label="Rok">
              <SelectPill value={f.year} onChange={v => setF(p => ({...p, year: parseInt(v)}))}>
                {[year - 1, year, year + 1].map(y => <option key={y} value={y}>{y}</option>)}
              </SelectPill>
            </Field>
          </div>
        </div>

        {!f.allDay && (
          <Field label="Godzina">
            <SelectPill value={f.time} onChange={v => setF(p => ({...p, time: v}))}>
              {TIME_OPTS.map(t => <option key={t} value={t}>{t}</option>)}
            </SelectPill>
          </Field>
        )}

        {/* End date for multi-day events */}
        {f.multiDay && (
          <div style={{ display: 'flex', gap: 8 }}>
            <div style={{ flex: 3 }}>
              <Field label="Do — miesiąc">
                <SelectPill value={f.endMonth} onChange={v => setF(p => ({...p, endMonth: parseInt(v)}))}>
                  {MONTHS.map((m, i) => <option key={i} value={i}>{m.charAt(0).toUpperCase() + m.slice(1)}</option>)}
                </SelectPill>
              </Field>
            </div>
            <div style={{ flex: 2 }}>
              <Field label="Dzień">
                <SelectPill value={parseInt(f.endDay) || sel} onChange={v => setF(p => ({...p, endDay: v}))}>
                  {Array.from({ length: new Date(f.endYear, f.endMonth + 1, 0).getDate() }, (_, i) => i + 1).map(d => <option key={d} value={d}>{d}</option>)}
                </SelectPill>
              </Field>
            </div>
            <div style={{ flex: 2 }}>
              <Field label="Rok">
                <SelectPill value={f.endYear} onChange={v => setF(p => ({...p, endYear: parseInt(v)}))}>
                  {[year - 1, year, year + 1].map(y => <option key={y} value={y}>{y}</option>)}
                </SelectPill>
              </Field>
            </div>
          </div>
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

      {/* Birthday edit sheet */}
      <Sheet open={bdEditOpen} title="Edytuj urodziny" accent="#4A90D9"
        onClose={() => { setBdEditOpen(false); setBdEditItem(null) }}
        onSubmit={submitBdEdit} submitLabel="Zapisz zmiany"
        onDelete={deleteBd}>
        <Field label="Imię / nazwa"><TextInput value={bdF.name} onChange={v => setBdF(p=>({...p,name:v}))} placeholder="np. Ziutek" /></Field>
        <div style={{ display: 'flex', gap: 10 }}>
          <div style={{ flex: 1 }}>
            <Field label="Miesiąc">
              <SelectPill value={bdF.month} onChange={v => setBdF(p=>({...p,month:parseInt(v)}))}>
                {MONTHS.map((m,i) => <option key={i} value={i}>{m.charAt(0).toUpperCase()+m.slice(1)}</option>)}
              </SelectPill>
            </Field>
          </div>
          <div style={{ width: 90 }}>
            <Field label="Dzień"><TextInput value={bdF.day} onChange={v => setBdF(p=>({...p,day:v}))} placeholder="15" /></Field>
          </div>
        </div>
        <Field label="Kim jest"><ChipPicker value={bdF.rel} onChange={v => setBdF(p=>({...p,rel:v}))} options={['Rodzina','Partnerka','Partner','Córka','Syn','Przyjaciel','Inne']} /></Field>
        <Field label="Rok urodzenia (opcjonalnie)"><TextInput value={bdF.year} onChange={v => setBdF(p=>({...p,year:v.replace(/\D/g,'').slice(0,4)}))} placeholder="1990" /></Field>
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
