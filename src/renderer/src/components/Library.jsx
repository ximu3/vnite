import { BrowserRouter, Routes, Route, Navigate, NavLink } from 'react-router-dom';
import Game from './Game';
import { useRootStore } from './Root';

function NavButton({ to, name }) {
  return (
    <NavLink className={({ isActive, isPending }) =>
      isPending
        ? ""
        : isActive
          ? "transition-none bg-gradient-to-r from-custom-blue-5 to-custom-blue-5/80 text-custom-text-light text-xs hover:bg-custom-blue-5 hover:brightness-125"
          : "transition-none active:bg-gradient-to-r active:from-custom-blue-5 active:to-custom-blue-5/80 hover:bg-gradient-to-r hover:from-custom-blue-5/50 hover:to-custom-blue-5/30 active:text-custom-text-light text-xs"
    }
      to={to}>
      {name}
    </NavLink>
  )

}

function Library() {
  const { data } = useRootStore();
  return (
    <div className="flex flex-row w-full h-full">
      <div className="flex flex-col h-full border-black border-r-0.5 border-l-0.5 w-72 shrink-0 bg-gradient-to-b from-custom-stress via-15% via-custom-blue-5/20 to-30% to-custom-main-2">
        <div className="flex flex-row w-full gap-2 p-2 pt-3 h-14">
          <label className="flex items-center min-w-0 min-h-0 gap-3 pl-3 border-0 h-9 input bg-custom-main-3 focus-within:outline-none group focus-within:shadow-inner focus-within:border-0 focus-within:shadow-black/80 hover:shadow-inner hover:shadow-black/80 focus-within:hover:brightness-100">
            <span className="icon-[material-symbols--search] w-7 h-7 text-custom-text-light"></span>
            <input type="text" className="min-w-0 min-h-0 grow focus:outline-transparent caret-custom-text-light" placeholder="Search" />
          </label>
          <button className='min-w-0 min-h-0 border-0 w-9 h-9 btn btn-square bg-custom-main-3' onClick={() => { document.getElementById('addGame').showModal() }}>
            <span className="icon-[ic--sharp-plus] w-8 h-8 text-custom-text hover:text-custom-text-light"></span>
          </button>
        </div>
        <div className="self-center object-center w-full grow">
          <ul className="w-full pl-0 menu rounded-box text-custom-text-light gap-0.5">
            {data.map((game, index) => {
              return <li key={index} className='transition-none'><NavButton to={`./${index}`} name={game.detail.chineseName ? game.detail.chineseName : game.detail.name} /></li>
            })
            }
            {/* <li><NavButton to={"./v1"} name={"v1"} /></li>
                    <li><NavButton to={"./v2"} name={"v2"} /></li> */}
          </ul>

        </div>
      </div>
      <div className="grow bg-custom-main">
        <Routes>
          <Route index element={<Navigate to='./0' />} />
          {data.map((game, index) => {
            return <Route key={index} path={`/${index}/*`} element={<Game index={index} />} />
          })
          }
        </Routes>
      </div>
    </div>
  );
}



export default Library;