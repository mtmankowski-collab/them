import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { IconPlus, IconX, IconStarFilled, IconStar } from '@tabler/icons-react'

const CATEGORIES = ['Restauracja','Kawiarnia','Plac zabaw','Aktywność','Atrakcja','Inne']

function Stars({ value, onChange }) {
  return (
    <div className="stars">
      {[1,2,3,4,5].map(i => (
        <button key={i} onClick={() => onChange?.(i)} style={{ background: 'none', border: 'none', padding: 0 }}>
          {i <= value ? <IconStarFilled size={16} style={{ color: '#F5A623' }} /> : <IconStar size={16} style={{ color: 'var(--border)' }} />}
        </button>
      ))}
    </div>
  )
}

export default function Places({ user }) {
  const [places, setPlaces] = useState([])
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState({ name: '', category: 'Restauracja', city: '', country: 'Polska', rating: 0, notes: '' })

  useEffect(() => { load() }, [])

  async function load() {
    const { data, error } = await supabase.from('places').select('*').order('rating', { ascending: false })
    if (!error) setPlaces(data || [])
  }

  async function save() {
    if (!form.name) return
    await supabase.from('places').insert({ ...form, added_by: user.initials })
    setShowModal(false)
    setForm({ name: '', category: 'Restauracja', city: '', country: 'Polska', rating: 0, notes: '' })
    load()
  }

  return (
    <div className="page" style={{ padding: '16px', paddingBottom: 'calc(var(--nav-height) + var(--safe-bottom) + 24px)' }}>
      {places.map(p => (
        <div key={p.id} className="card" style={{ marginBottom: 8 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
            <div>
              <div style={{ fontWeight: 500, fontSize: 15 }}>{p.name}</div>
              <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>{p.category} · {p.city}{p.country && p.country !== 'Polska' ? `, ${p.country}` : ''}</div>
            </div>
            <div style={{ width: 22, height: 22, borderRadius: '50%', background: p.added_by === 'M' ? '#C4703A' : '#378ADD', fontSize: 10, fontWeight: 700, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{p.added_by}</div>
          </div>
          <Stars value={p.rating || 0} />
          {p.notes && <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 8 }}>{p.notes}</div>}
        </div>
      ))}

      {places.length === 0 && <div className="empty-state"><p>Brak miejsc. Dodaj pierwsze!</p></div>}

      <button className="fab" onClick={() => setShowModal(true)}><IconPlus size={24} /></button>

      {showModal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowModal(false)}>
          <div className="modal-sheet">
            <div className="modal-handle" />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h3 className="modal-title" style={{ margin: 0 }}>Nowe miejsce</h3>
              <button onClick={() => setShowModal(false)}><IconX size={20} color="var(--text-secondary)" /></button>
            </div>
            <div className="form-group">
              <label className="form-label">Nazwa</label>
              <input className="form-input" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Nazwa miejsca" />
            </div>
            <div className="form-group">
              <label className="form-label">Kategoria</label>
              <select className="form-input" value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
                {CATEGORIES.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <div className="form-group" style={{ flex: 1 }}>
                <label className="form-label">Miasto</label>
                <input className="form-input" value={form.city} onChange={e => setForm(f => ({ ...f, city: e.target.value }))} placeholder="Warszawa" />
              </div>
              <div className="form-group" style={{ flex: 1 }}>
                <label className="form-label">Kraj</label>
                <input className="form-input" value={form.country} onChange={e => setForm(f => ({ ...f, country: e.target.value }))} placeholder="Polska" />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Ocena</label>
              <Stars value={form.rating} onChange={r => setForm(f => ({ ...f, rating: r }))} />
            </div>
            <div className="form-group">
              <label className="form-label">Notatki</label>
              <textarea className="form-input" rows={3} value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="Opcjonalne" style={{ resize: 'none' }} />
            </div>
            <button className="btn-primary" onClick={save}>Zapisz</button>
          </div>
        </div>
      )}
    </div>
  )
}
