import { useState, useEffect } from 'react'
import Icon from '../components/Icon'
import { Card, ScreenHead, SectionTitle, EmptyState, AddBtn, navBtn, Sheet, Field, TextInput, ChipPicker } from '../components/ui'
import { supabase } from '../lib/supabase'

const GROUP_ICON = { 'Hasła': 'key', 'Kontakty': 'phone', 'Ważne': 'doc' }

export default function Knowledge({ onBack }) {
  const [items, setItems] = useState([])
  const [q, setQ] = useState('')
  const [addOpen, setAddOpen] = useState(false)
  const [editItem, setEditItem] = useState(null)
  const [f, setF] = useState({ category: 'Hasła', title: '', content: '' })

  useEffect(() => {
    supabase.from('knowledge').select('*').order('category').then(({ data }) => setItems(data || []))
  }, [])

  const filtered = q.trim()
    ? items.filter(k => (k.title + ' ' + k.content + ' ' + k.category).toLowerCase().includes(q.toLowerCase()))
    : items

  const groups = [...new Set(filtered.map(k => k.category))]

  function openEdit(item) {
    setEditItem(item)
    setF({ category: item.category, title: item.title, content: item.content || '' })
    setAddOpen(true)
  }

  function openAdd() {
    setEditItem(null)
    setF({ category: 'Hasła', title: '', content: '' })
    setAddOpen(true)
  }

  async function submit() {
    if (!f.title.trim()) return
    if (editItem) {
      await supabase.from('knowledge').update({ category: f.category, title: f.title.trim(), content: f.content }).eq('id', editItem.id)
      setItems(prev => prev.map(k => k.id === editItem.id ? { ...k, ...f, title: f.title.trim() } : k))
    } else {
      const { data } = await supabase.from('knowledge').insert({ category: f.category, title: f.title.trim(), content: f.content }).select().single()
      if (data) setItems(prev => [...prev, data])
    }
    setAddOpen(false)
    setEditItem(null)
  }

  return (
    <div className="screen" style={{ position: 'relative' }}>
      <ScreenHead title="Baza wiedzy" sub="Hasła · kontakty · info" onBack={onBack} right={
        <button style={navBtn} onClick={openAdd}><Icon name="plus" size={20} color="var(--ink)" /></button>
      } />

      <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'var(--surface)', border: '1px solid var(--line)',
        borderRadius: 'var(--r-pill)', padding: '11px 16px', marginBottom: 18, boxShadow: 'var(--sh-1)' }}>
        <Icon name="search" size={18} color="var(--ink-3)" />
        <input value={q} onChange={e => setQ(e.target.value)} placeholder="Szukaj hasła, kontaktu, info…"
          style={{ flex: 1, border: 'none', background: 'transparent', outline: 'none', font: '400 14px/1 var(--font-sans)', color: 'var(--ink)', minWidth: 0 }} />
        {q && <button onClick={() => setQ('')} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, lineHeight: 0 }}>
          <Icon name="close" size={16} color="var(--ink-3)" />
        </button>}
      </div>

      {groups.map(g => (
        <div key={g} style={{ marginBottom: 18 }}>
          <SectionTitle title={g} />
          <Card pad={0}>
            {filtered.filter(k => k.category === g).map((k, i) => (
              <div key={k.id} onClick={() => openEdit(k)}
                style={{ display: 'flex', alignItems: 'center', gap: 13, padding: '13px 15px',
                  borderTop: i ? '1px solid var(--line)' : 'none', cursor: 'pointer' }}>
                <div style={{ width: 38, height: 38, borderRadius: 12, background: 'var(--cream-warm)', border: '1px solid var(--line)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Icon name={GROUP_ICON[k.category] || 'doc'} size={19} color="var(--ink-2)" />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ font: '500 14.5px/1.1 var(--font-sans)', color: 'var(--ink)' }}>{k.title}</div>
                  <div style={{ font: '400 12.5px/1 var(--font-sans)', color: 'var(--ink-2)', marginTop: 4 }}>{k.content}</div>
                </div>
                <Icon name="edit" size={17} color="var(--ink-3)" />
              </div>
            ))}
          </Card>
        </div>
      ))}

      {!filtered.length && <EmptyState icon="search" title="Brak wyników"
        sub={q ? `Nic nie pasuje do „${q}".` : 'Dodajcie pierwsze hasło lub kontakt.'}
        action={<AddBtn label="Dodaj wpis" onClick={openAdd} />} />}

      <Sheet open={addOpen} title={editItem ? 'Edytuj wpis' : 'Nowy wpis'}
        onClose={() => { setAddOpen(false); setEditItem(null) }}
        onSubmit={submit} submitLabel="Zapisz" accent="var(--b-deep)">
        <Field label="Kategoria"><ChipPicker value={f.category} onChange={v => setF(p=>({...p,category:v}))} options={['Hasła','Kontakty','Ważne']} /></Field>
        <Field label="Nazwa"><TextInput value={f.title} onChange={v => setF(p=>({...p,title:v}))} placeholder="np. Wi-Fi domowe" /></Field>
        <Field label="Treść / wartość"><TextInput value={f.content} onChange={v => setF(p=>({...p,content:v}))} placeholder="np. hasło, numer, adres" /></Field>
      </Sheet>
    </div>
  )
}
