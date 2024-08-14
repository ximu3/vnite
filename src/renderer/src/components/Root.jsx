import { BrowserRouter, Routes, Route, Navigate, NavLink } from 'react-router-dom';
import Library from './Library';
import Record from './Record';
import { create } from 'zustand';
import { useEffect } from 'react';
import { useAddGame } from './AddGame';

export const useRootStore = create(set => ({
  data: [],
  alert: "",
  timestamp: Date.now(),
  config: {},
  setData: (data) => set({ data }),
  updateData: (path, value) => set((state) => {
    const newData = JSON.parse(JSON.stringify(state.data));
    let current = newData;
    for (let i = 0; i < path.length - 1; i++) {
      current = current[path[i]];
    }
    current[path[path.length - 1]] = value;
    return { data: newData };
  }),
  setAlert: (alert) => set({ alert }),
  setTimestamp: () => set({ timestamp: Date.now() }),
  setConfig: (config) => set({ config }),
  updateConfig: (path, value) => set((state) => {
    const newConfig = JSON.parse(JSON.stringify(state.config));
    let current = newConfig;
    for (let i = 0; i < path.length - 1; i++) {
      current = current[path[i]];
    }
    current[path[path.length - 1]] = value;
    return { config: newConfig };
  }),
}));

function NavButton({ to, name }) {
  return (
    <NavLink className={({ isActive, isPending }) =>
      isPending
        ? ""
        : isActive
          ? "bg-custom-blue-4/20 text-custom-text-light"
          : ""
    }
      to={to}>
      {name}
    </NavLink>
  )

}

function Root() {
  const { data, setData, alert, config, setConfig } = useRootStore();
  const { isloading } = useAddGame();
  useEffect(() => {
    window.electron.ipcRenderer.invoke('get-game-data').then((data) => {
      setData(data);
    })
    window.electron.ipcRenderer.on('game-data-updated', (event, data) => {
      setData(data);
    })
    window.electron.ipcRenderer.on('config-data-updated', (event, data) => {
      setConfig(data);
    })
    window.electron.ipcRenderer.on('path-log', (event, alert) => {
      console.log(alert);
    })
  }, [isloading])
  useEffect(() => {
    if (data.length !== 0) {
      window.electron.ipcRenderer.send('save-game-data', data)
    }
  }, [data])

  useEffect(() => {
    window.electron.ipcRenderer.invoke('get-config-data').then((config) => {
      setConfig(config);
    })
  }, [])
  useEffect(() => {
    if (config['cloudSync']) {
      window.electron.ipcRenderer.send('save-config-data', config)
    }
  }, [config])
  return (
    <div className='flex flex-row w-full h-full text-custom-text-light'>
      {alert &&
        <div className="z-20 toast toast-center">
          <div className="pr-0 alert bg-custom-blue-6">
            <span className='text-custom-text-light'>{alert}</span>
          </div>
        </div>
      }
      <ul className="shadow-lg w-14 menu bg-custom-main-3 rounded-box shrink-0">
        <li><NavButton to="/library" className="bg-primary" name="l" /></li>
        <li><NavButton to="/record" className="bg-primary" name="r" /></li>
        <li><NavButton to="/config" className="bg-primary" name="c" /></li>
      </ul>
      <div className='grow'>
        <Routes>
          <Route index element={<Navigate to='/library' />} />
          <Route path='/library/*' element={<Library />} />
          <Route path='/record/*' element={<Record />} />
          {/* <Route path='/config/*' element={<Config />} /> */}
        </Routes>
      </div>
    </div>
  );
}



export default Root;