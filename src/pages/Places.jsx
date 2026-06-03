import { useState, useEffect } from 'react'
import Icon from '../components/Icon'
import { Stars, StarRate, Card, ScreenHead, EmptyState, AddBtn, navBtn, Sheet, Field, TextInput, ChipPicker, PersonPicker } from '../components/ui'
import { supabase } from '../lib/supabase'

const CATS = ['Jedzenie', 'Aktywność']

function encodeNotes(notes, mapUrl) {
  if (!mapUrl) return notes
  return notes ? `${notes}\n__MAP__${mapUrl}` : `__MAP__${mapUrl}`
}
function decodeNotes(stored) {
  if (!stored) return { notes: '', mapUrl: '' }
  if (stored.startsWith('__MAP__')) return { notes: '', mapUrl: stored.slice(7) }
  const idx = stored.indexOf('\n__MAP__')
  if (idx === -1) return { notes: stored, mapUrl: '' }
  return { notes: stored.slice(0, idx), mapUrl: stored.slice(idx + 8) }
}

export default function Places({ onBack }) {
  const [places, setPlaces] = useState([])
  const [cat, setCat] = useState('all')
  const [addOpen, setAddOpen] = useState(false)
  const [editItem, setEditItem] = useState(null)
  const [f, setF] = useState({ name: '', category: 'Jedzenie', city: '', notes: '', map_url: '', added_by: 'shared' })
  const [insertError, setInsertError] = useState('')

  useEffect(() => {
    supabase.from('places').select('*').order('rating', { ascending: false }).then(({ data }) => setPlaces(data || []))
  }, [])

  const filtered = cat === 'all' ? places : places.filter(p => p.category === cat)

  function openAdd() {
    setEditItem(null)
    setF({ name: '', category: 'Jedzenie', city: '', notes: '', map_url: '', added_by: 'shared' })
    setAddOpen(true)
  }

  function openEdit(p) {
    setEditItem(p)
    const { notes, mapUrl } = decodeNotes(p.notes)
    setF({ name: p.name, category: p.category || 'Jedzenie', city: p.city || '', notes, map_url: mapUrl, added_by: p.added_by || 'shared' })
    setAddOpen(true)
  }

  async function submit() {
    if (!f.name.trim()) return
    setInsertError('')
    const encodedNotes = encodeNotes(f.notes, f.map_url)
    if (editItem) {
      const { error } = await supabase.from('places').update({
        name: f.name.trim(), category: f.category, city: f.city, notes: encodedNotes, added_by: f.added_by,
      }).eq('id', editItem.id)
      if (error) { setInsertError(error.message); return }
      setPlaces(prev => prev.map(p => p.id === editItem.id
        ? { ...p, name: f.name.trim(), category: f.category, city: f.city, notes: encodedNotes }
        : p))
    } else {
      const { data, error } = await supabase.from('places').insert({
        name: f.name.trim(), category: f.category, city: f.city, notes: encodedNotes, added_by: f.added_by,
      }).select().single()
      if (error) { setInsertError(error.message); return }
      if (data) setPlaces(prev => [data, ...prev])
    }
    setAddOpen(false)
    setEditItem(null)
  }

  async function rate(id, val) {
    await supabase.from('places').update({ rating: val }).eq('id', id)
    setPlaces(prev => prev.map(p => p.id === id ? { ...p, rating: val } : p))
  }

  async function deleteItem() {
    if (!editItem) return
    await supabase.from('places').delete().eq('id', editItem.id)
    setPlaces(prev => prev.filter(p => p.id !== editItem.id))
    setAddOpen(false)
    setEditItem(null)
  }

  return (
    <div className="screen" style={{ position: 'relative' }}>
      <ScreenHead title="Ulubione miejsca" sub="Restauracje · aktywność" onBack={onBack} right={
        <button style={navBtn} onClick={openAdd}><Icon name="plus" size={20} color="var(--ink)" /></button>
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
          {filtered.map(p => {
            const { notes: displayNotes, mapUrl } = decodeNotes(p.notes)
            return (
              <Card key={p.id} pad={14} onClick={() => openEdit(p)} style={{ cursor: 'pointer' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ font: '500 15px/1.2 var(--font-sans)', color: 'var(--ink)', marginBottom: 4 }}>{p.name}</div>
                    <div style={{ font: '400 12.5px/1 var(--font-sans)', color: 'var(--ink-2)', marginBottom: 8 }}>
                      {p.city}{p.category ? ' · ' + p.category : ''}
                    </div>
                    {displayNotes && <div style={{ font: '400 13px/1.4 var(--font-sans)', color: 'var(--ink-2)', marginBottom: 8 }}>{displayNotes}</div>}
                    <StarRate value={p.rating || 0} onChange={v => { rate(p.id, v) }} size={14} />
                  </div>
                  {mapUrl ? (
                    <a href={mapUrl} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()}
                      style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'var(--b)', border: 'none',
                        borderRadius: 'var(--r-pill)', padding: '10px 14px', textDecoration: 'none', flexShrink: 0, cursor: 'pointer' }}>
                      <Icon name="map" size={16} color="#fff" />
                      <span style={{ font: '600 12px/1 var(--font-sans)', color: '#fff', whiteSpace: 'nowrap' }}>Nawiguj</span>
                    </a>
                  ) : null}
                </div>
              </Card>
            )
          })}
        </div>
      ) : (
        <EmptyState icon="pin" title="Brak miejsc" sub="Dodajcie swoje ulubione miejsca."
          action={<AddBtn label="Dodaj miejsce" onClick={openAdd} />} />
      )}

      <Sheet open={addOpen} title={editItem ? 'Edytuj miejsce' : 'Nowe miejsce'}
        onClose={() => { setAddOpen(false); setEditItem(null); setInsertError('') }}
        onSubmit={submit} submitLabel={editItem ? 'Zapisz zmiany' : 'Zapisz miejsce'}
        onDelete={editItem ? deleteItem : undefined}
        accent="var(--a-deep)">
        {insertError && <div style={{ font: '400 12.5px/1.4 var(--font-sans)', color: '#B6543F', padding: '8px 12px',
          background: 'rgba(182,84,63,.08)', borderRadius: 8, border: '1px solid rgba(182,84,63,.2)' }}>{insertError}</div>}
        <Field label="Nazwa"><TextInput value={f.name} onChange={v => setF(p=>({...p,name:v}))} placeholder="np. Bistro Warzywa" /></Field>
        <Field label="Kategoria"><ChipPicker value={f.category} onChange={v => setF(p=>({...p,category:v}))} options={CATS} /></Field>
        <Field label="Miasto / dzielnica"><TextInput value={f.city} onChange={v => setF(p=>({...p,city:v}))} placeholder="Mokotów" /></Field>
        <Field label="Notatka"><TextInput value={f.notes} onChange={v => setF(p=>({...p,notes:v}))} placeholder="Co tam lubicie" /></Field>
        <Field label="Link Google Maps (opcjonalnie)"><TextInput value={f.map_url} onChange={v => setF(p=>({...p,map_url:v}))} placeholder="https://maps.google.com/..." /></Field>
        <Field label="Kto dodaje"><PersonPicker value={f.added_by} onChange={v => setF(p=>({...p,added_by:v}))} /></Field>
      </Sheet>
    </div>
  )
}
