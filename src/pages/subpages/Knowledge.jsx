import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { IconPlus, IconX } from '@tabler/icons-react'

export default function Knowledge({ user }) {
  const [items, setItems] = useState([])
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState({ title: '', content: '', category: '' })
  const [expanded, setExpanded] = useState(null)

  useEffect(() => { load() }, [])

  async function load() {
    const { data, error } = await supabase.from('knowledge').select('*').order('category').order('title')
    if (!error) setItems(data || [])
  }

  async function save() {
    if (!form.title || !form.content) return
    await supabase.from('knowledge').insert({ ...form })
    setShowModal(false)
    setForm({ title: '', content: '', category: '' })
    load()
  }

  const grouped = items.reduce((acc, item) => {
    const cat = item.category || 'Inne'
    if (!acc[cat]) acc[cat] = []
    acc[cat].push(item)
    return acc
  }, {})

  return (
    <div className="page" style={{ padding: '16px', paddingBottom: 'calc(var(--nav-height) + var(--safe-bottom) + 24px)' }}>
      {Object.entries(grouped).map(([cat, entries]) => (
        <div key={cat} style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 10 }}>{cat}</div>
          {entries.map(e => (
            <div key={e.id} className="card" style={{ marginBottom: 8 }} onClick={() => setExpanded(expanded === e.id ? null : e.id)}>
              <div style={{ fontWeight: 500, fontSize: 15 }}>{e.title}</div>
              {expanded === e.id && (
                <div style={{ marginTop: 10, fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{e.content}</div>
              )}
            </div>
          ))}
        </div>
      ))}

      {items.length === 0 && <div className="empty-state"><p>Baza wiedzy jest pusta.</p></div>}

      <button className="fab" onClick={() => setShowModal(true)}><IconPlus size={24} /></button>

      {showModal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowModal(false)}>
          <div className="modal-sheet">
            <div className="modal-handle" />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h3 className="modal-title" style={{ margin: 0 }}>Nowa notatka</h3>
              <button onClick={() => setShowModal(false)}><IconX size={20} color="var(--text-secondary)" /></button>
            </div>
            <div className="form-group">
              <label className="form-label">Tytuł</label>
              <input className="form-input" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="np. Hasło do WiFi" />
            </div>
            <div className="form-group">
              <label className="form-label">Kategoria</label>
              <input className="form-input" value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} placeholder="np. Dom, Finanse..." />
            </div>
            <div className="form-group">
              <label className="form-label">Treść</label>
              <textarea className="form-input" rows={4} value={form.content} onChange={e => setForm(f => ({ ...f, content: e.target.value }))} placeholder="Szczegóły..." style={{ resize: 'none' }} />
            </div>
            <button className="btn-primary" onClick={save}>Zapisz</button>
          </div>
        </div>
      )}
    </div>
  )
}
