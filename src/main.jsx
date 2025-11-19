import React from 'react'
import ReactDOM from 'react-dom/client'
// Suppress console errors from wallet extensions
import './utils/consoleSuppress'
import App from './App.jsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)

