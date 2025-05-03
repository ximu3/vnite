import { Routes, Route, Navigate } from 'react-router-dom'
import { Sidebar } from '~/components/Sidebar'
import { Library } from './Library'
import { Record } from './Record'
import { Icon } from './arts/Icon'
import { Logo } from './arts/Logo'
import { GameScannerManager } from './GameScannerManager'
import { Light } from './Light'
import { Config } from '~/pages/Config'
import { DragContainer } from './DragContainer'
import { TransformerManager } from './TransformerManager'

export function Main(): JSX.Element {
  console.warn('[DEBUG] Main')
  return (
    <div>
      <Light />
      <DragContainer>
        <Sidebar />
        <Routes>
          <Route index element={<Navigate to="/library" />} />
          <Route path="/library/*" element={<Library />} />
          <Route path="/record/*" element={<Record />} />
          <Route path="/scanner/*" element={<GameScannerManager />} />
          <Route path="/transformer/*" element={<TransformerManager />} />
          <Route path="/config/*" element={<Config />} />
          <Route path="/icon" element={<Icon />} />
          <Route path="/logo" element={<Logo />} />
        </Routes>
      </DragContainer>
    </div>
  )
}
