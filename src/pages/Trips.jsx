import { useState, useEffect } from 'react'
import Icon from '../components/Icon'
import { Card, ScreenHead, EmptyState, AddBtn, navBtn, Sheet, Field, TextInput } from '../components/ui'
import { supabase } from '../lib/supabase'

const SERIF = "'Bodoni Moda', Georgia, serif"
const ACCENTS = ['#C4703A', '#5E7459', '#8A6D3B', '#3E5C76']

export default function Trips({ onBack }) {
  const [trips, setTrips] = useState([])
  const [addOpen, setAddOpen] = useState(false)
  const [editItem, setEditItem] = useState(null)
  const [f, setF] = useState({ destination: '', country: '' })

  useEffect(() => {
    supabase.from('vacations').select('*').order('created_at').then(({ data }) => setTrips(data || []))
  }, [])

  function openAdd() {
    setEditItem(null)
    setF({ destination: '', country: '' })
    setAddOpen(true)
  }

  function openEdit(t) {
    setEditItem(t)
    setF({ destination: t.destination || '', country: t.country || '' })
    setAddOpen(true)
  }

  async function submit() {
    if (!f.destination.trim()) return
    if (editItem) {
      const { error } = await supabase.from('vacations').update({
        destination: f.destination.trim(), country: f.country,
      }).eq('id', editItem.id)
      if (!error) setTrips(prev => prev.map(t => t.id === editItem.id
        ? { ...t, destination: f.destination.trim(), country: f.country }
        : t))
    } else {
      const { data, error } = await supabase.from('vacations').insert({
        destination: f.destination.trim(), country: f.country,
      }).select().single()
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

  return (
    <div className="screen" style={{ position: 'relative' }}>
      <ScreenHead title="Wishlist podróży" sub="Plany i marzenia" onBack={onBack} right={
        <button style={navBtn} onClick={openAdd}><Icon name="plus" size={20} color="var(--ink)" /></button>
      } />

      {trips.length ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {trips.map((t, ti) => {
            const accent = ACCENTS[ti % ACCENTS.length]
            return (
              <Card key={t.id} pad={0} style={{ overflow: 'hidden', cursor: 'pointer' }} onClick={() => openEdit(t)}>
                <div style={{ display: 'flex', alignItems: 'stretch' }}>
                  <div style={{ width: 6, background: accent }} />
                  <div style={{ padding: '16px', flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div>
                      <div style={{ font: `500 20px/1 ${SERIF}`, color: 'var(--ink)' }}>{t.destination}</div>
                      {t.country && <div style={{ font: '400 13px/1 var(--font-sans)', color: 'var(--ink-2)', marginTop: 4 }}>{t.country}</div>}
                    </div>
                    <Icon name="edit" size={17} color="var(--ink-3)" />
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
        onClose={() => { setAddOpen(false); setEditItem(null) }}
        onSubmit={submit} submitLabel={editItem ? 'Zapisz zmiany' : 'Dodaj cel'}
        onDelete={editItem ? deleteItem : undefined}
        accent="var(--b-deep)">
        <Field label="Miejsce"><TextInput value={f.destination} onChange={v => setF(p=>({...p,destination:v}))} placeholder="np. Barcelona" /></Field>
        <Field label="Kraj"><TextInput value={f.country} onChange={v => setF(p=>({...p,country:v}))} placeholder="Hiszpania" /></Field>
      </Sheet>
    </div>
  )
}
