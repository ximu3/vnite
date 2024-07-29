
import { useEffect, ipcRenderer } from 'react';

import { useStore, create } from 'zustand';
import Root from './components/Root';
import AddGame from './components/AddGame';
import { MemoryRouter, BrowserRouter, Routes, Route, Navigate, NavLink, useNavigate } from 'react-router-dom';
import Config from './components/Config';




function App() {
  
  
  return (
    <div className='relative w-screen h-screen'>
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
        <div className='absolute top-0 left-0 z-20 flex items-center justify-between w-full h-8 border-b-2 border-primary title-bar'>
          <div className='h-full p-0 dropdown no-drag'>
            <div tabIndex={0} role='button' className='h-full min-h-0 pt-0 pb-0 pl-4 pr-4 text-lg font-bold border-0 btn-ghost no-drag'>my-gal</div>
            <ul tabIndex={0} className="dropdown-content menu z-[1] w-52 p-2 shadow rounded-none border-base-300 border-2 bg-base-100">
              <li onClick={()=>{document.getElementById('my_modal_3').showModal()}}><a>添加游戏</a></li>
              <li onClick={()=>{document.getElementById('my_modal_0').showModal()}}><a>设置</a></li>
            </ul>
          </div>
          <div className='flex no-drag'>
            <button className='w-8 h-8 p-0 btn-ghost' onClick={() => window.electron.ipcRenderer.send('minimize')}>
              <span className='icon-[material-symbols-light--minimize] w-full h-full'></span>
            </button>
            <button className='w-8 h-8 p-0 btn-ghost' onClick={() => window.electron.ipcRenderer.send('maximize')}>
              <span className='icon-[material-symbols-light--maximize] w-full h-full'></span>
            </button>
            <button className='w-8 h-8 p-0 btn-ghost hover:bg-error' onClick={() => window.electron.ipcRenderer.send('close')}>
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
