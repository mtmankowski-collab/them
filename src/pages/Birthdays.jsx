import { useState, useEffect } from 'react'
import Icon from '../components/Icon'
import { Card, ScreenHead, SectionTitle, EmptyState, AddBtn, navBtn, Sheet, Field, TextInput, ChipPicker } from '../components/ui'

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
import { supabase } from '../lib/supabase'

const MONTHS = ['styczeń','luty','marzec','kwiecień','maj','czerwiec','lipiec','sierpień','wrzesień','październik','listopad','grudzień']
const LS_KEY = 'them_birthdays'
const SERIF = "'Bodoni Moda', Georgia, serif"

export default function Birthdays({ onBack }) {
  const [birthdays, setBirthdays] = useState([])
  const [addOpen, setAddOpen] = useState(false)
  const [editItem, setEditItem] = useState(null)
  const [f, setF] = useState({ name: '', day: '1', month: '1', rel: 'Rodzina', year: '' })

  useEffect(() => {
    loadBirthdays()
  }, [])

  async function loadBirthdays() {
    const { data } = await supabase.from('birthdays').select('*').order('created_at')
    if (data) {
      setBirthdays(data)
      syncToLocalStorage(data)
      // Migrate old localStorage entries if Supabase is empty
      if (data.length === 0) {
        try {
          const old = JSON.parse(localStorage.getItem(LS_KEY)) || []
          if (old.length > 0) {
            const { data: inserted } = await supabase.from('birthdays').insert(
              old.map(b => ({ id: b.id, name: b.name, date: b.date, rel: b.rel || 'Inne', year: b.year || null }))
            ).select()
            if (inserted) { setBirthdays(inserted); syncToLocalStorage(inserted) }
          }
        } catch {}
      }
    }
  }

  function syncToLocalStorage(data) {
    localStorage.setItem(LS_KEY, JSON.stringify(data))
    window.dispatchEvent(new CustomEvent('birthdaysChanged'))
  }

  function openAdd() {
    setEditItem(null)
    const now = new Date()
    setF({ name: '', day: String(now.getDate()), month: String(now.getMonth() + 1), rel: 'Rodzina', year: '' })
    setAddOpen(true)
  }

  function openEdit(b) {
    setEditItem(b)
    const [dd, mm] = b.date.split('.')
    setF({ name: b.name, day: String(parseInt(dd)), month: String(parseInt(mm)), rel: b.rel || 'Rodzina', year: b.year ? String(b.year) : '' })
    setAddOpen(true)
  }

  async function submit() {
    if (!f.name.trim()) return
    const date = `${String(f.day).padStart(2,'0')}.${String(f.month).padStart(2,'0')}`
    const record = { name: f.name.trim(), date, rel: f.rel, year: f.year ? parseInt(f.year) : null }
    if (editItem) {
      const { data } = await supabase.from('birthdays').update(record).eq('id', editItem.id).select()
      if (data) {
        const updated = birthdays.map(b => b.id === editItem.id ? data[0] : b)
        setBirthdays(updated)
        syncToLocalStorage(updated)
      }
    } else {
      const { data } = await supabase.from('birthdays').insert({ id: Date.now(), ...record }).select().single()
      if (data) {
        const updated = [...birthdays, data]
        setBirthdays(updated)
        syncToLocalStorage(updated)
      }
    }
    setAddOpen(false)
    setEditItem(null)
  }

  async function deleteItem() {
    await supabase.from('birthdays').delete().eq('id', editItem.id)
    const updated = birthdays.filter(b => b.id !== editItem.id)
    setBirthdays(updated)
    syncToLocalStorage(updated)
    setAddOpen(false)
    setEditItem(null)
  }

  function parse(d) {
    const [dd, mm] = d.split('.').map(Number)
    return { dd, mm }
  }

  const sorted = [...birthdays].sort((a, b) => {
    const A = parse(a.date), B = parse(b.date)
    return A.mm - B.mm || A.dd - B.dd
  })

  const groups = {}
  sorted.forEach(b => {
    const m = parse(b.date).mm
    if (!groups[m]) groups[m] = []
    groups[m].push(b)
  })

  const turns = y => new Date().getFullYear() - y

  return (
    <div className="screen" style={{ position: 'relative' }}>
      <ScreenHead title="Urodziny" sub="Cały rok w jednym miejscu" onBack={onBack} right={
        <button style={navBtn} onClick={openAdd}><Icon name="plus" size={20} color="var(--ink)" /></button>
      } />

      {!birthdays.length ? (
        <EmptyState icon="gift" title="Brak urodzin" sub="Dodajcie pierwsze urodziny do kalendarza."
          action={<AddBtn label="Dodaj urodziny" onClick={openAdd} />} />
      ) : (
        Object.keys(groups).map(m => (
          <div key={m} style={{ marginBottom: 18 }}>
            <SectionTitle title={MONTHS[m - 1]} />
            <Card pad={0}>
              {groups[m].map((b, i) => {
                const { dd } = parse(b.date)
                return (
                  <div key={b.id} onClick={() => openEdit(b)}
                    style={{ display: 'flex', alignItems: 'center', gap: 13, padding: '13px 15px',
                      borderTop: i ? '1px solid var(--line)' : 'none', cursor: 'pointer' }}>
                    <div style={{ width: 42, height: 42, borderRadius: 13, background: 'var(--a-soft)', flexShrink: 0,
                      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                      <span style={{ font: `500 16px/1 ${SERIF}`, color: 'var(--a-deep)' }}>{dd}</span>
                      <span style={{ font: '500 8px/1 var(--font-sans)', letterSpacing: '.06em', textTransform: 'uppercase',
                        color: 'var(--a-deep)', marginTop: 2 }}>{MONTHS[m-1].slice(0,3)}</span>
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ font: '500 15px/1.1 var(--font-sans)', color: 'var(--ink)' }}>{b.name}</div>
                      <div style={{ font: '400 12px/1 var(--font-sans)', color: 'var(--ink-2)', marginTop: 4 }}>
                        {b.rel}{b.year ? ` · kończy ${turns(b.year)}` : ''}
                      </div>
                    </div>
                    <Icon name="edit" size={17} color="var(--ink-3)" />
                  </div>
                )
              })}
            </Card>
          </div>
        ))
      )}

      <Sheet open={addOpen} title={editItem ? 'Edytuj urodziny' : 'Dodaj urodziny'}
        onClose={() => { setAddOpen(false); setEditItem(null) }}
        onSubmit={submit} submitLabel="Zapisz"
        onDelete={editItem ? deleteItem : undefined}
        accent="var(--a)">
        <Field label="Kto"><TextInput value={f.name} onChange={v => setF(p=>({...p,name:v}))} placeholder="np. Babcia Hania" /></Field>
        <div style={{ display: 'flex', gap: 8 }}>
          <div style={{ flex: 3 }}>
            <Field label="Miesiąc">
              <SelectPill value={f.month} onChange={v => setF(p=>({...p,month:v}))}>
                {MONTHS.map((m, i) => <option key={i} value={i+1}>{m.charAt(0).toUpperCase()+m.slice(1)}</option>)}
              </SelectPill>
            </Field>
          </div>
          <div style={{ flex: 2 }}>
            <Field label="Dzień">
              <SelectPill value={f.day} onChange={v => setF(p=>({...p,day:v}))}>
                {Array.from({ length: new Date(2000, parseInt(f.month), 0).getDate() }, (_, i) => i+1).map(d => <option key={d} value={d}>{d}</option>)}
              </SelectPill>
            </Field>
          </div>
        </div>
        <Field label="Rok urodzenia (opcjonalnie)"><TextInput value={f.year} onChange={v => setF(p=>({...p,year:v}))} type="number" placeholder="1985" /></Field>
        <Field label="Kim jest"><ChipPicker value={f.rel} onChange={v => setF(p=>({...p,rel:v}))} options={['Rodzina','Partnerka','Partner','Córka','Syn','Przyjaciel','Inne']} /></Field>
      </Sheet>
    </div>
  )
}
