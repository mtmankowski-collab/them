import { useState, useEffect } from 'react'
import Icon from '../components/Icon'
import { PersonDot, Card, Segmented, ScreenHead, EmptyState, AddBtn, StarRate, Sheet, Field, TextInput, ChipPicker, PersonPicker, navBtn } from '../components/ui'
import { supabase } from '../lib/supabase'

const SERIF = "'Bodoni Moda', Georgia, serif"
const PLATFORMS = ['Netflix','HBO Max','Disney+','Prime','Skyshowtime','Apple TV','Inne']

export default function Films() {
  const [tab, setTab] = useState('toWatch')
  const [films, setFilms] = useState([])
  const [addOpen, setAddOpen] = useState(false)
  const [editItem, setEditItem] = useState(null)
  const [f, setF] = useState({ title: '', type: 'film', platform: 'Netflix', added_by: 'a' })
  const [insertError, setInsertError] = useState('')

  useEffect(() => {
    supabase.from('movies').select('*').order('created_at', { ascending: false }).then(({ data }) => setFilms(data || []))
  }, [])

  const list = films.filter(m => tab === 'toWatch' ? m.status === 'to_watch' : m.status === 'watched')

  async function markWatched(film) {
    await supabase.from('movies').update({ status: 'watched', rating: 0 }).eq('id', film.id)
    setFilms(prev => prev.map(m => m.id === film.id ? { ...m, status: 'watched', rating: 0 } : m))
    setTab('watched')
  }

  async function rate(id, val) {
    await supabase.from('movies').update({ rating: val }).eq('id', id)
    setFilms(prev => prev.map(m => m.id === id ? { ...m, rating: val } : m))
  }

  function openAdd() {
    setEditItem(null)
    setF({ title: '', type: 'film', platform: 'Netflix', added_by: 'a' })
    setAddOpen(true)
  }

  function openEdit(m) {
    setEditItem(m)
    setF({ title: m.title, type: m.type || 'film', platform: m.platform || 'Netflix', added_by: m.added_by || 'a' })
    setAddOpen(true)
  }

  async function submit() {
    if (!f.title.trim()) return
    setInsertError('')
    if (editItem) {
      const { error } = await supabase.from('movies').update({ title: f.title.trim(), type: f.type, platform: f.platform, added_by: f.added_by }).eq('id', editItem.id)
      if (error) { setInsertError(error.message); return }
      setFilms(prev => prev.map(m => m.id === editItem.id ? { ...m, title: f.title.trim(), type: f.type, platform: f.platform, added_by: f.added_by } : m))
    } else {
      const { data, error } = await supabase.from('movies').insert({
        title: f.title.trim(), type: f.type, platform: f.platform, added_by: f.added_by,
        status: 'to_watch',
      }).select().single()
      if (error) { setInsertError(error.message); return }
      if (data) { setFilms(prev => [data, ...prev]); setTab('toWatch') }
    }
    setAddOpen(false)
    setEditItem(null)
  }

  async function deleteFilm() {
    if (!editItem) return
    await supabase.from('movies').delete().eq('id', editItem.id)
    setFilms(prev => prev.filter(m => m.id !== editItem.id))
    setAddOpen(false)
    setEditItem(null)
  }

  return (
    <div className="screen" style={{ position: 'relative' }}>
      <ScreenHead sub="Wspólna lista" title="Filmy i seriale" right={
        <button style={navBtn} onClick={openAdd}>
          <Icon name="plus" size={20} color="var(--ink)" />
        </button>
      } />

      <div style={{ marginBottom: 18 }}>
        <Segmented value={tab} onChange={setTab} options={[
          { value:'toWatch', label:'Do obejrzenia' }, { value:'watched', label:'Obejrzane' }
        ]} />
      </div>

      {list.length ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
          {list.map(m => (
            <Card key={m.id} pad={14} onClick={() => openEdit(m)} style={{ cursor: 'pointer' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 7 }}>
                    <span style={{ font: `500 16px/1.15 ${SERIF}`, color: 'var(--ink)' }}>{m.title}</span>
                    <TypeBadge type={m.type} />
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                    <PersonDot who={m.added_by || 'shared'} size={6} />
                    <span style={{ font: '400 12.5px/1 var(--font-sans)', color: 'var(--ink-2)', whiteSpace: 'nowrap' }}>
                      {m.platform}
                    </span>
                  </div>
                </div>
                {tab === 'watched' ? (
                  <StarRate value={m.rating || 0} onChange={v => { rate(m.id, v) }} size={19} />
                ) : (
                  <button onClick={e => { e.stopPropagation(); markWatched(m) }} style={{ display: 'flex', alignItems: 'center', gap: 6,
                    background: 'var(--cream-warm)', border: '1px solid var(--line)', cursor: 'pointer',
                    borderRadius: 'var(--r-pill)', padding: '9px 14px', font: '500 12.5px/1 var(--font-sans)', color: 'var(--ink-3)', flexShrink: 0 }}>
                    <Icon name="check" size={15} color="var(--ink-3)" stroke={2} />Obejrzane
                  </button>
                )}
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <EmptyState icon="film"
          title={tab === 'toWatch' ? 'Lista pusta' : 'Nic jeszcze obejrzane'}
          sub={tab === 'toWatch' ? 'Dodajcie film lub serial, który chcecie razem obejrzeć.' : 'Obejrzane tytuły pojawią się tutaj z oceną.'}
          action={tab === 'toWatch' ? <AddBtn label="Dodaj tytuł" onClick={openAdd} /> : null} />
      )}

      <Sheet open={addOpen} title={editItem ? 'Edytuj tytuł' : 'Dodaj do obejrzenia'}
        onClose={() => { setAddOpen(false); setEditItem(null); setInsertError('') }}
        onSubmit={submit} submitLabel={editItem ? 'Zapisz zmiany' : 'Dodaj tytuł'}
        onDelete={editItem ? deleteFilm : undefined}
        accent="var(--a)">
        {insertError && <div style={{ font: '400 12.5px/1.4 var(--font-sans)', color: '#B6543F', padding: '8px 12px',
          background: 'rgba(182,84,63,.08)', borderRadius: 8, border: '1px solid rgba(182,84,63,.2)' }}>{insertError}</div>}
        <Field label="Tytuł"><TextInput value={f.title} onChange={v => setF(p=>({...p,title:v}))} placeholder="np. Dune: Part Two" /></Field>
        <Field label="Typ"><ChipPicker value={f.type} onChange={v => setF(p=>({...p,type:v}))} options={[{value:'film',label:'Film'},{value:'serial',label:'Serial'}]} /></Field>
        <Field label="Platforma"><ChipPicker value={f.platform} onChange={v => setF(p=>({...p,platform:v}))} options={PLATFORMS} /></Field>
        <Field label="Kto dodaje"><PersonPicker value={f.added_by} onChange={v => setF(p=>({...p,added_by:v}))} /></Field>
      </Sheet>
    </div>
  )
}

function TypeBadge({ type }) {
  return (
    <span style={{ font: '500 10.5px/1 var(--font-sans)', letterSpacing: '.06em', textTransform: 'uppercase',
      color: 'var(--ink-2)', background: 'var(--cream-warm)', border: '1px solid var(--line)',
      borderRadius: 'var(--r-pill)', padding: '4px 9px', whiteSpace: 'nowrap' }}>
      {type === 'film' ? 'Film' : 'Serial'}
    </span>
  )
}
