import { useState, useEffect } from 'react'
import Icon from '../components/Icon'
import { Avatar, PersonDot, Label, Card, Segmented, SectionTitle } from '../components/ui'
import { supabase, personColor, PEOPLE } from '../lib/supabase'

const SERIF = "'Bodoni Moda', Georgia, serif"
const MONTH_NAMES = ['stycznia','lutego','marca','kwietnia','maja','czerwca','lipca','sierpnia','września','października','listopada','grudnia']
const DAY_NAMES = ['Niedziela','Poniedziałek','Wtorek','Środa','Czwartek','Piątek','Sobota']

export default function Today({ onGoChat, onGoShopping, onGoFinance }) {
  const [span, setSpan] = useState('day')
  const [events, setEvents] = useState([])
  const [shopping, setShopping] = useState([])
  const [msgs, setMsgs] = useState([])
  const [expenses, setExpenses] = useState([])
  const [bills, setBills] = useState([])

  const now = new Date()
  const dayName = DAY_NAMES[now.getDay()]
  const dateLabel = `${dayName}, ${now.getDate()} ${MONTH_NAMES[now.getMonth()]}`
  const h = now.getHours()
  const greeting = (h >= 6 && h < 18) ? 'Dzień dobry' : 'Dobry wieczór'

  useEffect(() => {
    const today = now.toISOString().split('T')[0]
    supabase.from('events').select('*').eq('date', today).order('time_start').then(({ data }) => setEvents(data || []))
    supabase.from('shopping').select('*').eq('done', false).order('created_at', { ascending: false }).limit(6).then(({ data }) => setShopping(data || []))
    supabase.from('board').select('*').order('created_at', { ascending: false }).limit(3).then(({ data }) => {
      if (data) setMsgs(data.reverse().map(m => ({ who: m.author, text: m.message, at: fmtTime(m.created_at) })))
    })
    supabase.from('expenses').select('*').order('created_at', { ascending: false }).limit(50).then(({ data }) => setExpenses(data || []))
    supabase.from('bills').select('*').order('due_day').then(({ data }) => setBills(data || []))
  }, [])

  const curMonth = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}`
  const totalSpent = expenses.reduce((s, e) => s + (e.amount || 0), 0)
  const totalDue = bills.filter(b => !(b.paid_months || []).includes(curMonth)).reduce((s, b) => s + (b.amount || 0), 0)
  const spentA = expenses.filter(e => e.added_by === 'a').reduce((s, e) => s + e.amount, 0)
  const spentB = expenses.filter(e => e.added_by === 'b').reduce((s, e) => s + e.amount, 0)
  const total = spentA + spentB || 1
  const pctA = Math.round(spentA / total * 100)
  const pctB = 100 - pctA

  const nextUp = events[0]

  return (
    <div className="screen">
      <div style={{ padding: '8px 0 18px', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div>
          <Label style={{ marginBottom: 9 }}>{dateLabel}</Label>
          <div style={{ font: `400 32px/1.05 ${SERIF}`, color: 'var(--ink)' }}>{greeting}</div>
        </div>
        <div style={{ width: 42, height: 42, borderRadius: 14, background: 'var(--ink)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 4 }}>
          <span style={{ font: `400 22px/1 ${SERIF}`, color: 'var(--cream)', letterSpacing: '-.02em' }}>M</span>
        </div>
      </div>

      {nextUp ? (
        <Card pad={0} style={{ overflow: 'hidden', marginBottom: 14 }}>
          <div style={{ display: 'flex', alignItems: 'stretch' }}>
            <div style={{ width: 6, background: personColor(nextUp.owner) }} />
            <div style={{ padding: '15px 16px', flex: 1 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 7 }}>
                <Label style={{ whiteSpace: 'nowrap' }}>Teraz / najbliżej</Label>
                <span style={{ font: '500 13px/1 var(--font-sans)', color: 'var(--ink-2)' }}>{nextUp.time_start?.slice(0,5)}</span>
              </div>
              <div style={{ font: `500 19px/1.15 ${SERIF}`, color: 'var(--ink)', marginBottom: 6 }}>{nextUp.title}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                <PersonDot who={nextUp.owner} />
                <span style={{ font: '400 13px/1 var(--font-sans)', color: 'var(--ink-2)' }}>{nextUp.location}</span>
              </div>
            </div>
          </div>
        </Card>
      ) : (
        <Card style={{ marginBottom: 14, textAlign: 'center', padding: '20px' }}>
          <div style={{ font: '400 13.5px/1 var(--font-sans)', color: 'var(--ink-3)' }}>Brak wydarzeń dziś — wolny dzień 🌿</div>
        </Card>
      )}

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', margin: '6px 2px 11px', gap: 10 }}>
        <div style={{ font: '500 13px/1 var(--font-sans)', letterSpacing: '.06em', textTransform: 'uppercase', color: 'var(--ink-2)', whiteSpace: 'nowrap' }}>Plan</div>
        <div style={{ width: 186 }}>
          <Segmented value={span} onChange={setSpan} options={[{ value:'day', label:'Dzień' }, { value:'week', label:'Tydzień' }]} />
        </div>
      </div>

      {span === 'day' ? (
        <Card style={{ marginBottom: 14 }}>
          {events.length ? events.map((e, i) => (
            <div key={e.id} style={{ display: 'flex', gap: 13, padding: '11px 0',
              borderTop: i ? '1px solid var(--line)' : 'none', alignItems: 'center' }}>
              <span style={{ font: '500 13px/1 var(--font-sans)', color: 'var(--ink-2)', width: 38, flexShrink: 0 }}>{e.time_start?.slice(0,5)}</span>
              <span style={{ width: 7, height: 7, borderRadius: '50%', background: personColor(e.owner), flexShrink: 0 }} />
              <span style={{ flex: 1, font: '500 14.5px/1.25 var(--font-sans)', color: 'var(--ink)' }}>{e.title}</span>
              <span style={{ font: '400 12px/1 var(--font-sans)', color: 'var(--ink-3)', whiteSpace: 'nowrap' }}>{e.location}</span>
            </div>
          )) : (
            <div style={{ padding: '12px 0', font: '400 13.5px/1 var(--font-sans)', color: 'var(--ink-3)', textAlign: 'center' }}>
              Brak wydarzeń dziś
            </div>
          )}
        </Card>
      ) : (
        <WeekView />
      )}

      <SectionTitle title="Finanse w tym miesiącu" action="Szczegóły" onAction={onGoFinance} />
      <Card style={{ marginBottom: 14 }} onClick={onGoFinance}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 12 }}>
          <div>
            <Label style={{ marginBottom: 7 }}>Wydane razem</Label>
            <div style={{ font: `500 26px/1 ${SERIF}`, color: 'var(--ink)' }}>
              {totalSpent.toLocaleString('pl', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} <span style={{ fontSize: 16, color: 'var(--ink-2)' }}>zł</span>
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ font: '500 15px/1 var(--font-sans)', color: 'var(--due)' }}>{totalDue.toLocaleString('pl')} zł</div>
            <div style={{ font: '400 11.5px/1 var(--font-sans)', color: 'var(--ink-3)', marginTop: 4 }}>do zapłaty</div>
          </div>
        </div>
        <div style={{ height: 8, borderRadius: 4, background: 'var(--cream-warm)', overflow: 'hidden', display: 'flex' }}>
          <div style={{ width: pctA + '%', background: 'var(--a)' }} />
          <div style={{ width: pctB + '%', background: 'var(--b)' }} />
        </div>
        <div style={{ display: 'flex', gap: 16, marginTop: 10 }}>
          <Legend who="a" label={`Maniek ${spentA.toLocaleString('pl')} zł`} />
          <Legend who="b" label={`Ula ${spentB.toLocaleString('pl')} zł`} />
        </div>
      </Card>

      <SectionTitle title="Między nami" action="Otwórz" onAction={onGoChat} />
      <Card onClick={onGoChat} pad={14} style={{ marginBottom: 14 }}>
        {msgs.length ? msgs.map((m, i) => (
          <div key={i} style={{ display: 'flex', gap: 9, padding: '5px 0', alignItems: 'flex-start' }}>
            <Avatar who={m.who} size={26} />
            <div style={{ flex: 1 }}>
              <div style={{ font: '400 13.5px/1.4 var(--font-sans)', color: 'var(--ink)' }}>{m.text}</div>
            </div>
            <span style={{ font: '400 11px/1 var(--font-sans)', color: 'var(--ink-3)', marginTop: 3 }}>{m.at}</span>
          </div>
        )) : (
          <div style={{ font: '400 13.5px/1 var(--font-sans)', color: 'var(--ink-3)' }}>Napiszcie do siebie coś miłego 💬</div>
        )}
        <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', gap: 9, background: 'var(--cream-warm)',
          borderRadius: 'var(--r-pill)', padding: '9px 14px', border: '1px solid var(--line)' }}>
          <span style={{ flex: 1, font: '400 13px/1 var(--font-sans)', color: 'var(--ink-3)' }}>Napisz wiadomość…</span>
          <Icon name="send" size={17} color="var(--ink-2)" />
        </div>
      </Card>

      <SectionTitle title="Lista zakupów" action="Wszystko" onAction={onGoShopping} />
      <Card pad={14}>
        {shopping.length ? shopping.slice(0,5).map((s, i) => (
          <div key={s.id} style={{ display: 'flex', gap: 11, padding: '8px 0', alignItems: 'center',
            borderTop: i ? '1px solid var(--line)' : 'none' }}>
            <Icon name="cart" size={16} color="var(--ink-3)" />
            <span style={{ flex: 1, font: '500 14px/1 var(--font-sans)', color: 'var(--ink)' }}>{s.title}</span>
            <PersonDot who={s.added_by || 'shared'} size={7} />
          </div>
        )) : (
          <div style={{ padding: '8px 0', font: '400 13.5px/1 var(--font-sans)', color: 'var(--ink-3)' }}>Lista pusta 🎉</div>
        )}
      </Card>
    </div>
  )
}

function WeekView() {
  const [weekEvents, setWeekEvents] = useState([])
  const now = new Date()

  useEffect(() => {
    const days = []
    for (let i = 0; i < 7; i++) {
      const d = new Date(now)
      d.setDate(d.getDate() + i)
      days.push(d.toISOString().split('T')[0])
    }
    supabase.from('events').select('*')
      .gte('date', days[0]).lte('date', days[6])
      .order('date').order('time_start')
      .then(({ data }) => setWeekEvents(data || []))
  }, [])

  const dayNames = ['Nd','Pn','Wt','Śr','Cz','Pt','So']
  const days = []
  for (let i = 0; i < 7; i++) {
    const d = new Date(now)
    d.setDate(d.getDate() + i)
    const dateStr = d.toISOString().split('T')[0]
    days.push({ d, dateStr, isToday: i === 0 })
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 14 }}>
      {days.map(({ d, dateStr, isToday }) => {
        const items = weekEvents.filter(e => e.date === dateStr)
        return (
          <Card key={dateStr} pad={0} style={{ overflow: 'hidden' }}>
            <div style={{ display: 'flex', alignItems: 'stretch' }}>
              <div style={{ width: 58, flexShrink: 0, background: isToday ? 'var(--ink)' : 'var(--cream-warm)',
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '12px 0', gap: 2 }}>
                <span style={{ font: '500 11px/1 var(--font-sans)', letterSpacing: '.06em', textTransform: 'uppercase',
                  color: isToday ? 'rgba(243,239,231,.7)' : 'var(--ink-3)' }}>{dayNames[d.getDay()]}</span>
                <span style={{ font: `500 22px/1 'Bodoni Moda', Georgia, serif`, color: isToday ? 'var(--cream)' : 'var(--ink)' }}>{d.getDate()}</span>
              </div>
              <div style={{ flex: 1, padding: '10px 14px', display: 'flex', flexDirection: 'column', justifyContent: 'center', minHeight: 56 }}>
                {items.length ? items.map((ev, j) => (
                  <div key={ev.id} style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '3.5px 0' }}>
                    <span style={{ font: '500 12px/1 var(--font-sans)', color: 'var(--ink-2)', width: 34, flexShrink: 0 }}>{ev.time_start?.slice(0,5)}</span>
                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: personColor(ev.owner), flexShrink: 0 }} />
                    <span style={{ flex: 1, font: '500 13.5px/1.2 var(--font-sans)', color: 'var(--ink)' }}>{ev.title}</span>
                  </div>
                )) : (
                  <span style={{ font: '400 13px/1 var(--font-sans)', color: 'var(--ink-3)' }}>Na razie pusto</span>
                )}
              </div>
            </div>
          </Card>
        )
      })}
    </div>
  )
}

function Legend({ who, label }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <PersonDot who={who} />
      <span style={{ font: '400 12px/1 var(--font-sans)', color: 'var(--ink-2)' }}>{label}</span>
    </div>
  )
}

function fmtTime(iso) {
  if (!iso) return ''
  try { return new Date(iso).toLocaleTimeString('pl', { hour: '2-digit', minute: '2-digit' }) } catch { return '' }
}
