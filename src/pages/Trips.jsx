import { useState, useEffect } from 'react'
import Icon from '../components/Icon'
import { Card, ScreenHead, SectionTitle, EmptyState, AddBtn, navBtn, Sheet, Field, TextInput, ChipPicker } from '../components/ui'
import { supabase } from '../lib/supabase'

const SERIF = "'Bodoni Moda', Georgia, serif"
const ACCENTS = ['#C4703A', '#5E7459', '#8A6D3B', '#3E5C76']

export default function Trips({ onBack }) {
  const [trips, setTrips] = useState([])
  const [addOpen, setAddOpen] = useState(false)
  const [f, setF] = useState({ destination: '', country: '', notes: '', tag: 'We dwoje' })

  useEffect(() => {
    supabase.from('vacations').select('*').order('created_at').then(({ data }) => setTrips(data || []))
  }, [])

  async function addTrip() {
    if (!f.destination.trim()) return
    const accent = ACCENTS[trips.length % ACCENTS.length]
    const { data } = await supabase.from('vacations').insert({
      destination: f.destination.trim(), country: f.country, notes: f.notes || f.tag,
    }).select().single()
    if (data) setTrips(prev => [...prev, { ...data, accent }])
    setAddOpen(false)
  }

  return (
    <div className="screen" style={{ position: 'relative' }}>
      <ScreenHead title="Wishlist podróży" sub="Plany i marzenia" onBack={onBack} right={
        <button style={navBtn} onClick={() => setAddOpen(true)}><Icon name="plus" size={20} color="var(--ink)" /></button>
      } />

      {trips.length ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {trips.map((t, ti) => {
            const accent = t.accent || ACCENTS[ti % ACCENTS.length]
            return (
              <Card key={t.id} pad={0} style={{ overflow: 'hidden' }}>
                <div style={{ display: 'flex', alignItems: 'stretch' }}>
                  <div style={{ width: 6, background: accent }} />
                  <div style={{ padding: '16px', flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                      <div>
                        <div style={{ font: `500 20px/1 ${SERIF}`, color: 'var(--ink)' }}>{t.destination}</div>
                        <div style={{ font: '400 13px/1 var(--font-sans)', color: 'var(--ink-2)', marginTop: 4 }}>{t.country}</div>
                      </div>
                      {t.notes && (
                        <span style={{ font: '500 11px/1 var(--font-sans)', letterSpacing: '.06em', textTransform: 'uppercase',
                          color: accent, background: accent + '1A', borderRadius: 'var(--r-pill)',
                          padding: '5px 11px', whiteSpace: 'nowrap' }}>{t.notes}</span>
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            )
          })}
        </div>
      ) : (
        <EmptyState icon="plane" title="Brak planów" sub="Dodajcie miejsca, które chcecie razem odwiedzić."
          action={<AddBtn label="Dodaj cel" onClick={() => setAddOpen(true)} />} />
      )}

      <Sheet open={addOpen} title="Nowy cel podróży" onClose={() => setAddOpen(false)} onSubmit={addTrip} submitLabel="Dodaj cel" accent="var(--b-deep)">
        <Field label="Miejsce"><TextInput value={f.destination} onChange={v => setF(p=>({...p,destination:v}))} placeholder="np. Barcelona" /></Field>
        <div style={{ display: 'flex', gap: 12 }}>
          <div style={{ flex: 1 }}><Field label="Kraj"><TextInput value={f.country} onChange={v => setF(p=>({...p,country:v}))} placeholder="Hiszpania" /></Field></div>
        </div>
        <Field label="Z kim"><ChipPicker value={f.tag} onChange={v => setF(p=>({...p,tag:v}))} options={['We dwoje','Z Tosią','Marzenie']} /></Field>
      </Sheet>
    </div>
  )
}
