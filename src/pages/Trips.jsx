import { useState, useEffect } from 'react'
import Icon from '../components/Icon'
import { Card, ScreenHead, EmptyState, AddBtn, navBtn, Sheet, Field, TextInput, PersonPicker, ChipPicker, SectionTitle } from '../components/ui'
import { supabase } from '../lib/supabase'

const SERIF = "'Bodoni Moda', Georgia, serif"
const ACCENTS = ['#C4703A', '#5E7459', '#8A6D3B', '#3E5C76']
const PLACE_TYPES = ['Restauracja', 'Atrakcja', 'Nocleg', 'Inne']

function getTripPlaces(tripId) {
  try { return JSON.parse(localStorage.getItem(`them_trip_places_${tripId}`)) || [] } catch { return [] }
}
function setTripPlaces(tripId, places) {
  localStorage.setItem(`them_trip_places_${tripId}`, JSON.stringify(places))
}

export default function Trips({ onBack }) {
  const [trips, setTrips] = useState([])
  const [addOpen, setAddOpen] = useState(false)
  const [editItem, setEditItem] = useState(null)
  const [f, setF] = useState({ destination: '', country: '', added_by: 'shared' })
  const [insertError, setInsertError] = useState('')
  const [selectedTrip, setSelectedTrip] = useState(null)

  useEffect(() => {
    supabase.from('vacations').select('*').order('created_at').then(({ data }) => setTrips(data || []))
  }, [])

  function openAdd() {
    setEditItem(null)
    setF({ destination: '', country: '', added_by: 'shared' })
    setAddOpen(true)
  }

  function openEdit(t) {
    setEditItem(t)
    setF({ destination: t.destination || '', country: t.country || '', added_by: t.added_by || 'shared' })
    setAddOpen(true)
  }

  async function submit() {
    if (!f.destination.trim()) return
    setInsertError('')
    if (editItem) {
      const { error } = await supabase.from('vacations').update({
        destination: f.destination.trim(), country: f.country, added_by: f.added_by,
      }).eq('id', editItem.id)
      if (error) { setInsertError(error.message); return }
      setTrips(prev => prev.map(t => t.id === editItem.id
        ? { ...t, destination: f.destination.trim(), country: f.country }
        : t))
    } else {
      const { data, error } = await supabase.from('vacations').insert({
        destination: f.destination.trim(), country: f.country || '', added_by: f.added_by,
      }).select().single()
      if (error) { setInsertError(error.message); return }
      if (data) setTrips(prev => [...prev, data])
    }
    setAddOpen(false)
    setEditItem(null)
  }

  async function deleteItem() {
    if (!editItem) return
    await supabase.from('vacations').delete().eq('id', editItem.id)
    setTrips(prev => prev.filter(t => t.id !== editItem.id))
    setAddOpen(false)
    setEditItem(null)
  }

  if (selectedTrip) {
    return <TripDetail trip={selectedTrip} onBack={() => setSelectedTrip(null)} onEdit={() => { setSelectedTrip(null); openEdit(selectedTrip) }} />
  }

  return (
    <div className="screen" style={{ position: 'relative' }}>
      <ScreenHead title="Wishlist podróży" sub="Plany i marzenia" onBack={onBack} right={
        <button style={navBtn} onClick={openAdd}><Icon name="plus" size={20} color="var(--ink)" /></button>
      } />

      {trips.length ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {trips.map((t, ti) => {
            const accent = ACCENTS[ti % ACCENTS.length]
            const places = getTripPlaces(t.id)
            return (
              <Card key={t.id} pad={0} style={{ overflow: 'hidden', cursor: 'pointer' }} onClick={() => setSelectedTrip(t)}>
                <div style={{ display: 'flex', alignItems: 'stretch' }}>
                  <div style={{ width: 6, background: accent }} />
                  <div style={{ padding: '16px', flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div>
                      <div style={{ font: `500 20px/1 ${SERIF}`, color: 'var(--ink)' }}>{t.destination}</div>
                      {t.country && <div style={{ font: '400 13px/1 var(--font-sans)', color: 'var(--ink-2)', marginTop: 4 }}>{t.country}</div>}
                      {places.length > 0 && (
                        <div style={{ font: '400 12px/1 var(--font-sans)', color: 'var(--ink-3)', marginTop: 6 }}>
                          {places.length} {places.length === 1 ? 'miejsce' : 'miejsca/miejsc'}
                        </div>
                      )}
                    </div>
                    <Icon name="chevron" size={17} color="var(--ink-3)" />
                  </div>
                </div>
              </Card>
            )
          })}
        </div>
      ) : (
        <EmptyState icon="plane" title="Brak planów" sub="Dodajcie miejsca, które chcecie razem odwiedzić."
          action={<AddBtn label="Dodaj cel" onClick={openAdd} />} />
      )}

      <Sheet open={addOpen} title={editItem ? 'Edytuj podróż' : 'Nowy cel podróży'}
        onClose={() => { setAddOpen(false); setEditItem(null); setInsertError('') }}
        onSubmit={submit} submitLabel={editItem ? 'Zapisz zmiany' : 'Dodaj cel'}
        onDelete={editItem ? deleteItem : undefined}
        accent="var(--b-deep)">
        {insertError && <div style={{ font: '400 12.5px/1.4 var(--font-sans)', color: '#B6543F', padding: '8px 12px',
          background: 'rgba(182,84,63,.08)', borderRadius: 8, border: '1px solid rgba(182,84,63,.2)' }}>{insertError}</div>}
        <Field label="Miejsce"><TextInput value={f.destination} onChange={v => setF(p=>({...p,destination:v}))} placeholder="np. Barcelona" /></Field>
        <Field label="Kraj"><TextInput value={f.country} onChange={v => setF(p=>({...p,country:v}))} placeholder="Hiszpania" /></Field>
        <Field label="Kto planuje"><PersonPicker value={f.added_by} onChange={v => setF(p=>({...p,added_by:v}))} /></Field>
      </Sheet>
    </div>
  )
}

function TripDetail({ trip, onBack, onEdit }) {
  const [places, setPlaces] = useState(() => getTripPlaces(trip.id))
  const [addOpen, setAddOpen] = useState(false)
  const [editItem, setEditItem] = useState(null)
  const [f, setF] = useState({ name: '', type: 'Restauracja', notes: '' })

  function saveAll(updated) {
    setPlaces(updated)
    setTripPlaces(trip.id, updated)
  }

  function openAdd() {
    setEditItem(null)
    setF({ name: '', type: 'Restauracja', notes: '' })
    setAddOpen(true)
  }

  function openEdit(p) {
    setEditItem(p)
    setF({ name: p.name, type: p.type, notes: p.notes || '' })
    setAddOpen(true)
  }

  function submit() {
    if (!f.name.trim()) return
    if (editItem) {
      saveAll(places.map(p => p.id === editItem.id ? { ...p, name: f.name.trim(), type: f.type, notes: f.notes.trim() } : p))
    } else {
      saveAll([...places, { id: Date.now(), name: f.name.trim(), type: f.type, notes: f.notes.trim() }])
    }
    setAddOpen(false)
    setEditItem(null)
  }

  function deletePlace() {
    if (!editItem) return
    saveAll(places.filter(p => p.id !== editItem.id))
    setAddOpen(false)
    setEditItem(null)
  }

  const grouped = PLACE_TYPES.reduce((acc, type) => {
    acc[type] = places.filter(p => p.type === type)
    return acc
  }, {})

  const TYPE_ICONS = { Restauracja: '🍽', Atrakcja: '🗺', Nocleg: '🛏', Inne: '📌' }

  return (
    <div className="screen" style={{ position: 'relative' }}>
      <ScreenHead title={trip.destination} sub={trip.country || 'Wishlist podróży'} onBack={onBack} right={
        <div style={{ display: 'flex', gap: 8 }}>
          <button style={navBtn} onClick={onEdit}><Icon name="edit" size={18} color="var(--ink)" /></button>
          <button style={navBtn} onClick={openAdd}><Icon name="plus" size={20} color="var(--ink)" /></button>
        </div>
      } />

      {places.length === 0 ? (
        <EmptyState icon="pin" title="Brak miejsc" sub="Dodajcie restauracje, atrakcje i noclegi."
          action={<AddBtn label="Dodaj miejsce" onClick={openAdd} />} />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {PLACE_TYPES.map(type => grouped[type].length > 0 && (
            <div key={type}>
              <SectionTitle title={`${TYPE_ICONS[type]} ${type}`} />
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {grouped[type].map(p => (
                  <Card key={p.id} pad={14} onClick={() => openEdit(p)} style={{ cursor: 'pointer' }}>
                    <div style={{ font: '500 15px/1.2 var(--font-sans)', color: 'var(--ink)' }}>{p.name}</div>
                    {p.notes && <div style={{ font: '400 13px/1.4 var(--font-sans)', color: 'var(--ink-2)', marginTop: 4 }}>{p.notes}</div>}
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      <Sheet open={addOpen} title={editItem ? 'Edytuj miejsce' : 'Nowe miejsce'} accent="var(--b-deep)"
        onClose={() => { setAddOpen(false); setEditItem(null) }}
        onSubmit={submit} submitLabel={editItem ? 'Zapisz zmiany' : 'Dodaj miejsce'}
        onDelete={editItem ? deletePlace : undefined}>
        <Field label="Nazwa"><TextInput value={f.name} onChange={v => setF(p=>({...p,name:v}))} placeholder="np. La Boqueria" /></Field>
        <Field label="Typ"><ChipPicker value={f.type} onChange={v => setF(p=>({...p,type:v}))} options={PLACE_TYPES} /></Field>
        <Field label="Notatka (opcjonalnie)"><TextInput value={f.notes} onChange={v => setF(p=>({...p,notes:v}))} placeholder="adres, godziny, uwagi…" /></Field>
      </Sheet>
    </div>
  )
}
