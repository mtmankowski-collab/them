import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { IconPlus, IconX, IconPlaneTilt } from '@tabler/icons-react'

export default function Vacations({ user }) {
  const [items, setItems] = useState([])
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState({ destination: '', country: '', notes: '' })

  useEffect(() => { load() }, [])

  async function load() {
    const { data, error } = await supabase.from('vacations').select('*').order('created_at', { ascending: false })
    if (!error) setItems(data || [])
  }

  async function save() {
    if (!form.destination) return
    await supabase.from('vacations').insert({ ...form, added_by: user.initials })
    setShowModal(false)
    setForm({ destination: '', country: '', notes: '' })
    load()
  }

  return (
    <div className="page" style={{ padding: '16px', paddingBottom: 'calc(var(--nav-height) + var(--safe-bottom) + 24px)' }}>
      {items.map(v => (
        <div key={v.id} className="card" style={{ marginBottom: 8, display: 'flex', gap: 12, alignItems: 'flex-start' }}>
          <div style={{ fontSize: 24, flexShrink: 0 }}>✈️</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 500, fontSize: 15 }}>{v.destination}</div>
            {v.country && <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>{v.country}</div>}
            {v.notes && <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 6 }}>{v.notes}</div>}
          </div>
          <div style={{ width: 22, height: 22, borderRadius: '50%', background: v.added_by === 'M' ? '#C4703A' : '#378ADD', fontSize: 10, fontWeight: 700, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{v.added_by}</div>
        </div>
      ))}

      {items.length === 0 && <div className="empty-state"><p>Lista wakacyjna pusta. Marzcie!</p></div>}

      <button className="fab" onClick={() => setShowModal(true)}><IconPlus size={24} /></button>

      {showModal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowModal(false)}>
          <div className="modal-sheet">
            <div className="modal-handle" />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h3 className="modal-title" style={{ margin: 0 }}>Nowy cel podróży</h3>
              <button onClick={() => setShowModal(false)}><IconX size={20} color="var(--text-secondary)" /></button>
            </div>
            <div className="form-group">
              <label className="form-label">Destynacja</label>
              <input className="form-input" value={form.destination} onChange={e => setForm(f => ({ ...f, destination: e.target.value }))} placeholder="np. Lizbona" />
            </div>
            <div className="form-group">
              <label className="form-label">Kraj</label>
              <input className="form-input" value={form.country} onChange={e => setForm(f => ({ ...f, country: e.target.value }))} placeholder="np. Portugalia" />
            </div>
            <div className="form-group">
              <label className="form-label">Notatki</label>
              <textarea className="form-input" rows={3} value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="Dlaczego tam? Kiedy? Co zobaczyć?" style={{ resize: 'none' }} />
            </div>
            <button className="btn-primary" onClick={save}>Dodaj</button>
          </div>
        </div>
      )}
    </div>
  )
}
