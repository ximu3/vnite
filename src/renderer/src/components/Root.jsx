import { BrowserRouter, Routes, Route, Navigate, NavLink } from 'react-router-dom';
import Library from './Library';
import Record from './Record';

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