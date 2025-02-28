import { Routes, Route, Navigate } from 'react-router-dom'
import { Sidebar } from '~/components/Sidebar'
import { cn } from '~/utils'
import { Library } from './Library'
import { Record } from './Record'
import { Icon } from './arts/Icon'
import { Logo } from './arts/Logo'

export function Main(): JSX.Element {
  console.warn('[DEBUG] Main')
  return (
    <div className={cn('flex flex-row w-screen h-screen')}>
      <Sidebar />
      <Routes>
        <Route index element={<Navigate to="/library" />} />
        <Route path="/library/*" element={<Library />} />
        <Route path="/record/*" element={<Record />} />
        <Route path="/icon" element={<Icon />} />
        <Route path="/logo" element={<Logo />} />
      </Routes>
    </div>
  )
}
