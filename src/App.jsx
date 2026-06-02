import { useState } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import LoginScreen from './components/LoginScreen'
import BottomNav from './components/BottomNav'
import TopBar from './components/TopBar'
import Today from './pages/Today'
import Calendar from './pages/Calendar'
import Finance from './pages/Finance'
import Movies from './pages/Movies'
import More from './pages/More'

const PAGE_TITLES = {
  '/': 'Dziś',
  '/kalendarz': 'Kalendarz',
  '/finanse': 'Finanse',
  '/filmy': 'Filmy',
  '/wiecej': 'Więcej',
}

export default function App() {
  const [user, setUser] = useState(null)

  function handleLogin(u) {
    setUser(u)
  }

  function handleLogout() {
    setUser(null)
  }

  if (!user) {
    return <LoginScreen onLogin={handleLogin} />
  }

  return (
    <>
      <Routes>
        <Route path="/" element={<WithLayout user={user} title="Dziś" onLogout={handleLogout}><Today user={user} /></WithLayout>} />
        <Route path="/kalendarz" element={<WithLayout user={user} title="Kalendarz" onLogout={handleLogout}><Calendar user={user} /></WithLayout>} />
        <Route path="/finanse" element={<WithLayout user={user} title="Finanse" onLogout={handleLogout}><Finance user={user} /></WithLayout>} />
        <Route path="/filmy" element={<WithLayout user={user} title="Filmy" onLogout={handleLogout}><Movies user={user} /></WithLayout>} />
        <Route path="/wiecej" element={<WithLayout user={user} title="Więcej" onLogout={handleLogout}><More user={user} /></WithLayout>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  )
}

function WithLayout({ user, title, onLogout, children }) {
  return (
    <>
      <TopBar user={user} title={title} onLogout={onLogout} />
      {children}
      <BottomNav user={user} />
    </>
  )
}
