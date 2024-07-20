import { BrowserRouter, Routes, Route, Navigate, NavLink } from 'react-router-dom';
import Library from './Library';
import Record from './Record';
import { create } from 'zustand';
import { useEffect } from 'react';
import { useAddGame } from './AddGame';

export const useRootStore = create(set => ({
  data: [],
  setData: (data) => set({ data }),
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
  const { data, setData } = useRootStore();
  const { isloading } = useAddGame();
  useEffect(() => {
    window.electron.ipcRenderer.invoke('get-game-data').then((data) => {
      setData(data);
    })
  }, [isloading])
  return (
    <div className='flex flex-row w-full h-full'>
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