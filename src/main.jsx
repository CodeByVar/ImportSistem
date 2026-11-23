import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { setupAuthFetch } from './utils/authFetch'
import App from './App.jsx'

// Install global JWT auth interceptor before mounting React
setupAuthFetch()

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
