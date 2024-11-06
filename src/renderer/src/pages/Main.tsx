import { HashRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Sidebar } from '~/components/Sidebar'
import { cn } from '~/utils'
import { Library } from './Library/main'

export function Main(): JSX.Element {
  return (
    <HashRouter>
      <div className={cn('flex flex-row w-screen h-screen')}>
        <Sidebar />
        <Routes>
          <Route index element={<Navigate to="/library" />} />
          <Route path="/library/*" element={<Library />} />
          <Route path="/record/*" element={<div></div>} />
        </Routes>
      </div>
    </HashRouter>
  )
}
