import '~/styles/globals.css'

import ReactDOM from 'react-dom/client'
import { RouterProvider } from '@tanstack/react-router'
import { router } from './app/router'
import { TooltipProvider } from '@ui/tooltip'
import { i18nInit } from './utils/i18n'

i18nInit().then(() => {
  ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
    <TooltipProvider>
      <RouterProvider router={router} />
    </TooltipProvider>
  )
})
