import '~/styles/splash.css'
import React from 'react'
import ReactDOM from 'react-dom/client'
import { Splash } from '~/pages/Splash'

ReactDOM.createRoot(document.getElementById('splash') as HTMLElement).render(
  <React.StrictMode>
    <Splash />
  </React.StrictMode>
)
