import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import { bootstrapPlayable, installPlayableCta } from './game/mraidBridge'

installPlayableCta()

let root = null

const mountApp = () => {
  if (root) {
    return
  }

  root = ReactDOM.createRoot(document.getElementById('root'))
  root.render(
    <App />
  )
}

bootstrapPlayable({
  onStart: mountApp,
})
