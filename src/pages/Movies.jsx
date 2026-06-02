import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { IconPlus, IconX, IconStar, IconStarFilled } from '@tabler/icons-react'

const PLATFORMS = ['Netflix','Max','Apple TV+','Disney+','HBO','Inne']
const PLATFORM_COLORS = { Netflix: '#E50914', Max: '#002BE7', 'Apple TV+': '#000', 'Disney+': '#113CCF', HBO: '#5822b4', Inne: '#666' }

function Stars({ value, onChange }) {
  return (
    <div className="stars">
      {[1,2,3,4,5].map(i => (
        <button key={i} onClick={() => onChange && onChange(i)} style={{ background: 'none', border: 'none', padding: 0 }}>
          {i <= value
            ? <IconStarFilled size={18} style={{ color: '#F5A623' }} />
            : <IconStar size={18} style={{ color: 'var(--border)' }} />}
        </button>
      ))}
    </div>
  )
}

export default function Movies({ user }) {
  const [filter, setFilter] = useState('all')
  const [movies, setMovies] = useState([])
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState({ title: '', type: 'film', platform: 'Netflix' })

  useEffect(() => { loadMovies() }, [])

  async function loadMovies() {
    const { data, error } = await supabase.from('movies').select('*').order('created_at', { ascending: false })
    if (!error) setMovies(data || [])
  }

  async function addMovie() {
    if (!form.title) return
    await supabase.from('movies').insert({ ...form, status: 'to_watch', added_by: user.initials })
    setShowModal(false)
    setForm({ title: '', type: 'film', platform: 'Netflix' })
    loadMovies()
  }

  async function markWatched(movie) {
    await supabase.from('movies').update({ status: 'watched' }).eq('id', movie.id)
    loadMovies()
  }

  async function setRating(movie, rating) {
    await supabase.from('movies').update({ rating }).eq('id', movie.id)
    loadMovies()
  }

  const filtered = movies.filter(m => filter === 'all' ? true : filter === 'to_watch' ? m.status === 'to_watch' : m.status === 'watched')
  const toWatch = filtered.filter(m => m.status === 'to_watch')
  const watched = filtered.filter(m => m.status === 'watched')

  function MovieCard({ m }) {
    return (
      <div className="card" style={{ marginBottom: 8, display: 'flex', gap: 12, alignItems: 'flex-start' }}>
        <div style={{ width: 6, borderRadius: 3, background: PLATFORM_COLORS[m.platform] || '#666', alignSelf: 'stretch', minHeight: 48 }} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 500, fontSize: 15 }}>{m.title}</div>
          <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>
            {m.platform} · {m.type === 'film' ? 'Film' : 'Serial'}
          </div>
          {m.status === 'watched' && (
            <div style={{ marginTop: 6 }}>
              <Stars value={m.rating || 0} onChange={val => setRating(m, val)} />
            </div>
          )}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
          <div style={{ width: 24, height: 24, borderRadius: '50%', background: m.added_by === 'M' ? '#C4703A' : '#378ADD', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: '#fff' }}>
            {m.added_by}
          </div>
          {m.status === 'to_watch' && (
            <button
              onClick={() => markWatched(m)}
              style={{ fontSize: 11, fontWeight: 600, padding: '4px 8px', borderRadius: 12, background: 'var(--border)', color: 'var(--text-secondary)', border: 'none' }}
            >
              Obejrzane
            </button>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="page" style={{ padding: '16px', paddingBottom: 'calc(var(--nav-height) + var(--safe-bottom) + 24px)' }}>
      <div className="pills" style={{ marginBottom: 20 }}>
        <button className={`pill ${filter === 'all' ? 'active' : ''}`} onClick={() => setFilter('all')}>Wszystkie</button>
        <button className={`pill ${filter === 'to_watch' ? 'active' : ''}`} onClick={() => setFilter('to_watch')}>Do obejrzenia</button>
        <button className={`pill ${filter === 'watched' ? 'active' : ''}`} onClick={() => setFilter('watched')}>Obejrzane</button>
      </div>

      {toWatch.length > 0 && (
        <>
          <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 10 }}>
            Do obejrzenia · {toWatch.length}
          </div>
          {toWatch.map(m => <MovieCard key={m.id} m={m} />)}
        </>
      )}

      {watched.length > 0 && (
        <>
          <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)', letterSpacing: '0.08em', textTransform: 'uppercase', margin: '16px 0 10px' }}>
            Obejrzane · {watched.length}
          </div>
          {watched.map(m => <MovieCard key={m.id} m={m} />)}
        </>
      )}

      {filtered.length === 0 && (
        <div className="empty-state"><p>Brak filmów. Dodaj pierwszy!</p></div>
      )}

      <button className="fab" onClick={() => setShowModal(true)}><IconPlus size={24} /></button>

      {showModal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowModal(false)}>
          <div className="modal-sheet">
            <div className="modal-handle" />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h3 className="modal-title" style={{ margin: 0 }}>Dodaj film / serial</h3>
              <button onClick={() => setShowModal(false)}><IconX size={20} color="var(--text-secondary)" /></button>
            </div>
            <div className="form-group">
              <label className="form-label">Tytuł</label>
              <input className="form-input" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Tytuł..." />
            </div>
            <div className="form-group">
              <label className="form-label">Typ</label>
              <select className="form-input" value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}>
                <option value="film">Film</option>
                <option value="serial">Serial</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Platforma</label>
              <select className="form-input" value={form.platform} onChange={e => setForm(f => ({ ...f, platform: e.target.value }))}>
                {PLATFORMS.map(p => <option key={p}>{p}</option>)}
              </select>
            </div>
            <button className="btn-primary" onClick={addMovie}>Dodaj</button>
          </div>
        </div>
      )}
    </div>
  )
}
