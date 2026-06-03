import { useState, useEffect } from 'react'
import Icon from '../components/Icon'
import { Card, ScreenHead, SectionTitle, EmptyState, AddBtn, navBtn, Sheet, Field, TextInput, ChipPicker } from '../components/ui'

const MONTHS = ['styczeń','luty','marzec','kwiecień','maj','czerwiec','lipiec','sierpień','wrzesień','październik','listopad','grudzień']
const LS_KEY = 'them_birthdays'
const SERIF = "'Bodoni Moda', Georgia, serif"

export default function Birthdays({ onBack }) {
  const [birthdays, setBirthdays] = useState([])
  const [addOpen, setAddOpen] = useState(false)
  const [editItem, setEditItem] = useState(null)
  const [f, setF] = useState({ name: '', date: '', rel: 'Rodzina', year: '' })

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(LS_KEY))
      setBirthdays(saved || [])
    } catch {
      setBirthdays([])
    }
  }, [])

  function save(updated) {
    setBirthdays(updated)
    localStorage.setItem(LS_KEY, JSON.stringify(updated))
    window.dispatchEvent(new CustomEvent('birthdaysChanged'))
  }

  function openAdd() {
    setEditItem(null)
    setF({ name: '', date: '', rel: 'Rodzina', year: '' })
    setAddOpen(true)
  }

  function openEdit(b) {
    setEditItem(b)
    setF({ name: b.name, date: b.date, rel: b.rel || 'Rodzina', year: b.year ? String(b.year) : '' })
    setAddOpen(true)
  }

  function submit() {
    if (!f.name.trim() || !f.date.trim()) return
    if (editItem) {
      const updated = birthdays.map(b => b.id === editItem.id
        ? { ...b, name: f.name.trim(), date: f.date.trim(), rel: f.rel, year: f.year ? parseInt(f.year) : undefined }
        : b)
      save(updated)
    } else {
      const updated = [...birthdays, { id: Date.now(), name: f.name.trim(), date: f.date.trim(), rel: f.rel, year: f.year ? parseInt(f.year) : undefined }]
      save(updated)
    }
    setAddOpen(false)
    setEditItem(null)
  }

  function deleteItem() {
    save(birthdays.filter(b => b.id !== editItem.id))
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
        <Field label="Data (DD.MM)"><TextInput value={f.date} onChange={v => setF(p=>({...p,date:v}))} placeholder="21.02" /></Field>
        <Field label="Rok urodzenia (opcjonalnie)"><TextInput value={f.year} onChange={v => setF(p=>({...p,year:v}))} type="number" placeholder="1985" /></Field>
        <Field label="Kim jest"><ChipPicker value={f.rel} onChange={v => setF(p=>({...p,rel:v}))} options={['Rodzina','Partnerka','Partner','Córka','Syn','Przyjaciel','Inne']} /></Field>
      </Sheet>
    </div>
  )
}
