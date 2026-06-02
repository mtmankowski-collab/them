import { useState, useEffect } from 'react'
import Icon from '../components/Icon'
import { PersonDot, Card, ScreenHead, SectionTitle, navBtn, Sheet, Field, TextInput, PersonPicker } from '../components/ui'
import { supabase } from '../lib/supabase'

export default function Shopping({ onBack }) {
  const [items, setItems] = useState([])
  const [addOpen, setAddOpen] = useState(false)
  const [f, setF] = useState({ name: '', qty: '', added_by: 'a' })

  useEffect(() => {
    supabase.from('shopping').select('*').order('created_at', { ascending: false }).then(({ data }) => setItems(data || []))
    const sub = supabase.channel('shopping-live')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'shopping' }, () => {
        supabase.from('shopping').select('*').order('created_at', { ascending: false }).then(({ data }) => setItems(data || []))
      }).subscribe()
    return () => supabase.removeChannel(sub)
  }, [])

  async function toggle(item) {
    await supabase.from('shopping').update({ done: !item.done }).eq('id', item.id)
    setItems(prev => prev.map(i => i.id === item.id ? { ...i, done: !i.done } : i))
  }

  async function remove(id) {
    await supabase.from('shopping').delete().eq('id', id)
    setItems(prev => prev.filter(i => i.id !== id))
  }

  async function addItem() {
    if (!f.name.trim()) return
    const { data } = await supabase.from('shopping').insert({
      title: f.name.trim(), done: false, added_by: f.added_by,
    }).select().single()
    if (data) setItems(prev => [data, ...prev])
    setAddOpen(false)
    setF({ name: '', qty: '', added_by: 'a' })
  }

  const toBuy = items.filter(i => !i.done)
  const bought = items.filter(i => i.done)

  return (
    <div className="screen" style={{ position: 'relative' }}>
      <ScreenHead title="Lista zakupów" sub={`${toBuy.length} do kupienia`} onBack={onBack} right={
        <button style={navBtn} onClick={() => setAddOpen(true)}><Icon name="plus" size={20} color="var(--ink)" /></button>
      } />

      <Card pad={0} style={{ marginBottom: 16 }}>
        {toBuy.map((s, i) => <Row key={s.id} s={s} onToggle={toggle} onRemove={remove} border={i > 0} />)}
        {!toBuy.length && (
          <div style={{ padding: '20px', textAlign: 'center', font: '400 13.5px/1 var(--font-sans)', color: 'var(--ink-3)' }}>
            Wszystko kupione 🎉
          </div>
        )}
      </Card>

      <button onClick={() => setAddOpen(true)} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 9,
        background: 'var(--surface)', border: '1px solid var(--line)', cursor: 'pointer',
        borderRadius: 'var(--r-pill)', padding: '11px 16px', marginBottom: 22, boxShadow: 'var(--sh-1)' }}>
        <Icon name="plus" size={18} color="var(--ink-2)" />
        <span style={{ flex: 1, textAlign: 'left', font: '400 14px/1 var(--font-sans)', color: 'var(--ink-3)' }}>Dodaj produkt…</span>
      </button>

      {bought.length > 0 && <>
        <SectionTitle title={`Kupione · ${bought.length}`} />
        <Card pad={0} style={{ opacity: 0.8 }}>
          {bought.map((s, i) => <Row key={s.id} s={s} onToggle={toggle} onRemove={remove} border={i > 0} />)}
        </Card>
      </>}

      <Sheet open={addOpen} title="Dodaj produkt" onClose={() => setAddOpen(false)} onSubmit={addItem} submitLabel="Dodaj do listy">
        <Field label="Produkt"><TextInput value={f.name} onChange={v => setF(p=>({...p,name:v}))} placeholder="np. Mleko" /></Field>
        <Field label="Ilość (opcjonalnie)"><TextInput value={f.qty} onChange={v => setF(p=>({...p,qty:v}))} placeholder="2 szt" /></Field>
        <Field label="Dla kogo"><PersonPicker value={f.added_by} onChange={v => setF(p=>({...p,added_by:v}))} /></Field>
      </Sheet>
    </div>
  )
}

function Row({ s, onToggle, onRemove, border }) {
  return (
    <div style={{ display: 'flex', gap: 13, padding: '13px 15px', alignItems: 'center',
      borderTop: border ? '1px solid var(--line)' : 'none' }}>
      <div onClick={() => onToggle(s)} style={{ width: 24, height: 24, borderRadius: 8, flexShrink: 0, cursor: 'pointer',
        border: '1.8px solid ' + (s.done ? 'var(--paid)' : 'var(--line-strong)'),
        background: s.done ? 'var(--paid)' : 'transparent',
        display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {s.done && <Icon name="check" size={15} color="#fff" stroke={2.2} />}
      </div>
      <span onClick={() => onToggle(s)} style={{ flex: 1, font: '500 15px/1.1 var(--font-sans)', cursor: 'pointer',
        color: s.done ? 'var(--ink-3)' : 'var(--ink)', textDecoration: s.done ? 'line-through' : 'none' }}>
        {s.title}
      </span>
      <PersonDot who={s.added_by || 'shared'} size={7} />
      <button onClick={() => onRemove(s.id)} style={{ background: 'none', border: 'none', cursor: 'pointer',
        padding: '4px', lineHeight: 0, flexShrink: 0 }}>
        <Icon name="close" size={16} color="var(--ink-3)" />
      </button>
    </div>
  )
}
