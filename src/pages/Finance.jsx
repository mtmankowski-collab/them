import { useState, useEffect } from 'react'
import Icon from '../components/Icon'
import { Avatar, PersonDot, Label, Card, Segmented, ScreenHead, SectionTitle, Sheet, Field, TextInput, ChipPicker, PersonPicker, navBtn } from '../components/ui'
import { supabase } from '../lib/supabase'

const SERIF = "'Bodoni Moda', Georgia, serif"
const CATS = ['Jedzenie','Dom','Restauracje','Samochody','Dzieci','Ubrania','Rozrywka','Podróże','Streamingi','Inne']
const CAT_COLORS = {
  Jedzenie:'var(--a)', Dom:'var(--a-soft-2)', Restauracje:'var(--a-deep)',
  Samochody:'var(--b)', Dzieci:'var(--ink)', Ubrania:'#b08080',
  Rozrywka:'var(--ink-2)', Podróże:'var(--b-deep)', Streamingi:'#7b68ee', Inne:'var(--ink-3)'
}
const CAT_ICON = {
  Jedzenie:'cart', Dom:'home', Restauracje:'cup', Samochody:'car',
  Dzieci:'toy', Ubrania:'tag', Rozrywka:'sparkle', Podróże:'plane',
  Streamingi:'tv', Inne:'receipt'
}
// Map old category names to new ones for display
const CAT_MERGE = {
  'Jedzenie i dom': 'Jedzenie', Jedzenie: 'Jedzenie',
  Auto: 'Samochody', Gaba: 'Dzieci', Kuba: 'Dzieci'
}

const MIN_MONTH = '2026-06'
function monthKey(date) { return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}` }
function monthLabel(key) {
  const [y, m] = key.split('-')
  return new Date(parseInt(y), parseInt(m)-1, 1).toLocaleString('pl', { month: 'long', year: 'numeric' })
}
function addMonths(key, n) {
  const [y, m] = key.split('-').map(Number)
  return monthKey(new Date(y, m - 1 + n, 1))
}
function monthRange(key) {
  const [y, m] = key.split('-').map(Number)
  const last = new Date(y, m, 0).getDate()
  return { from: `${key}-01`, to: `${key}-${String(last).padStart(2,'0')}` }
}

export default function Finance() {
  const now = new Date()
  const curMonth = monthKey(now)

  const [mode, setMode] = useState('expenses')
  const [expenses, setExpenses] = useState([])
  const [bills, setBills] = useState([])
  const [addOpen, setAddOpen] = useState(false)
  const [editItem, setEditItem] = useState(null)
  const [f, setF] = useState({})
  const [expMonth, setExpMonth] = useState(curMonth)

  useEffect(() => {
    supabase.from('bills').select('*').order('title').then(({ data }) => setBills(data || []))
  }, [])

  useEffect(() => {
    const { from, to } = monthRange(expMonth)
    supabase.from('expenses').select('*').gte('date', from).lte('date', to)
      .order('created_at', { ascending: false }).then(({ data }) => setExpenses(data || []))
  }, [expMonth])

  function openAdd() {
    setEditItem(null)
    setF(mode === 'expenses'
      ? { title: '', amount: '', category: 'Jedzenie', added_by: 'a' }
      : { title: '', amount: '', category: 'Inne' })
    setAddOpen(true)
  }

  function openEditExpense(e) {
    setEditItem({ ...e, _type: 'expense' })
    setF({ title: e.title, amount: String(e.amount || ''), category: CAT_MERGE[e.category] || e.category || 'Inne', added_by: e.added_by || 'a' })
    setAddOpen(true)
  }

  function openEditBill(b) {
    setEditItem({ ...b, _type: 'bill' })
    setF({ title: b.title, amount: String(b.amount || ''), category: b.category || 'Inne' })
    setAddOpen(true)
  }

  async function submit() {
    if (!f.title?.trim()) return
    if (editItem?._type === 'expense') {
      await supabase.from('expenses').update({ title: f.title.trim(), amount: parseFloat(f.amount) || 0, category: f.category, added_by: f.added_by }).eq('id', editItem.id)
      setExpenses(prev => prev.map(e => e.id === editItem.id ? { ...e, title: f.title.trim(), amount: parseFloat(f.amount) || 0, category: f.category, added_by: f.added_by } : e))
    } else if (editItem?._type === 'bill') {
      await supabase.from('bills').update({ title: f.title.trim(), amount: parseFloat(f.amount) || 0, category: f.category }).eq('id', editItem.id)
      setBills(prev => prev.map(b => b.id === editItem.id ? { ...b, title: f.title.trim(), amount: parseFloat(f.amount) || 0, category: f.category } : b))
    } else if (mode === 'expenses') {
      const { data } = await supabase.from('expenses').insert({
        title: f.title.trim(), amount: parseFloat(f.amount) || 0,
        category: f.category, added_by: f.added_by,
        date: now.toISOString().split('T')[0],
      }).select().single()
      if (data && expMonth === curMonth) setExpenses(prev => [data, ...prev])
    } else {
      const { data } = await supabase.from('bills').insert({
        title: f.title.trim(), amount: parseFloat(f.amount) || 0,
        category: f.category, paid_months: [],
      }).select().single()
      if (data) setBills(prev => [...prev, data].sort((a,b) => a.title.localeCompare(b.title)))
    }
    setAddOpen(false)
    setEditItem(null)
  }

  async function deleteItem() {
    if (!editItem) return
    if (editItem._type === 'expense') {
      await supabase.from('expenses').delete().eq('id', editItem.id)
      setExpenses(prev => prev.filter(e => e.id !== editItem.id))
    } else {
      await supabase.from('bills').delete().eq('id', editItem.id)
      setBills(prev => prev.filter(b => b.id !== editItem.id))
    }
    setAddOpen(false)
    setEditItem(null)
  }

  async function toggleBillPaid(bill) {
    const paid = bill.paid_months || []
    const newPaid = paid.includes(curMonth) ? paid.filter(m => m !== curMonth) : [...paid, curMonth]
    await supabase.from('bills').update({ paid_months: newPaid }).eq('id', bill.id)
    setBills(prev => prev.map(b => b.id === bill.id ? { ...b, paid_months: newPaid } : b))
  }

  const billsWithPaid = bills.map(b => ({ ...b, paid: (b.paid_months || []).includes(curMonth) }))
  const paidAmt = billsWithPaid.filter(b => b.paid).reduce((s,b) => s + b.amount, 0)
  const dueAmt = billsWithPaid.filter(b => !b.paid).reduce((s,b) => s + b.amount, 0)
  const sortedBills = [...billsWithPaid].sort((a,b) => a.paid - b.paid || (a.title||'').localeCompare(b.title||''))

  const totalExpenses = expenses.reduce((s,e) => s + (e.amount || 0), 0)
  const totalBills = bills.reduce((s,b) => s + (b.amount || 0), 0)
  const grandTotal = totalExpenses + totalBills

  const spentA = expenses.filter(e => e.added_by === 'a').reduce((s,e) => s + e.amount, 0)
  const spentB = expenses.filter(e => e.added_by === 'b').reduce((s,e) => s + e.amount, 0)
  const splitTotal = spentA + spentB || 1

  // Category amounts: expenses + bills combined
  const catAmounts = {}
  expenses.forEach(e => {
    const cat = CAT_MERGE[e.category] || e.category || 'Inne'
    catAmounts[cat] = (catAmounts[cat] || 0) + e.amount
  })
  bills.forEach(b => {
    const cat = CAT_MERGE[b.category] || b.category || 'Inne'
    catAmounts[cat] = (catAmounts[cat] || 0) + (b.amount || 0)
  })

  const isEditingExpense = editItem?._type === 'expense'
  const isEditingBill = editItem?._type === 'bill'
  const isCurrentMonth = expMonth === curMonth

  return (
    <div className="screen" style={{ position: 'relative' }}>
      <ScreenHead sub={monthLabel(expMonth)} title="Finanse" right={
        <button style={navBtn} onClick={openAdd}><Icon name="plus" size={20} color="var(--ink)" /></button>
      } />

      {/* Month navigation */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14, gap: 8 }}>
        <button onClick={() => setExpMonth(prev => addMonths(prev, -1))} disabled={expMonth <= MIN_MONTH}
          style={{ display: 'flex', alignItems: 'center', gap: 5,
            background: expMonth <= MIN_MONTH ? 'transparent' : 'var(--surface)', border: '1px solid var(--line)', borderRadius: 'var(--r-pill)', padding: '7px 13px',
            font: '500 12px/1 var(--font-sans)', color: expMonth <= MIN_MONTH ? 'var(--ink-3)' : 'var(--ink-2)',
            cursor: expMonth <= MIN_MONTH ? 'default' : 'pointer', opacity: expMonth <= MIN_MONTH ? 0.4 : 1 }}>
          <Icon name="back" size={14} color="var(--ink-3)" />Poprzedni
        </button>
        <span style={{ font: '500 13px/1 var(--font-sans)', color: isCurrentMonth ? 'var(--a)' : 'var(--ink-2)', whiteSpace: 'nowrap' }}>
          {isCurrentMonth ? 'Ten miesiąc' : monthLabel(expMonth).split(' ')[0]}
        </span>
        <button onClick={() => setExpMonth(prev => addMonths(prev, 1))} disabled={isCurrentMonth}
          style={{ display: 'flex', alignItems: 'center', gap: 5,
            background: isCurrentMonth ? 'transparent' : 'var(--surface)', border: '1px solid var(--line)', borderRadius: 'var(--r-pill)', padding: '7px 13px',
            font: '500 12px/1 var(--font-sans)', color: isCurrentMonth ? 'var(--ink-3)' : 'var(--ink-2)', cursor: isCurrentMonth ? 'default' : 'pointer',
            opacity: isCurrentMonth ? 0.4 : 1 }}>
          Następny<Icon name="chevron" size={14} color="var(--ink-3)" />
        </button>
      </div>

      {/* Summary card */}
      <Card style={{ marginBottom: 12 }}>
        <Label style={{ marginBottom: 8 }}>Wydano {isCurrentMonth ? 'w tym miesiącu' : monthLabel(expMonth).split(' ').slice(0,2).join(' ')}</Label>
        <div style={{ font: `400 36px/1 ${SERIF}`, color: 'var(--ink)', marginBottom: 14 }}>
          {grandTotal.toLocaleString('pl', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} <span style={{ fontSize: 18, color: 'var(--ink-2)' }}>zł</span>
        </div>
        <div style={{ display: 'flex', gap: 0, marginBottom: grandTotal > 0 ? 16 : 0 }}>
          <div style={{ flex: 1 }}>
            <Label style={{ marginBottom: 5 }}>Bieżące</Label>
            <div style={{ font: '500 15px/1 var(--font-sans)', color: 'var(--ink)' }}>{totalExpenses.toLocaleString('pl', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} zł</div>
          </div>
          <div style={{ width: 1, background: 'var(--line)', margin: '0 16px' }} />
          <div style={{ flex: 1 }}>
            <Label style={{ marginBottom: 5 }}>Stałe opłaty</Label>
            <div style={{ font: '500 15px/1 var(--font-sans)', color: 'var(--ink)' }}>{totalBills.toLocaleString('pl', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} zł</div>
          </div>
        </div>
        {grandTotal > 0 && <>
          <div style={{ height: 10, borderRadius: 5, overflow: 'hidden', display: 'flex', marginBottom: 14 }}>
            {CATS.map(c => catAmounts[c] ? (
              <div key={c} style={{ width: (catAmounts[c] / grandTotal * 100) + '%', background: CAT_COLORS[c] }} />
            ) : null)}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
            {CATS.filter(c => catAmounts[c]).map(c => (
              <div key={c} style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                <span style={{ width: 9, height: 9, borderRadius: 3, background: CAT_COLORS[c], flexShrink: 0 }} />
                <span style={{ flex: 1, font: '400 13.5px/1 var(--font-sans)', color: 'var(--ink-2)' }}>{c}</span>
                <span style={{ font: '500 13.5px/1 var(--font-sans)', color: 'var(--ink)' }}>{catAmounts[c].toFixed(2).replace('.',',')} zł</span>
              </div>
            ))}
          </div>
        </>}
      </Card>

      <Card style={{ marginBottom: 16, display: 'flex', gap: 0 }}>
        <SplitHalf who="a" name="Maniek" amount={spentA} pct={Math.round(spentA/splitTotal*100) + '%'} />
        <div style={{ width: 1, background: 'var(--line)', margin: '2px 0' }} />
        <SplitHalf who="b" name="Ula" amount={spentB} pct={Math.round(spentB/splitTotal*100) + '%'} />
      </Card>

      {/* Tab switcher for lists */}
      <div style={{ marginBottom: 14 }}>
        <Segmented value={mode} onChange={setMode} options={[
          { value:'expenses', label:'Wydatki' }, { value:'bills', label:'Stałe opłaty' }
        ]} />
      </div>

      {mode === 'expenses' ? (
        <>
          {expenses.length ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {expenses.map(e => {
                const cat = CAT_MERGE[e.category] || e.category || 'Inne'
                return (
                  <Card key={e.id} pad={13} onClick={() => openEditExpense(e)} style={{ cursor: 'pointer' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{ width: 40, height: 40, borderRadius: 13, background: 'var(--cream-warm)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, border: '1px solid var(--line)' }}>
                        <Icon name={CAT_ICON[cat] || 'receipt'} size={20} color="var(--ink-2)" />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ font: '500 14.5px/1.1 var(--font-sans)', color: 'var(--ink)' }}>{e.title}</div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
                          <PersonDot who={e.added_by || 'shared'} size={6} />
                          <span style={{ font: '400 12px/1 var(--font-sans)', color: 'var(--ink-3)' }}>{cat} · {fmtDate(e.date)}</span>
                        </div>
                      </div>
                      <div style={{ font: '500 15px/1 var(--font-sans)', color: 'var(--ink)', whiteSpace: 'nowrap' }}>
                        {e.amount?.toFixed(2).replace('.',',')} zł
                      </div>
                    </div>
                  </Card>
                )
              })}
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '32px 0', font: '400 13.5px/1 var(--font-sans)', color: 'var(--ink-3)' }}>
              Brak wydatków w tym okresie
            </div>
          )}
        </>
      ) : (
        <>
          <Card style={{ marginBottom: 14 }}>
            <div style={{ display: 'flex', gap: 0 }}>
              <div style={{ flex: 1 }}>
                <Label style={{ marginBottom: 6 }}>Do zapłaty</Label>
                <div style={{ font: `400 22px/1 ${SERIF}`, color: 'var(--due)' }}>{dueAmt.toLocaleString('pl', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} zł</div>
              </div>
              <div style={{ width: 1, background: 'var(--line)' }} />
              <div style={{ flex: 1, paddingLeft: 16 }}>
                <Label style={{ marginBottom: 6 }}>Opłacone</Label>
                <div style={{ font: `400 22px/1 ${SERIF}`, color: 'var(--paid)' }}>{paidAmt.toLocaleString('pl', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} zł</div>
              </div>
            </div>
          </Card>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {sortedBills.map(b => {
              const cat = CAT_MERGE[b.category] || b.category || 'Inne'
              return (
                <Card key={b.id} pad={14} style={{ opacity: b.paid ? 0.72 : 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 13 }}>
                    <button onClick={() => toggleBillPaid(b)} style={{ width: 26, height: 26, borderRadius: '50%', flexShrink: 0,
                      border: '1.8px solid ' + (b.paid ? 'var(--paid)' : 'var(--line-strong)'),
                      background: b.paid ? 'var(--paid)' : 'transparent',
                      display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {b.paid && <Icon name="check" size={15} color="#fff" stroke={2.2} />}
                    </button>
                    <div style={{ width: 34, height: 34, borderRadius: 11, background: 'var(--cream-warm)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, border: '1px solid var(--line)' }}>
                      <Icon name={CAT_ICON[cat] || 'receipt'} size={17} color="var(--ink-2)" />
                    </div>
                    <div style={{ flex: 1, cursor: 'pointer' }} onClick={() => openEditBill(b)}>
                      <div style={{ font: '500 14.5px/1.1 var(--font-sans)', color: 'var(--ink)' }}>{b.title}</div>
                      <div style={{ font: '400 12px/1 var(--font-sans)', color: 'var(--ink-3)', marginTop: 3 }}>{b.paid ? 'Opłacone · ' : ''}{cat}</div>
                    </div>
                    <div style={{ font: '500 15px/1 var(--font-sans)', color: 'var(--ink)', whiteSpace: 'nowrap' }}>
                      {b.amount?.toLocaleString('pl')} zł
                    </div>
                  </div>
                </Card>
              )
            })}
          </div>
        </>
      )}

      <Sheet open={addOpen}
        title={isEditingExpense ? 'Edytuj wydatek' : isEditingBill ? 'Edytuj opłatę' : mode === 'expenses' ? 'Nowy wydatek' : 'Nowa stała opłata'}
        onClose={() => { setAddOpen(false); setEditItem(null) }}
        onSubmit={submit}
        submitLabel={editItem ? 'Zapisz zmiany' : mode === 'expenses' ? 'Zapisz wydatek' : 'Dodaj opłatę'}
        onDelete={editItem ? deleteItem : undefined}
        accent={mode === 'expenses' ? 'var(--a)' : 'var(--ink)'}>
        {(mode === 'expenses' || isEditingExpense) && !isEditingBill ? <>
          <Field label="Na co"><TextInput value={f.title||''} onChange={v => setF(p=>({...p,title:v}))} placeholder="np. Biedronka" /></Field>
          <Field label="Kwota"><TextInput value={f.amount||''} onChange={v => setF(p=>({...p,amount:v}))} type="number" placeholder="0,00" prefix="zł" /></Field>
          <Field label="Kategoria"><ChipPicker value={f.category||'Jedzenie'} onChange={v => setF(p=>({...p,category:v}))} options={CATS} /></Field>
          <Field label="Kto płacił"><PersonPicker excludeShared value={f.added_by||'a'} onChange={v => setF(p=>({...p,added_by:v}))} /></Field>
        </> : <>
          <Field label="Nazwa opłaty"><TextInput value={f.title||''} onChange={v => setF(p=>({...p,title:v}))} placeholder="np. Prąd" /></Field>
          <Field label="Kwota"><TextInput value={f.amount||''} onChange={v => setF(p=>({...p,amount:v}))} type="number" placeholder="0" prefix="zł" /></Field>
          <Field label="Kategoria"><ChipPicker value={f.category||'Inne'} onChange={v => setF(p=>({...p,category:v}))} options={CATS} /></Field>
        </>}
      </Sheet>
    </div>
  )
}

function SplitHalf({ who, name, amount, pct }) {
  return (
    <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 11, padding: '2px 10px' }}>
      <Avatar who={who} size={36} />
      <div>
        <div style={{ font: '400 12px/1 var(--font-sans)', color: 'var(--ink-2)', marginBottom: 5 }}>{name} · {pct}</div>
        <div style={{ font: '500 16px/1 var(--font-sans)', color: 'var(--ink)' }}>{amount.toLocaleString('pl', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} zł</div>
      </div>
    </div>
  )
}

function fmtDate(d) {
  if (!d) return ''
  try { return new Date(d).toLocaleDateString('pl', { day: 'numeric', month: 'short' }) } catch { return d }
}
