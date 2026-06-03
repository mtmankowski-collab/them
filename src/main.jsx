import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App.jsx'
import { subscribeToPush } from './lib/push.js'

// Auto-subscribe to push if permission already granted
if ('Notification' in window && Notification.permission === 'granted') {
  subscribeToPush()
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
)
