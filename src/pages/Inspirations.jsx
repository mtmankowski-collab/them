import { useState, useEffect } from 'react'
import Icon from '../components/Icon'
import { Card, ScreenHead, SectionTitle, EmptyState, AddBtn, navBtn, Sheet, Field, TextInput, ChipPicker } from '../components/ui'

const LS_KEY = 'them_inspirations'
const CATS = [
  { value: 'ula',    label: 'Ula',     color: 'var(--b)' },
  { value: 'maniek', label: 'Maniek',  color: 'var(--a)' },
  { value: 'dzieci', label: 'Dzieci',  color: '#8A6D3B' },
  { value: 'shared', label: 'Wspólne', color: 'var(--shared)' },
]

export default function Inspirations({ onBack }) {
  const [items, setItems] = useState([])
  const [cat, setCat] = useState('ula')
  const [addOpen, setAddOpen] = useState(false)
  const [f, setF] = useState({ cat: 'ula', title: '', desc: '', url: '' })

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(LS_KEY))
      setItems(saved || [])
    } catch {
      setItems([])
    }
  }, [])

  function save(updated) {
    setItems(updated)
    localStorage.setItem(LS_KEY, JSON.stringify(updated))
  }

  function addItem() {
    if (!f.title.trim()) return
    save([...items, { id: Date.now(), cat: f.cat, title: f.title.trim(), desc: f.desc.trim(), url: f.url.trim() }])
    setAddOpen(false)
    setF({ cat: 'ula', title: '', desc: '', url: '' })
  }

  function removeItem(id) {
    save(items.filter(i => i.id !== id))
  }

  const filtered = items.filter(i => i.cat === cat)
  const catObj = CATS.find(c => c.value === cat) || CATS[0]

  return (
    <div className="screen" style={{ position: 'relative' }}>
      <ScreenHead title="Inspiracje" sub="Zakupowe linki i pomysły" onBack={onBack} right={
        <button style={navBtn} onClick={() => setAddOpen(true)}><Icon name="plus" size={20} color="var(--ink)" /></button>
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
            <Card key={item.id} pad={14}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ font: '500 15px/1.2 var(--font-sans)', color: 'var(--ink)', marginBottom: 4 }}>{item.title}</div>
                  {item.desc && <div style={{ font: '400 13px/1.4 var(--font-sans)', color: 'var(--ink-2)', marginBottom: 8 }}>{item.desc}</div>}
                  {item.url && (() => {
                    let hostname = item.url
                    try { hostname = new URL(item.url).hostname.replace('www.','') } catch {}
                    return (
                      <a href={item.url} target="_blank" rel="noopener noreferrer"
                        style={{ display: 'inline-flex', alignItems: 'center', gap: 5, font: '500 12.5px/1 var(--font-sans)',
                          color: catObj.color, textDecoration: 'none' }}>
                        <Icon name="external" size={14} color={catObj.color} />
                        {hostname}
                      </a>
                    )
                  })()}
                </div>
                <button onClick={() => removeItem(item.id)} style={{ background: 'none', border: 'none', cursor: 'pointer',
                  padding: 4, lineHeight: 0, flexShrink: 0 }}>
                  <Icon name="close" size={16} color="var(--ink-3)" />
                </button>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <EmptyState icon="tag" title="Brak inspiracji" sub={`Dodajcie linki do rzeczy dla ${catObj.label}.`}
          action={<AddBtn label="Dodaj link" onClick={() => setAddOpen(true)} />} />
      )}

      <Sheet open={addOpen} title="Nowa inspiracja" onClose={() => setAddOpen(false)} onSubmit={addItem} submitLabel="Zapisz" accent="var(--a)">
        <Field label="Co to"><TextInput value={f.title} onChange={v => setF(p=>({...p,title:v}))} placeholder="np. Lniana sukienka" /></Field>
        <Field label="Dla kogo"><ChipPicker value={f.cat} onChange={v => setF(p=>({...p,cat:v}))} options={CATS.map(c => ({ value: c.value, label: c.label }))} /></Field>
        <Field label="Opis (opcjonalnie)"><TextInput value={f.desc} onChange={v => setF(p=>({...p,desc:v}))} placeholder="kolor, rozmiar, na kiedy" /></Field>
        <Field label="Link do sklepu"><TextInput value={f.url} onChange={v => setF(p=>({...p,url:v}))} placeholder="https://…" /></Field>
      </Sheet>
    </div>
  )
}
