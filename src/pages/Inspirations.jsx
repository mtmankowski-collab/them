import { useState, useEffect } from 'react'
import Icon from '../components/Icon'
import { Card, ScreenHead, EmptyState, AddBtn, navBtn, Sheet, Field, TextInput, ChipPicker } from '../components/ui'
import { supabase } from '../lib/supabase'

const CATS = [
  { value: 'ula',    label: 'Ula',     color: 'var(--b)' },
  { value: 'maniek', label: 'Maniek',  color: 'var(--a)' },
  { value: 'dzieci', label: 'Dzieci',  color: '#8A6D3B' },
  { value: 'shared', label: 'Wspólne', color: 'var(--shared)' },
]

export default function Inspirations({ onBack }) {
  const [items, setItems] = useState([])
  const [cat, setCat] = useState('ula')
  const [sheetOpen, setSheetOpen] = useState(false)
  const [editItem, setEditItem] = useState(null)
  const [f, setF] = useState({ cat: 'ula', title: '', description: '', url: '' })

  useEffect(() => {
    supabase.from('inspirations').select('*').order('created_at', { ascending: false })
      .then(({ data }) => setItems(data || []))
  }, [])

  function openAdd() {
    setEditItem(null)
    setF({ cat, title: '', description: '', url: '' })
    setSheetOpen(true)
  }

  function openEdit(item) {
    setEditItem(item)
    setF({ cat: item.cat, title: item.title, description: item.description || '', url: item.url || '' })
    setSheetOpen(true)
  }

  function closeSheet() {
    setSheetOpen(false)
    setEditItem(null)
  }

  async function submit() {
    if (!f.title.trim()) return
    if (editItem) {
      const { data } = await supabase.from('inspirations').update({
        cat: f.cat, title: f.title.trim(), description: f.description.trim(), url: f.url.trim(),
      }).eq('id', editItem.id).select().single()
      if (data) setItems(prev => prev.map(i => i.id === editItem.id ? data : i))
    } else {
      const { data } = await supabase.from('inspirations').insert({
        id: Date.now(), cat: f.cat, title: f.title.trim(), description: f.description.trim(), url: f.url.trim(),
      }).select().single()
      if (data) setItems(prev => [data, ...prev])
    }
    closeSheet()
  }

  async function deleteItem() {
    if (!editItem) return
    await supabase.from('inspirations').delete().eq('id', editItem.id)
    setItems(prev => prev.filter(i => i.id !== editItem.id))
    closeSheet()
  }

  const filtered = items.filter(i => i.cat === cat)
  const catObj = CATS.find(c => c.value === cat) || CATS[0]

  return (
    <div className="screen" style={{ position: 'relative' }}>
      <ScreenHead title="Inspiracje" sub="Zakupowe linki i pomysły" onBack={onBack} right={
        <button style={navBtn} onClick={openAdd}><Icon name="plus" size={20} color="var(--ink)" /></button>
      } />

      <div style={{ display: 'flex', gap: 8, marginBottom: 18, flexWrap: 'wrap' }}>
        {CATS.map(c => {
          const active = cat === c.value
          return (
            <button key={c.value} onClick={() => setCat(c.value)} style={{
              borderRadius: 'var(--r-pill)', padding: '8px 16px', font: '500 13px/1 var(--font-sans)',
              cursor: 'pointer', border: '1px solid ' + (active ? c.color : 'var(--line)'),
              background: active ? c.color : 'var(--surface)', color: active ? '#fff' : 'var(--ink-2)',
            }}>{c.label}</button>
          )
        })}
      </div>

      {filtered.length ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {filtered.map(item => (
            <Card key={item.id} pad={14} onClick={() => openEdit(item)} style={{ cursor: 'pointer' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ font: '500 15px/1.2 var(--font-sans)', color: 'var(--ink)', marginBottom: 4 }}>{item.title}</div>
                  {item.description && <div style={{ font: '400 13px/1.4 var(--font-sans)', color: 'var(--ink-2)', marginBottom: 8 }}>{item.description}</div>}
                  {item.url && (() => {
                    let hostname = item.url
                    try { hostname = new URL(item.url).hostname.replace('www.','') } catch {}
                    return (
                      <a href={item.url} target="_blank" rel="noopener noreferrer"
                        onClick={e => e.stopPropagation()}
                        style={{ display: 'inline-flex', alignItems: 'center', gap: 5, font: '500 12.5px/1 var(--font-sans)',
                          color: catObj.color, textDecoration: 'none' }}>
                        <Icon name="external" size={14} color={catObj.color} />
                        {hostname}
                      </a>
                    )
                  })()}
                </div>
                <Icon name="chevron" size={16} color="var(--ink-3)" style={{ flexShrink: 0, marginTop: 2 }} />
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <EmptyState icon="tag" title="Brak inspiracji" sub={`Dodajcie linki do rzeczy dla ${catObj.label}.`}
          action={<AddBtn label="Dodaj link" onClick={openAdd} />} />
      )}

      <Sheet open={sheetOpen} title={editItem ? 'Edytuj inspirację' : 'Nowa inspiracja'}
        onClose={closeSheet} onSubmit={submit}
        submitLabel={editItem ? 'Zapisz zmiany' : 'Zapisz'}
        onDelete={editItem ? deleteItem : undefined}
        accent="var(--a)">
        <Field label="Co to"><TextInput value={f.title} onChange={v => setF(p=>({...p,title:v}))} placeholder="np. Lniana sukienka" /></Field>
        <Field label="Dla kogo"><ChipPicker value={f.cat} onChange={v => setF(p=>({...p,cat:v}))} options={CATS.map(c => ({ value: c.value, label: c.label }))} /></Field>
        <Field label="Opis (opcjonalnie)"><TextInput value={f.description} onChange={v => setF(p=>({...p,description:v}))} placeholder="kolor, rozmiar, na kiedy" /></Field>
        <Field label="Link do sklepu"><TextInput value={f.url} onChange={v => setF(p=>({...p,url:v}))} placeholder="https://…" /></Field>
      </Sheet>
    </div>
  )
}
