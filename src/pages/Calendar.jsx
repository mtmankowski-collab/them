import { useState, useEffect } from 'react'
import Icon from '../components/Icon'
import { PersonDot, Card, ScreenHead, EmptyState, SectionTitle, AddBtn, navBtn, navBtnSm, Sheet, Field, TextInput, PersonPicker } from '../components/ui'
import { Avatar } from '../components/ui'
import { supabase, personColor } from '../lib/supabase'

const DAYS = ['Pn','Wt','Śr','Cz','Pt','So','Nd']
const MONTHS = ['styczeń','luty','marzec','kwiecień','maj','czerwiec','lipiec','sierpień','wrzeseń','październik','listopad','grudzień']

export default function Calendar({ onGoBirthdays }) {
  const now = new Date()
  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth())
  const [sel, setSel] = useState(now.getDate())
  const [marks, setMarks] = useState({})
  const [dayEvs, setDayEvs] = useState([])
  const [addOpen, setAddOpen] = useState(false)
  const [editItem, setEditItem] = useState(null)
  const [f, setF] = useState({ title: '', time: '12:00', owner: 'shared', location: '' })

  const firstDay = new Date(year, month, 1).getDay()
  const offset = firstDay === 0 ? 6 : firstDay - 1
  const daysInMonth = new Date(year, month + 1, 0).getDate()

  useEffect(() => {
    const from = `${year}-${String(month+1).padStart(2,'0')}-01`
    const to = `${year}-${String(month+1).padStart(2,'0')}-${daysInMonth}`
    supabase.from('events').select('*').gte('date', from).lte('date', to).then(({ data }) => {
      if (!data) return
      const m = {}
      data.forEach(e => {
        const d = parseInt(e.date.split('-')[2])
        if (!m[d]) m[d] = []
        m[d].push({ who: e.owner })
      })
      setMarks(m)
    })
  }, [year, month])

  useEffect(() => {
    const date = `${year}-${String(month+1).padStart(2,'0')}-${String(sel).padStart(2,'0')}`
    supabase.from('events').select('*').eq('date', date).order('time_start').then(({ data }) => setDayEvs(data || []))
  }, [sel, year, month])

  function prevMonth() { if (month === 0) { setMonth(11); setYear(y => y-1) } else setMonth(m => m-1) }
  function nextMonth() { if (month === 11) { setMonth(0); setYear(y => y+1) } else setMonth(m => m+1) }

  async function submitEvent() {
    if (!f.title.trim()) return
    const date = `${year}-${String(month+1).padStart(2,'0')}-${String(parseInt(f.day) || sel).padStart(2,'0')}`
    if (editItem) {
      await supabase.from('events').update({ title: f.title, time_start: f.time + ':00', location: f.location, owner: f.owner }).eq('id', editItem.id)
    } else {
      await supabase.from('events').insert({ title: f.title, date, time_start: f.time + ':00', location: f.location, owner: f.owner })
    }
    setAddOpen(false)
    setEditItem(null)
    const d2 = `${year}-${String(month+1).padStart(2,'0')}-${String(sel).padStart(2,'0')}`
    supabase.from('events').select('*').eq('date', d2).order('time_start').then(({ data }) => setDayEvs(data || []))
  }

  function openEdit(ev) {
    setEditItem(ev)
    setF({ title: ev.title, time: ev.time_start?.slice(0,5) || '12:00', owner: ev.owner, location: ev.location || '' })
    setAddOpen(true)
  }

  async function deleteEvent() {
    if (!editItem) return
    await supabase.from('events').delete().eq('id', editItem.id)
    setAddOpen(false)
    setEditItem(null)
    const d = `${year}-${String(month+1).padStart(2,'0')}-${String(sel).padStart(2,'0')}`
    supabase.from('events').select('*').eq('date', d).order('time_start').then(({ data }) => setDayEvs(data || []))
    const from = `${year}-${String(month+1).padStart(2,'0')}-01`
    const to = `${year}-${String(month+1).padStart(2,'0')}-${daysInMonth}`
    supabase.from('events').select('*').gte('date', from).lte('date', to).then(({ data }) => {
      if (!data) return
      const m = {}
      data.forEach(e => { const d = parseInt(e.date.split('-')[2]); if (!m[d]) m[d] = []; m[d].push({ who: e.owner }) })
      setMarks(m)
    })
  }

  function openAdd() {
    setEditItem(null)
    setF({ title: '', time: '12:00', owner: 'shared', location: '' })
    setAddOpen(true)
  }

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

      <Card pad={14} style={{ marginBottom: 16 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', marginBottom: 8 }}>
          {DAYS.map(d => <div key={d} style={{ textAlign: 'center', font: '500 11px/1 var(--font-sans)', color: 'var(--ink-3)', letterSpacing: '.04em' }}>{d}</div>)}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 2, rowGap: 4 }}>
          {Array(offset).fill(null).map((_, i) => <div key={'e'+i} />)}
          {Array.from({ length: daysInMonth }, (_, i) => i+1).map(d => {
            const ev = marks[d] || []
            const isSel = d === sel
            const isToday = d === now.getDate() && month === now.getMonth() && year === now.getFullYear()
            return (
              <button key={d} onClick={() => setSel(d)} style={{ aspectRatio: '1', border: isToday && !isSel ? '1.5px solid var(--a)' : 'none',
                cursor: 'pointer', background: isSel ? 'var(--ink)' : 'transparent', borderRadius: 12,
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 3, padding: '4px 0' }}>
                <span style={{ font: '500 14px/1 var(--font-sans)', color: isSel ? 'var(--cream)' : 'var(--ink)' }}>{d}</span>
                <span style={{ display: 'flex', gap: 2.5, height: 5 }}>
                  {ev.slice(0,3).map((e, i) => <span key={i} style={{ width: 5, height: 5, borderRadius: '50%',
                    background: isSel ? 'var(--cream)' : personColor(e.who) }} />)}
                </span>
              </button>
            )
          })}
        </div>
      </Card>

      <div style={{ display: 'flex', gap: 16, marginBottom: 18, padding: '0 2px' }}>
        <Legend who="a" label="Maniek" />
        <Legend who="b" label="Ula" />
        <Legend who="shared" label="Wspólne" />
      </div>

      <SectionTitle title={selDateLabel} />
      {dayEvs.length ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {dayEvs.map((e, i) => (
            <Card key={e.id} pad={0} style={{ overflow: 'hidden', cursor: 'pointer' }} onClick={() => openEdit(e)}>
              <div style={{ display: 'flex', alignItems: 'stretch' }}>
                <div style={{ width: 5, background: personColor(e.owner) }} />
                <div style={{ padding: '13px 15px', flex: 1, display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ textAlign: 'center', flexShrink: 0 }}>
                    <div style={{ font: '500 14px/1 var(--font-sans)', color: 'var(--ink)' }}>{e.time_start?.slice(0,5)}</div>
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
      ) : (
        <EmptyState icon="calendar" title="Wolny dzień" sub="Brak wydarzeń. Dodajcie coś nowego."
          action={<AddBtn label="Dodaj wydarzenie" onClick={openAdd} />} />
      )}

      <Sheet open={addOpen} title={editItem ? 'Edytuj wydarzenie' : 'Nowe wydarzenie'}
        onClose={() => { setAddOpen(false); setEditItem(null) }}
        onSubmit={submitEvent} submitLabel={editItem ? 'Zapisz zmiany' : 'Dodaj do kalendarza'}
        onDelete={editItem ? deleteEvent : undefined}>
        <Field label="Wydarzenie"><TextInput value={f.title} onChange={v => setF(p => ({...p, title: v}))} placeholder="np. Wizyta u lekarza" /></Field>
        <div style={{ display: 'flex', gap: 12 }}>
          <div style={{ flex: 1 }}><Field label="Godzina"><TextInput value={f.time} onChange={v => setF(p => ({...p, time: v}))} placeholder="12:00" /></Field></div>
          <div style={{ width: 110 }}><Field label={`Dzień (${MONTHS[month].slice(0,3)})`}><TextInput value={f.day || String(sel)} onChange={v => setF(p => ({...p, day: v}))} type="number" placeholder={String(sel)} /></Field></div>
        </div>
        <Field label="Miejsce (opcjonalnie)"><TextInput value={f.location} onChange={v => setF(p => ({...p, location: v}))} placeholder="np. ul. Lipowa 4" /></Field>
        <Field label="Kto"><PersonPicker value={f.owner} onChange={v => setF(p => ({...p, owner: v}))} /></Field>
      </Sheet>
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
