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
  setTimestamp: () => set({ timestamp: Date.now() })
}));

function NavButton({ to, name }) {
  return (
    <NavLink className={({ isActive, isPending }) =>
      isPending
        ? ""
        : isActive
        ? "bg-primary text-base-100"
        : ""
    }
    to={to}>
      {name}
    </NavLink>
  )

}

function Root() {
  const { data, setData, alert } = useRootStore();
  const { isloading } = useAddGame();
  useEffect(() => {
    window.electron.ipcRenderer.invoke('get-game-data').then((data) => {
      setData(data);
    })
    window.electron.ipcRenderer.on('game-data-updated', (event, data) => {
      setData(data);
    })
  }, [isloading])
  useEffect(() => {
    if (data.length !== 0) {
      window.electron.ipcRenderer.send('save-game-data', data)
    }
  }, [data])
  return (
    <div className='flex flex-row w-full h-full'>
      {alert && 
        <div className="toast toast-center">
          <div className="alert alert-error">
            <span className='text-base-100'>{alert}</span>
          </div>
        </div>
      }
      <ul className="w-14 menu bg-base-300 rounded-box shrink-0">
        <li><NavButton to="/library" className="bg-primary" name="l" /></li>
        <li><NavButton to="/record" className="bg-primary" name="r" /></li>
      </ul>
      <div className='grow'>
        <Routes>
          <Route index element={<Navigate to='/library' />} />
          <Route path='/library/*' element={<Library />} />
          <Route path='/record' element={<Record />} />
        </Routes>
      </div>
    </div>
  );
}



export default Root;