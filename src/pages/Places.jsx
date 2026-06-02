import { useState, useEffect } from 'react'
import Icon from '../components/Icon'
import { Stars, Card, ScreenHead, SectionTitle, EmptyState, AddBtn, navBtn, Sheet, Field, TextInput, ChipPicker } from '../components/ui'
import { supabase } from '../lib/supabase'

const CATS = ['Jedzenie', 'Aktywność']

export default function Places({ onBack }) {
  const [places, setPlaces] = useState([])
  const [cat, setCat] = useState('all')
  const [addOpen, setAddOpen] = useState(false)
  const [f, setF] = useState({ name: '', category: 'Jedzenie', city: '', notes: '', mapUrl: '' })

  useEffect(() => {
    supabase.from('places').select('*').order('rating', { ascending: false }).then(({ data }) => setPlaces(data || []))
  }, [])

  const filtered = cat === 'all' ? places : places.filter(p => p.category === cat)

  async function addPlace() {
    if (!f.name.trim()) return
    const { data } = await supabase.from('places').insert({
      name: f.name.trim(), category: f.category, city: f.city, notes: f.notes, rating: 0,
    }).select().single()
    if (data) setPlaces(prev => [...prev, data])
    setAddOpen(false)
  }

  return (
    <div className="screen" style={{ position: 'relative' }}>
      <ScreenHead title="Ulubione miejsca" sub="Restauracje · aktywność" onBack={onBack} right={
        <button style={navBtn} onClick={() => setAddOpen(true)}><Icon name="plus" size={20} color="var(--ink)" /></button>
      } />

      <div style={{ display: 'flex', gap: 8, marginBottom: 18 }}>
        {[{ value:'all', label:'Wszystkie' }, ...CATS.map(c => ({ value: c, label: c }))].map(o => {
          const active = cat === o.value
          return (
            <button key={o.value} onClick={() => setCat(o.value)} style={{
              borderRadius: 'var(--r-pill)', padding: '8px 16px', font: '500 13px/1 var(--font-sans)',
              cursor: 'pointer', border: '1px solid ' + (active ? 'var(--ink)' : 'var(--line)'),
              background: active ? 'var(--ink)' : 'var(--surface)', color: active ? '#fff' : 'var(--ink-2)',
            }}>{o.label}</button>
          )
        })}
      </div>

      {filtered.length ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {filtered.map(p => (
            <Card key={p.id} pad={14}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ font: '500 15px/1.2 var(--font-sans)', color: 'var(--ink)', marginBottom: 4 }}>{p.name}</div>
                  <div style={{ font: '400 12.5px/1 var(--font-sans)', color: 'var(--ink-2)', marginBottom: 8 }}>
                    {p.city}{p.category ? ' · ' + p.category : ''}
                  </div>
                  {p.notes && <div style={{ font: '400 13px/1.4 var(--font-sans)', color: 'var(--ink-2)', marginBottom: 8 }}>{p.notes}</div>}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <Stars value={p.rating || 0} size={13} />
                  </div>
                </div>
                {p.mapUrl && (
                  <a href={p.mapUrl} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()}
                    style={{ width: 36, height: 36, borderRadius: 10, background: 'var(--b-soft)', border: '1px solid var(--line)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, textDecoration: 'none' }}>
                    <Icon name="map" size={18} color="var(--b)" />
                  </a>
                )}
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <EmptyState icon="pin" title="Brak miejsc" sub="Dodajcie swoje ulubione miejsca."
          action={<AddBtn label="Dodaj miejsce" onClick={() => setAddOpen(true)} />} />
      )}

      <Sheet open={addOpen} title="Nowe miejsce" onClose={() => setAddOpen(false)} onSubmit={addPlace} submitLabel="Zapisz miejsce" accent="var(--a-deep)">
        <Field label="Nazwa"><TextInput value={f.name} onChange={v => setF(p=>({...p,name:v}))} placeholder="np. Bistro Warzywa" /></Field>
        <Field label="Kategoria"><ChipPicker value={f.category} onChange={v => setF(p=>({...p,category:v}))} options={CATS} /></Field>
        <Field label="Miasto / dzielnica"><TextInput value={f.city} onChange={v => setF(p=>({...p,city:v}))} placeholder="Mokotów" /></Field>
        <Field label="Notatka"><TextInput value={f.notes} onChange={v => setF(p=>({...p,notes:v}))} placeholder="Co tam lubicie" /></Field>
      </Sheet>
    </div>
  )
}
