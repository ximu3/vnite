import { useEffect, ipcRenderer, useRef, useState } from 'react';
import { useStore, create } from 'zustand';
import Root from './components/Root';
import AddGame from './components/AddGame';
import { MemoryRouter, HashRouter } from 'react-router-dom';
import Config from './components/Config';
import { useRootStore } from './components/Root';
import UpdateGame from './components/UpdateGame';



export const useAboutStore = create(set => ({
  version: '',
  setVersion: (version) => set({ version }),
  releases: [],
  setReleases: (releases) => set({ releases }),
}));


function App() {
  const { updateConfig, config } = useRootStore();
  const configRef = useRef(config);
  const [ismaximize, setIsmaximize] = useState(false);

  useEffect(() => {
    configRef.current = config;
  }, [config]);

  const { version, setVersion, releases, setReleases } = useAboutStore();
  useEffect(() => {
    window.electron.ipcRenderer.invoke('get-app-version').then((data) => {
      setVersion(data);
    })
    window.electron.ipcRenderer.invoke('get-github-releases', 'ximu3', 'vnite').then((data) => {
      setReleases(data);
    })
  }, []);
  function getFormattedDateTimeWithSeconds() {
    const now = new Date();

    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');

    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
  }
  async function quit() {
    try {
      const currentConfig = configRef.current;
      if (currentConfig?.cloudSync.enabled && currentConfig?.cloudSync.github.username) {
        const time = getFormattedDateTimeWithSeconds();
        document.getElementById('syncDataAtQuit').showModal();
        await window.electron.ipcRenderer.invoke('cloud-sync-github', time).then((data) => {
          if (data === 'success') {
            updateConfig(['cloudSync', 'github', 'lastSyncTime'], time);
          } else {
            console.log('cloud sync failed')
          }
        })
      }
    } catch (error) {
      console.log(error)
      throw error
    }
  }
  useEffect(() => {
    window.electron.ipcRenderer.on('app-exiting', async (event) => {
      try {
        const currentConfig = configRef.current;
        if (currentConfig?.general?.quitToTray) {
          window.electron.ipcRenderer.send('quit-to-tray');
          return;
        }
        await quit();
        window.electron.ipcRenderer.send('app-exit-processed', { success: true });
      } catch (error) {
        window.electron.ipcRenderer.send('app-exit-processed', { success: false, error: error.message });
      }
    });

    window.electron.ipcRenderer.on('app-exiting-without-tray', async (event) => {
      try {
        await quit();
        window.electron.ipcRenderer.send('app-exit-processed', { success: true });
      } catch (error) {
        window.electron.ipcRenderer.send('app-exit-processed', { success: false, error: error.message });
      }
    });

    window.electron.ipcRenderer.on('window-maximized', async (event) => {
      setIsmaximize(true);
    });

    window.electron.ipcRenderer.on('window-unmaximized', async (event) => {
      setIsmaximize(false);
    });

    const handleRightMenu = (event) => {
      event.preventDefault();
      window.electron.ipcRenderer.send('show-right-menu', event);
    }

    // window.addEventListener('contextmenu', handleRightMenu);

    return () => {
      window.electron.ipcRenderer.removeAllListeners('app-exiting');
      // window.removeEventListener('contextmenu', handleRightMenu);
    }
  }, [])

  return (
    <div className='relative w-screen h-screen'>
      {/* <DragDropArea className='z-[99999]' /> */}
      <dialog id="syncDataAtQuit" className="modal">
        <div className="w-1/3 h-auto modal-box bg-custom-modal">
          <form method="dialog">
          </form>
          <div className='flex w-full h-full p-3'>
            <progress className="self-center w-full progress"></progress>
          </div>
        </div>
      </dialog>

      <MemoryRouter>
        <AddGame />
      </MemoryRouter>

      <MemoryRouter>
        <UpdateGame />
      </MemoryRouter>

      <MemoryRouter>
        <Config />
      </MemoryRouter>

      <div className='absolute top-0 left-0 z-20 w-full h-8'>
        <div className='absolute top-0 left-0 z-20 flex items-center justify-between w-full h-8 title-bar text-custom-text-light bg-custom-titlebar border-b-0.5 border-black'>
          <div className='h-full p-0 dropdown no-drag bg-custom-titlebar'>
            <div tabIndex={0} role='button' className='w-full h-full gap-2 p-1 pt-1.5 pl-3 pr-3 mb-1 text-sm text-center border-0 text-smfont-semibold text-custom-text bg-custom-titlebar hover:brightness-125 font-mono'>vnite</div>
            <ul tabIndex={0} className="dropdown-content menu z-[1] w-52 p-2 ml-1 shadow rounded-none bg-custom-dropdown">
              <li className='hover:bg-custom-text hover:text-black' onClick={() => { document.getElementById('addGame').showModal() }}><a className='transition-none'>添加游戏</a></li>
              <li className='hover:bg-custom-text hover:text-black' onClick={() => { document.getElementById('setting').showModal() }}><a className='transition-none'>设置</a></li>
            </ul>
          </div>
          <div className='flex items-start justify-center no-drag'>
            <button className='flex items-center justify-center w-8 h-8 p-0 btn-ghost hover:bg-custom-text/30' onClick={() => window.electron.ipcRenderer.send('minimize')}>
              <span className='icon-[mdi-light--minus] w-5 h-5'></span>
            </button>
            <button className='flex items-center justify-center w-8 h-8 p-0 btn-ghost hover:bg-custom-text/30' onClick={() => window.electron.ipcRenderer.send('maximize')}>
              {ismaximize ? <span className='icon-[material-symbols-light--select-window-2-outline-sharp] w-4 h-4'></span>
                : <span className='icon-[mdi-light--square] w-4 h-4'></span>
              }
            </button>
            <button className='flex items-center justify-center w-8 h-8 p-0 btn-ghost hover:bg-custom-red' onClick={() => window.electron.ipcRenderer.send('close')}>
              <span className='icon-[material-symbols-light--close] w-5 h-5'></span>
            </button>
          </div>
        </div>
      </div>
      <div className="absolute top-8 left-0 w-full h-[calc(100%-2rem)] z-10 md:text-lg">
        <HashRouter>
          <Root />
        </HashRouter>
      </div>
    </div>
  )
}



export default App
