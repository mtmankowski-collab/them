import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { IconPlus, IconCheck } from '@tabler/icons-react'

export default function Shopping({ user }) {
  const [items, setItems] = useState([])
  const [input, setInput] = useState('')

  useEffect(() => {
    load()
    const channel = supabase
      .channel('shopping-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'shopping' }, load)
      .subscribe()
    return () => supabase.removeChannel(channel)
  }, [])

  async function load() {
    const { data, error } = await supabase.from('shopping').select('*').order('created_at')
    if (!error) setItems(data || [])
  }

  async function addItem() {
    if (!input.trim()) return
    await supabase.from('shopping').insert({ title: input.trim(), done: false, added_by: user.initials })
    setInput('')
  }

  async function toggleDone(item) {
    await supabase.from('shopping').update({ done: !item.done }).eq('id', item.id)
  }

  async function deleteItem(id) {
    await supabase.from('shopping').delete().eq('id', id)
  }

  const active = items.filter(i => !i.done)
  const done = items.filter(i => i.done)

  return (
    <div className="page" style={{ padding: '16px', paddingBottom: 'calc(var(--nav-height) + var(--safe-bottom) + 24px)' }}>
      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        <input
          className="form-input"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && addItem()}
          placeholder="Dodaj produkt..."
        />
        <button onClick={addItem} style={{ width: 46, height: 46, borderRadius: 10, background: 'var(--accent-m)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <IconPlus size={20} />
        </button>
      </div>

      {active.map(item => (
        <div key={item.id} className="card" style={{ marginBottom: 8, display: 'flex', alignItems: 'center', gap: 12 }}>
          <button onClick={() => toggleDone(item)} style={{ width: 24, height: 24, borderRadius: '50%', border: '1.5px solid var(--border)', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }} />
          <span style={{ flex: 1, fontSize: 15 }}>{item.title}</span>
          <div style={{ width: 20, height: 20, borderRadius: '50%', background: item.added_by === 'M' ? '#C4703A' : '#378ADD', fontSize: 9, fontWeight: 700, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{item.added_by}</div>
        </div>
      ))}

      {done.length > 0 && (
        <>
          <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)', letterSpacing: '0.08em', textTransform: 'uppercase', margin: '16px 0 10px' }}>
            Kupione · {done.length}
          </div>
          {done.map(item => (
            <div key={item.id} className="card" style={{ marginBottom: 8, display: 'flex', alignItems: 'center', gap: 12, opacity: 0.5 }}>
              <button onClick={() => toggleDone(item)} style={{ width: 24, height: 24, borderRadius: '50%', background: 'var(--accent-shared)', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <IconCheck size={14} color="#fff" strokeWidth={2.5} />
              </button>
              <span style={{ flex: 1, fontSize: 15, textDecoration: 'line-through' }}>{item.title}</span>
              <button onClick={() => deleteItem(item.id)} style={{ fontSize: 12, color: 'var(--text-secondary)' }}>usuń</button>
            </div>
          ))}
        </>
      )}

      {items.length === 0 && (
        <div className="empty-state"><p>Lista pusta. Czas na zakupy!</p></div>
      )}
    </div>
  )
}
