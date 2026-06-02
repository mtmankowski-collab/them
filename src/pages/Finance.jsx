import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { IconPlus, IconX } from '@tabler/icons-react'

const CATEGORIES = ['Jedzenie','Dom','Transport','Dzieci','Rozrywka','Zdrowie','Inne']
const CAT_ICONS = { Jedzenie: '🍽️', Dom: '🏠', Transport: '🚗', Dzieci: '👶', Rozrywka: '🎉', Zdrowie: '💊', Inne: '💸' }

const thisMonth = new Date().toISOString().slice(0, 7)

export default function Finance({ user }) {
  const [tab, setTab] = useState('expenses')
  const [expenses, setExpenses] = useState([])
  const [bills, setBills] = useState([])
  const [showModal, setShowModal] = useState(false)
  const [eForm, setEForm] = useState({ title: '', amount: '', category: 'Jedzenie', date: new Date().toISOString().slice(0,10) })
  const [bForm, setBForm] = useState({ title: '', amount: '', due_day: '' })
  const [addingBill, setAddingBill] = useState(false)

  useEffect(() => { loadData() }, [])

  async function loadData() {
    const [eRes, bRes] = await Promise.all([
      supabase.from('expenses').select('*').order('date', { ascending: false }),
      supabase.from('bills').select('*').order('due_day'),
    ])
    if (!eRes.error) setExpenses(eRes.data || [])
    if (!bRes.error) setBills(bRes.data || [])
  }

  async function addExpense() {
    if (!eForm.title || !eForm.amount) return
    await supabase.from('expenses').insert({ ...eForm, amount: parseFloat(eForm.amount), added_by: user.initials })
    setShowModal(false)
    setEForm({ title: '', amount: '', category: 'Jedzenie', date: new Date().toISOString().slice(0,10) })
    loadData()
  }

  async function addBill() {
    if (!bForm.title || !bForm.amount || !bForm.due_day) return
    await supabase.from('bills').insert({ ...bForm, amount: parseFloat(bForm.amount), due_day: parseInt(bForm.due_day), paid_months: [] })
    setAddingBill(false)
    setBForm({ title: '', amount: '', due_day: '' })
    loadData()
  }

  async function toggleBillPaid(bill) {
    const paid = bill.paid_months || []
    const newPaid = paid.includes(thisMonth) ? paid.filter(m => m !== thisMonth) : [...paid, thisMonth]
    await supabase.from('bills').update({ paid_months: newPaid }).eq('id', bill.id)
    loadData()
  }

  const total = expenses.filter(e => e.date?.startsWith(thisMonth)).reduce((s, e) => s + Number(e.amount), 0)

  return (
    <div className="page" style={{ padding: '16px', paddingBottom: 'calc(var(--nav-height) + var(--safe-bottom) + 24px)' }}>
      <div className="pills" style={{ marginBottom: 20 }}>
        <button className={`pill ${tab === 'expenses' ? 'active' : ''}`} onClick={() => setTab('expenses')}>Wydatki</button>
        <button className={`pill ${tab === 'bills' ? 'active' : ''}`} onClick={() => setTab('bills')}>Opłaty stałe</button>
      </div>

      {tab === 'expenses' && (
        <>
          <div className="card" style={{ marginBottom: 16, background: 'var(--accent-m)', border: 'none' }}>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>
              {new Date().toLocaleDateString('pl-PL', { month: 'long', year: 'numeric' })}
            </div>
            <div style={{ fontSize: 34, color: '#fff', fontFamily: "'DM Serif Display', serif" }}>{total.toFixed(2)} zł</div>
          </div>
          {expenses.length === 0 ? (
            <div className="empty-state"><p>Brak wydatków.</p></div>
          ) : (
            expenses.map(e => (
              <div key={e.id} className="card" style={{ marginBottom: 8, display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ fontSize: 24, width: 40, textAlign: 'center' }}>{CAT_ICONS[e.category] || '💸'}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 500, fontSize: 15 }}>{e.title}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{e.category} · {e.date}</div>
                </div>
                <div style={{ fontWeight: 600, fontSize: 16 }}>{Number(e.amount).toFixed(2)} zł</div>
              </div>
            ))
          )}
        </>
      )}

      {tab === 'bills' && (
        <>
          {bills.map(b => {
            const isPaid = b.paid_months?.includes(thisMonth)
            return (
              <div key={b.id} className="card" style={{ marginBottom: 8, display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 500, fontSize: 15 }}>{b.title}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{b.due_day}. dnia miesiąca</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontWeight: 600, fontSize: 16, marginBottom: 4 }}>{Number(b.amount).toFixed(2)} zł</div>
                  <button
                    onClick={() => toggleBillPaid(b)}
                    style={{
                      fontSize: 11, fontWeight: 600, padding: '4px 10px', borderRadius: 20,
                      background: isPaid ? '#7D9B7A22' : 'var(--border)',
                      color: isPaid ? '#7D9B7A' : 'var(--text-secondary)',
                      border: `0.5px solid ${isPaid ? '#7D9B7A' : 'var(--border)'}`,
                    }}
                  >
                    {isPaid ? '✓ Opłacone' : 'Nieopłacone'}
                  </button>
                </div>
              </div>
            )
          })}
          {addingBill ? (
            <div className="card" style={{ marginTop: 8 }}>
              <div className="form-group">
                <label className="form-label">Nazwa</label>
                <input className="form-input" value={bForm.title} onChange={e => setBForm(f => ({ ...f, title: e.target.value }))} placeholder="np. Prąd" />
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                <div className="form-group" style={{ flex: 1 }}>
                  <label className="form-label">Kwota</label>
                  <input className="form-input" type="number" value={bForm.amount} onChange={e => setBForm(f => ({ ...f, amount: e.target.value }))} placeholder="0.00" />
                </div>
                <div className="form-group" style={{ flex: 1 }}>
                  <label className="form-label">Dzień miesiąca</label>
                  <input className="form-input" type="number" min="1" max="31" value={bForm.due_day} onChange={e => setBForm(f => ({ ...f, due_day: e.target.value }))} placeholder="np. 15" />
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button className="btn-primary" onClick={addBill}>Zapisz</button>
                <button onClick={() => setAddingBill(false)} style={{ padding: '14px', color: 'var(--text-secondary)', fontSize: 14 }}>Anuluj</button>
              </div>
            </div>
          ) : (
            <button onClick={() => setAddingBill(true)} style={{ width: '100%', padding: '12px', border: '0.5px dashed var(--border)', borderRadius: 'var(--radius)', color: 'var(--text-secondary)', fontSize: 14, marginTop: 8 }}>
              + Dodaj opłatę stałą
            </button>
          )}
        </>
      )}

      {tab === 'expenses' && (
        <button className="fab" onClick={() => setShowModal(true)}><IconPlus size={24} /></button>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowModal(false)}>
          <div className="modal-sheet">
            <div className="modal-handle" />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h3 className="modal-title" style={{ margin: 0 }}>Nowy wydatek</h3>
              <button onClick={() => setShowModal(false)}><IconX size={20} color="var(--text-secondary)" /></button>
            </div>
            <div className="form-group">
              <label className="form-label">Tytuł</label>
              <input className="form-input" value={eForm.title} onChange={e => setEForm(f => ({ ...f, title: e.target.value }))} placeholder="Za co?" />
            </div>
            <div className="form-group">
              <label className="form-label">Kwota (zł)</label>
              <input className="form-input" type="number" value={eForm.amount} onChange={e => setEForm(f => ({ ...f, amount: e.target.value }))} placeholder="0.00" />
            </div>
            <div className="form-group">
              <label className="form-label">Kategoria</label>
              <select className="form-input" value={eForm.category} onChange={e => setEForm(f => ({ ...f, category: e.target.value }))}>
                {CATEGORIES.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Data</label>
              <input className="form-input" type="date" value={eForm.date} onChange={e => setEForm(f => ({ ...f, date: e.target.value }))} />
            </div>
            <button className="btn-primary" onClick={addExpense}>Zapisz wydatek</button>
          </div>
        </div>
      )}
    </div>
  )
}
