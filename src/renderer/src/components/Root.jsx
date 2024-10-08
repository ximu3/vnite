import { BrowserRouter, Routes, Route, Navigate, NavLink } from 'react-router-dom';
import Library from './Library';
import Record from './Record';
import { create } from 'zustand';
import { useEffect } from 'react';
import { useAddGame } from './AddGame';
import log from 'electron-log/renderer.js';

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
  icons: [],
  setIcons: (icons) => set({ icons }),
  isPulling: true,
  setIsPulling: (isPulling) => set({ isPulling }),
  isGameRunning: { status: false, id: null },
  setIsGameRunning: (status, id) => set({ isGameRunning: { status, id } }),
  categoryData: [],
  setCategoryData: (categoryData) => set({ categoryData }),
  updateCategoryData: (path, value) => set((state) => {
    const newCategoryData = JSON.parse(JSON.stringify(state.categoryData));
    let current = newCategoryData;
    for (let i = 0; i < path.length - 1; i++) {
      current = current[path[i]];
    }
    current[path[path.length - 1]] = value;
    return { categoryData: newCategoryData };
  }),
  isAutoStartEnabled: false,
  setIsAutoStartEnabled: (isAutoStartEnabled) => set({ isAutoStartEnabled }),
  pathData: {},
  setPathData: (pathData) => set({ pathData }),
  updatePathData: (path, value) => set((state) => {
    const newPathData = JSON.parse(JSON.stringify(state.pathData));
    let current = newPathData;
    for (let i = 0; i < path.length - 1; i++) {
      current = current[path[i]];
    }
    current[path[path.length - 1]] = value;
    return { pathData: newPathData };
  }),
}));

function NavButton({ to, name }) {
  return (
    <NavLink className={({ isActive, isPending }) =>
      isPending
        ? ""
        : isActive
          ? "p-2 flex items-center justify-center transition-none bg-gradient-to-br from-custom-blue-5 to-custom-blue-5/80 text-custom-text-light text-xs hover:bg-custom-blue-5 hover:brightness-125"
          : "p-2 flex items-center justify-center active:bg-gradient-to-br active:from-custom-blue-5 active:to-custom-blue-5/80 hover:bg-gradient-to-br hover:from-custom-blue-5/50 hover:to-custom-blue-5/30 active:text-custom-text-light"
    }
      to={to}>
      {name}
    </NavLink>
  )

}

function Root() {
  const { data, setData, alert, config, setConfig, isPulling, setIsPulling, setTimestamp, setCategoryData, categoryData, setIsAutoStartEnabled, pathData, setPathData } = useRootStore();
  useEffect(() => {
    window.electron.ipcRenderer.invoke('get-game-data').then((data) => {
      setData(data);
    })
    window.electron.ipcRenderer.invoke('get-config-data').then((config) => {
      setConfig(config);
    })
    window.electron.ipcRenderer.invoke('get-category-data').then((categoryData) => {
      setCategoryData(categoryData);
    })
    window.electron.ipcRenderer.invoke('get-path-data').then((pathData) => {
      setPathData(pathData);
    })
    window.electron.ipcRenderer.on('game-data-updated', (event, data) => {
      setData(data);
    })
    window.electron.ipcRenderer.on('config-data-updated', (event, data) => {
      setConfig(data);
    })
    window.electron.ipcRenderer.on('category-data-updated', (event, data) => {
      setCategoryData(data);
    })
    window.electron.ipcRenderer.on('path-data-updated', (event, data) => {
      setPathData(data);
    })
    return () => {
      window.electron.ipcRenderer.removeAllListeners('game-data-updated');
      window.electron.ipcRenderer.removeAllListeners('config-data-updated');
      window.electron.ipcRenderer.removeAllListeners('category-data-updated');
      window.electron.ipcRenderer.removeAllListeners('path-data-updated');
    }
  }, [])
  useEffect(() => {
    if (Object.keys(data).length !== 0) {
      window.electron.ipcRenderer.send('save-game-data', data)
    }
  }, [data])

  useEffect(() => {
    if (Object.keys(pathData).length !== 0) {
      window.electron.ipcRenderer.send('save-path-data', pathData)
    }
  }, [pathData])

  useEffect(() => {
    // 获取当前自启动状态
    window.electron.ipcRenderer.invoke('get-auto-start').then(setIsAutoStartEnabled);
  }, []);

  useEffect(() => {
    if (config['cloudSync']) {
      window.electron.ipcRenderer.send('save-config-data', config)
    }
    if (config['cloudSync']?.enabled && config['cloudSync']?.github?.username && !isPulling) {
      (async () => {
        try {
          setIsPulling(true);
          document.getElementById('syncDataAtQuit').showModal();
          await window.electron.ipcRenderer.invoke('pull-changes')
          setTimestamp(Date.now());
          document.getElementById('syncDataAtQuit').close();
        } catch (error) {
          setIsPulling(true);
          log.error(error);
          document.getElementById('syncDataAtQuit').close();
        }
      })()
    }
  }, [config])
  // useEffect(() => {
  //   if (categoryData.length !== 0) {
  //     window.electron.ipcRenderer.send('save-category-data', categoryData)
  //   }
  // }, [categoryData])
  return (
    <div className='flex flex-row w-full h-full text-custom-text-light'>
      {alert &&
        <div className="z-20 border-0 toast toast-center">
          <div className="pr-0 border-0 alert bg-custom-blue-6">
            <span className='text-custom-text-light'>{alert}</span>
          </div>
        </div>
      }
      <ul className="relative flex flex-col items-center gap-2 shadow-lg w-14 menu bg-custom-main-3 rounded-box shrink-0">
        <li><NavButton to="/library" className="" name={<span className="icon-[ion--library-sharp] w-5 h-5"></span>} /></li>
        <li><NavButton to="/record" className="" name={<span className="icon-[fa--pie-chart] w-5 h-5"></span>} /></li>
        <button onClick={() => { document.getElementById('setting').showModal() }} className='absolute w-full transition-all bg-transparent bottom-3 hover:text-custom-blue-6'><span className="icon-[material-symbols-light--settings] w-6.5 h-6.5"></span></button>
      </ul>
      <div className='grow'>
        <Routes>
          <Route index element={<Navigate to='/library' />} />
          <Route path='/library/*' element={<Library />} />
          <Route path='/record/*' element={<Record />} />
        </Routes>
      </div>
    </div>
  );
}



export default Root;