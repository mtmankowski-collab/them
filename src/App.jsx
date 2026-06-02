import { useState, useEffect } from 'react'
import Login from './pages/Login'
import Today from './pages/Today'
import Calendar from './pages/Calendar'
import Finance from './pages/Finance'
import Films from './pages/Films'
import Chat from './pages/Chat'
import More from './pages/More'
import Shopping from './pages/Shopping'
import Knowledge from './pages/Knowledge'
import Places from './pages/Places'
import Trips from './pages/Trips'
import Birthdays from './pages/Birthdays'
import Inspirations from './pages/Inspirations'
import BottomNav from './components/BottomNav'
import { supabase } from './lib/supabase'

const MAIN_TABS = ['today','calendar','finance','films','more']
const SUB_PAGES = ['chat','shopping','knowledge','places','trips','birthdays','inspo']

export default function App() {
  const [unlocked, setUnlocked] = useState(() => sessionStorage.getItem('them_unlocked') === '1')
  const [page, setPage] = useState('today')
  const [sub, setSub] = useState(null)
  const [dark, setDark] = useState(() => localStorage.getItem('them_dark') === '1')

  const [shoppingCount, setShoppingCount] = useState(0)
  const [knowledgeCount, setKnowledgeCount] = useState(0)
  const [placesCount, setPlacesCount] = useState(0)
  const [tripsCount, setTripsCount] = useState(0)
  const [inspoCount, setInspoCount] = useState(0)

  useEffect(() => {
    document.documentElement.classList.toggle('theme-dark', dark)
    document.body.classList.toggle('theme-dark', dark)
    const root = document.getElementById('root')
    if (root) root.classList.toggle('theme-dark', dark)
    localStorage.setItem('them_dark', dark ? '1' : '0')
  }, [dark])

  useEffect(() => {
    if (!unlocked) return
    supabase.from('shopping').select('id', { count: 'exact' }).eq('done', false).then(({ count }) => setShoppingCount(count || 0))
    supabase.from('knowledge').select('id', { count: 'exact' }).then(({ count }) => setKnowledgeCount(count || 0))
    supabase.from('places').select('id', { count: 'exact' }).then(({ count }) => setPlacesCount(count || 0))
    supabase.from('vacations').select('id', { count: 'exact' }).then(({ count }) => setTripsCount(count || 0))
    try { setInspoCount((JSON.parse(localStorage.getItem('them_inspirations')) || []).length) } catch {}
  }, [unlocked])

  function handleUnlock() {
    sessionStorage.setItem('them_unlocked', '1')
    setUnlocked(true)
  }

  function handleLogout() {
    sessionStorage.removeItem('them_unlocked')
    setUnlocked(false)
    setPage('today')
    setSub(null)
  }

  function navigate(p) {
    if (MAIN_TABS.includes(p)) { setPage(p); setSub(null) }
    else setSub(p)
  }

  function goBack() { setSub(null) }

  if (!unlocked) return <Login onUnlock={handleUnlock} />

  const showMain = !sub

  return (
    <>
      {sub === 'chat' && <Chat onBack={goBack} />}
      {sub === 'shopping' && <Shopping onBack={goBack} />}
      {sub === 'knowledge' && <Knowledge onBack={goBack} />}
      {sub === 'places' && <Places onBack={goBack} />}
      {sub === 'trips' && <Trips onBack={goBack} />}
      {sub === 'birthdays' && <Birthdays onBack={goBack} />}
      {sub === 'inspo' && <Inspirations onBack={goBack} />}

      {showMain && (
        <>
          {page === 'today' && (
            <Today
              onGoChat={() => navigate('chat')}
              onGoShopping={() => navigate('shopping')}
              onGoFinance={() => setPage('finance')}
            />
          )}
          {page === 'calendar' && <Calendar onGoBirthdays={() => navigate('birthdays')} />}
          {page === 'finance' && <Finance />}
          {page === 'films' && <Films />}
          {page === 'more' && (
            <More
              dark={dark}
              onToggleDark={() => setDark(d => !d)}
              onLogout={handleLogout}
              onGo={navigate}
              shoppingCount={shoppingCount}
              knowledgeCount={knowledgeCount}
              placesCount={placesCount}
              tripsCount={tripsCount}
              inspoCount={inspoCount}
            />
          )}
          <BottomNav page={page} onNavigate={p => { setPage(p); setSub(null) }} />
        </>
      )}
    </>
  )
}
