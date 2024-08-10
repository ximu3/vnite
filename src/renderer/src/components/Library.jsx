import { BrowserRouter, Routes, Route, Navigate, NavLink } from 'react-router-dom';
import Game from './Game';
import { useRootStore } from './Root';

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

function Library() {
  const { data } = useRootStore();
  return (
    <div className="flex flex-row w-full h-full">
      <div className="flex flex-col h-full border-black border-r-0.5 border-l-0.5 w-72 shrink-0">
        <div className="flex-row w-full gap-2 p-2 h-14 bg-custom-main-2">
          <label className="flex items-center h-10 gap-2 shadow-xl border-1 border-custom-text/5 input focus-within:outline-none focus-within:shadow-inner bg-custom-main-3">
            <span className="icon-[material-symbols-light--search] w-6 h-6 text-custom-text"></span>
            <input type="text" className="grow focus:outline-transparent caret-custom-text-light" placeholder="Search" />
          </label>
        </div>
        <div className="w-full grow bg-custom-main-2">
          <ul className="w-full menu rounded-box text-custom-text-light">
            {data.map((game, index) => {
              return <li key={index} className=''><NavButton to={`./${index}`} name={game.detail.chineseName ? game.detail.chineseName : game.detail.name} /></li>
            })
            }
            {/* <li><NavButton to={"./v1"} name={"v1"} /></li>
                    <li><NavButton to={"./v2"} name={"v2"} /></li> */}
          </ul>

        </div>
      </div>
      <div className="grow">
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