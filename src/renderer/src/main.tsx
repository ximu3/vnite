import '~/styles/main.css'

// import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import { TooltipProvider } from '@ui/tooltip'
import { i18nInit } from './utils/i18n'

i18nInit().then(() => {
  ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
    <TooltipProvider>
      <App />
    </TooltipProvider>
  )
})
