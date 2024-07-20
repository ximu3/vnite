import { BrowserRouter, Routes, Route, Navigate, NavLink } from 'react-router-dom';
import Game from './Game';
import { useRootStore } from './Root';

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
  const { data } = useRootStore();
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
                    { data.map((game, index) => {
                        return <li key={index}><NavButton to={`./${index}`} name={game.detail.chineseName ? game.detail.chineseName : game.detail.name} /></li>
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
                { data.map((game, index) => {
                    return <Route key={index} path={`/${index}/*`} element={<Game index={index} />} />
                  })
                }
            </Routes>
        </div>
    </div>
  );
}



export default Library;