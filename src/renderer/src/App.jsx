
import { useEffect, ipcRenderer } from 'react';

import { useStore, create } from 'zustand';
import Root from './components/Root';
import AddGame from './components/AddGame';
import { MemoryRouter, BrowserRouter, Routes, Route, Navigate, NavLink, useNavigate } from 'react-router-dom';
import Config from './components/Config';




function App() {


  return (
    <div className='relative w-screen h-screen font-mono'>
      {/* <div className="toast toast-center">
        <div className="alert alert-info">
          <span>New mail arrived.</span>
        </div>
      </div> */}


      {/* You can open the modal using document.getElementById('ID').showModal() method */}

      <MemoryRouter>
        <AddGame />
      </MemoryRouter>

      <MemoryRouter>
        <Config />
      </MemoryRouter>

      <div className='absolute top-0 left-0 z-20 w-full h-8'>
        <div className='absolute top-0 left-0 z-20 flex items-center justify-between w-full h-8 title-bar text-custom-text-light bg-custom-main-4'>
          <div className='h-full p-0 dropdown no-drag bg-custom-main-4'>
            <div tabIndex={0} role='button' className='w-full h-full gap-2 mb-1 text-lg font-semibold text-center border-0 input-sm bg-custom-main-4 hover:brightness-125'>my-gal</div>
            <ul tabIndex={0} className="dropdown-content menu z-[1] w-52 p-2 shadow rounded-none bg-custom-main-5">
              <li className='hover:bg-custom-text hover:text-black/80' onClick={() => { document.getElementById('my_modal_3').showModal() }}><a className='transition-none'>添加游戏</a></li>
              <li className='hover:bg-custom-text hover:text-black/80' onClick={() => { document.getElementById('setting').showModal() }}><a className='transition-none'>设置</a></li>
            </ul>
          </div>
          <div className='flex no-drag'>
            <button className='w-8 h-8 p-0 btn-ghost hover:bg-custom-text/30' onClick={() => window.electron.ipcRenderer.send('minimize')}>
              <span className='icon-[material-symbols-light--minimize] w-full h-full'></span>
            </button>
            <button className='w-8 h-8 p-0 btn-ghost hover:bg-custom-text/30' onClick={() => window.electron.ipcRenderer.send('maximize')}>
              <span className='icon-[material-symbols-light--maximize] w-full h-full'></span>
            </button>
            <button className='w-8 h-8 p-0 btn-ghost hover:bg-custom-red' onClick={() => window.electron.ipcRenderer.send('close')}>
              <span className='icon-[material-symbols-light--close] w-full h-full'></span>
            </button>
          </div>
        </div>
      </div>
      <div className="absolute top-8 left-0 w-full h-[calc(100%-2rem)] z-10 md:text-lg">
        <BrowserRouter>
          <Root />
        </BrowserRouter>
      </div>
    </div>
  )
}

export default App
