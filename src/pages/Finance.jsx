import { useState, useEffect } from 'react'
import Icon from '../components/Icon'
import { Avatar, PersonDot, Label, Card, Segmented, ScreenHead, SectionTitle, Sheet, Field, TextInput, ChipPicker, PersonPicker, navBtn } from '../components/ui'
import { supabase } from '../lib/supabase'

const SERIF = "'Bodoni Moda', Georgia, serif"
const CATS = ['Jedzenie','Restauracje','Auto','Gaba','Kuba','Ubrania','Rozrywka','Inne']
const CAT_COLORS = { Jedzenie:'var(--a)', Restauracje:'var(--a-deep)', Auto:'var(--b)', Gaba:'var(--ink)', Kuba:'var(--b-deep)', Ubrania:'var(--a-soft-2)', Rozrywka:'var(--ink-2)', Inne:'var(--ink-3)' }
const CAT_ICON = { Jedzenie:'cart', Restauracje:'cup', Auto:'car', Gaba:'toy', Kuba:'toy', Ubrania:'tag', Rozrywka:'sparkle', Inne:'receipt' }

const MIN_MONTH = '2026-06'
function monthKey(date) { return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}` }
function monthLabel(key) {
  const [y, m] = key.split('-')
  const d = new Date(parseInt(y), parseInt(m)-1, 1)
  return d.toLocaleString('pl', { month: 'long', year: 'numeric' })
}
function addMonths(key, n) {
  const [y, m] = key.split('-').map(Number)
  const d = new Date(y, m - 1 + n, 1)
  return monthKey(d)
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
    supabase.from('bills').select('*').order('due_day').then(({ data }) => setBills(data || []))
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
      : { title: '', amount: '', due_day: '10' })
    setAddOpen(true)
  }

  function openEditExpense(e) {
    setEditItem({ ...e, _type: 'expense' })
    setF({ title: e.title, amount: String(e.amount || ''), category: e.category || 'Jedzenie', added_by: e.added_by || 'a' })
    setAddOpen(true)
  }

  function openEditBill(b) {
    setEditItem({ ...b, _type: 'bill' })
    setF({ title: b.title, amount: String(b.amount || ''), due_day: String(b.due_day || '10') })
    setAddOpen(true)
  }

  async function submit() {
    if (!f.title?.trim()) return
    if (editItem?._type === 'expense') {
      await supabase.from('expenses').update({ title: f.title.trim(), amount: parseFloat(f.amount) || 0, category: f.category, added_by: f.added_by }).eq('id', editItem.id)
      setExpenses(prev => prev.map(e => e.id === editItem.id ? { ...e, title: f.title.trim(), amount: parseFloat(f.amount) || 0, category: f.category, added_by: f.added_by } : e))
    } else if (editItem?._type === 'bill') {
      await supabase.from('bills').update({ title: f.title.trim(), amount: parseFloat(f.amount) || 0, due_day: parseInt(f.due_day) || 1 }).eq('id', editItem.id)
      setBills(prev => prev.map(b => b.id === editItem.id ? { ...b, title: f.title.trim(), amount: parseFloat(f.amount) || 0, due_day: parseInt(f.due_day) || 1 } : b))
    } else if (mode === 'expenses') {
      const { data } = await supabase.from('expenses').insert({
        title: f.title.trim(), amount: parseFloat(f.amount) || 0,
        category: f.category, added_by: f.added_by,
        date: now.toISOString().split('T')[0],
      }).select().single()
      if (data) {
        if (expMonth === curMonth) setExpenses(prev => [data, ...prev])
      }
    } else {
      const { data } = await supabase.from('bills').insert({
        title: f.title.trim(), amount: parseFloat(f.amount) || 0,
        due_day: parseInt(f.due_day) || 1, paid_months: [],
      }).select().single()
      if (data) setBills(prev => [...prev, data].sort((a,b) => a.due_day - b.due_day))
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
  const sortedBills = [...billsWithPaid].sort((a,b) => a.paid - b.paid || a.due_day - b.due_day)

  const totalSpent = expenses.reduce((s,e) => s + (e.amount || 0), 0)
  const spentA = expenses.filter(e => e.added_by === 'a').reduce((s,e) => s + e.amount, 0)
  const spentB = expenses.filter(e => e.added_by === 'b').reduce((s,e) => s + e.amount, 0)
  const total = spentA + spentB || 1

  const catAmounts = {}
  expenses.forEach(e => { catAmounts[e.category] = (catAmounts[e.category] || 0) + e.amount })

  const isEditingExpense = editItem?._type === 'expense'
  const isEditingBill = editItem?._type === 'bill'
  const isCurrentMonth = expMonth === curMonth

  return (
    <div className="screen" style={{ position: 'relative' }}>
      <ScreenHead sub={monthLabel(expMonth)} title="Finanse" right={
        <button style={navBtn} onClick={openAdd}><Icon name="plus" size={20} color="var(--ink)" /></button>
      } />

      <div style={{ marginBottom: 18 }}>
        <Segmented value={mode} onChange={setMode} options={[
          { value:'expenses', label:'Wydatki' }, { value:'bills', label:'Stałe opłaty' }
        ]} />
      </div>

      {mode === 'expenses' ? (
        <>
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

          <Card style={{ marginBottom: 16 }}>
            <Label style={{ marginBottom: 8 }}>Wydano {isCurrentMonth ? 'w tym miesiącu' : monthLabel(expMonth).split(' ').slice(0,2).join(' ')}</Label>
            <div style={{ font: `400 34px/1 ${SERIF}`, color: 'var(--ink)', marginBottom: 16 }}>
              {totalSpent.toLocaleString('pl', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} <span style={{ fontSize: 18, color: 'var(--ink-2)' }}>zł</span>
            </div>
            {totalSpent > 0 && <>
              <div style={{ height: 10, borderRadius: 5, overflow: 'hidden', display: 'flex', marginBottom: 14 }}>
                {CATS.map(c => catAmounts[c] ? (
                  <div key={c} style={{ width: (catAmounts[c] / totalSpent * 100) + '%', background: CAT_COLORS[c] }} />
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
            <SplitHalf who="a" name="Maniek" amount={spentA} pct={Math.round(spentA/total*100) + '%'} />
            <div style={{ width: 1, background: 'var(--line)', margin: '2px 0' }} />
            <SplitHalf who="b" name="Ula" amount={spentB} pct={Math.round(spentB/total*100) + '%'} />
          </Card>
          <SectionTitle title="Wydatki" />
          {expenses.length ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {expenses.map(e => (
                <Card key={e.id} pad={13} onClick={() => openEditExpense(e)} style={{ cursor: 'pointer' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 40, height: 40, borderRadius: 13, background: 'var(--cream-warm)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, border: '1px solid var(--line)' }}>
                      <Icon name={CAT_ICON[e.category] || 'receipt'} size={20} color="var(--ink-2)" />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ font: '500 14.5px/1.1 var(--font-sans)', color: 'var(--ink)' }}>{e.title}</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
                        <PersonDot who={e.added_by || 'shared'} size={6} />
                        <span style={{ font: '400 12px/1 var(--font-sans)', color: 'var(--ink-3)' }}>{e.category} · {fmtDate(e.date)}</span>
                      </div>
                    </div>
                    <div style={{ font: '500 15px/1 var(--font-sans)', color: 'var(--ink)', whiteSpace: 'nowrap' }}>
                      {e.amount?.toFixed(2).replace('.',',')} zł
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '32px 0', font: '400 13.5px/1 var(--font-sans)', color: 'var(--ink-3)' }}>
              Brak wydatków w tym okresie
            </div>
          )}
        </>
      ) : (
        <>
          <Card style={{ marginBottom: 16 }}>
            <div style={{ display: 'flex', gap: 0 }}>
              <div style={{ flex: 1 }}>
                <Label style={{ marginBottom: 8 }}>Do zapłaty</Label>
                <div style={{ font: `400 26px/1 ${SERIF}`, color: 'var(--due)' }}>{dueAmt.toLocaleString('pl')} zł</div>
              </div>
              <div style={{ width: 1, background: 'var(--line)' }} />
              <div style={{ flex: 1, paddingLeft: 16 }}>
                <Label style={{ marginBottom: 8 }}>Opłacone</Label>
                <div style={{ font: `400 26px/1 ${SERIF}`, color: 'var(--paid)' }}>{paidAmt.toLocaleString('pl')} zł</div>
              </div>
            </div>
          </Card>
          <SectionTitle title="Miesięczne opłaty" />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {sortedBills.map(b => (
              <Card key={b.id} pad={14} style={{ opacity: b.paid ? 0.72 : 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 13 }}>
                  <button onClick={() => toggleBillPaid(b)} style={{ width: 26, height: 26, borderRadius: '50%', flexShrink: 0,
                    border: '1.8px solid ' + (b.paid ? 'var(--paid)' : 'var(--line-strong)'),
                    background: b.paid ? 'var(--paid)' : 'transparent',
                    display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {b.paid && <Icon name="check" size={15} color="#fff" stroke={2.2} />}
                  </button>
                  <div style={{ flex: 1, cursor: 'pointer' }} onClick={() => openEditBill(b)}>
                    <div style={{ font: '500 14.5px/1.1 var(--font-sans)', color: 'var(--ink)' }}>{b.title}</div>
                    <div style={{ font: '400 12px/1 var(--font-sans)', color: b.paid ? 'var(--ink-3)' : 'var(--ink-2)', marginTop: 4 }}>
                      {b.paid ? 'Opłacone' : `Termin ${b.due_day} ${now.toLocaleString('pl', { month: 'short' })}`}
                    </div>
                  </div>
                  <div style={{ font: '500 15px/1 var(--font-sans)', color: 'var(--ink)', whiteSpace: 'nowrap' }}>
                    {b.amount?.toLocaleString('pl')} zł
                  </div>
                </div>
              </Card>
            ))}
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
          <Field label="Kto płacił"><PersonPicker value={f.added_by||'a'} onChange={v => setF(p=>({...p,added_by:v}))} /></Field>
        </> : <>
          <Field label="Nazwa opłaty"><TextInput value={f.title||''} onChange={v => setF(p=>({...p,title:v}))} placeholder="np. Prąd" /></Field>
          <div style={{ display: 'flex', gap: 12 }}>
            <div style={{ flex: 1 }}><Field label="Kwota"><TextInput value={f.amount||''} onChange={v => setF(p=>({...p,amount:v}))} type="number" placeholder="0" prefix="zł" /></Field></div>
            <div style={{ width: 120 }}><Field label="Dzień miesiąca"><TextInput value={f.due_day||''} onChange={v => setF(p=>({...p,due_day:v}))} type="number" placeholder="10" /></Field></div>
          </div>
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
