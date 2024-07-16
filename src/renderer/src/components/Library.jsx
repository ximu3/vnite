import { BrowserRouter, Routes, Route, Navigate, NavLink } from 'react-router-dom';
import Game from './Game';

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

function Library() {
  return (
    <div className="flex flex-row w-full h-full">
        <div className="flex flex-col h-full border-l-2 border-r-2 w-72 border-primary shrink-0">
            <div className="flex-row w-full gap-2 p-2 h-14">
                <label className="flex items-center h-10 gap-2 input input-bordered focus-within:outline-none focus-within:border-accent focus-within:border-2">
                    <input type="text" className="grow focus:outline-transparent" placeholder="Search" />
                </label>
            </div>
            <div className="w-full grow">
                <ul className="w-full menu rounded-box">
                    {/* <li className='pb-2'><button className='h-10 min-h-0 font-normal btn btn-secondary text-base-100'>Add</button></li> */}
                    <li><NavButton to={"./v1"} name={"v1"} /></li>
                    <li><NavButton to={"./v2"} name={"v2"} /></li>
                </ul>
                
            </div>
        </div>
        <div className="grow">
            <Routes>
                <Route index element={<Navigate to='./v1' />} />
                <Route path='/v1/*' element={<Game />} />
                <Route path='/v2/*' element={<div>v2</div>} />
            </Routes>
        </div>
    </div>
  );
}



export default Library;