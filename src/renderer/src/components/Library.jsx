import { BrowserRouter, Routes, Route, Navigate, NavLink } from 'react-router-dom';
import Game from './Game';
import { useRootStore } from './Root';
import { useEffect, useState, useMemo } from 'react';
import PosterWall from './PosterWall';

function NavButton({ to, name, icon }) {
  return (
    <NavLink className={({ isActive, isPending }) =>
      isPending
        ? ""
        : isActive
          ? "transition-none p-1.5 pl-4 bg-gradient-to-r active:bg-gradient-to-r active:from-custom-blue-5 active:to-custom-blue-5/80 from-custom-blue-5 to-custom-blue-5/80 text-custom-text-light text-xs hover:bg-custom-blue-5 hover:brightness-125 focus:bg-transparent"
          : "transition-none p-1.5 pl-4 active:bg-gradient-to-r active:from-custom-blue-5 active:to-custom-blue-5/80 hover:bg-gradient-to-r hover:from-custom-blue-5/50 hover:to-custom-blue-5/30 active:text-custom-text-light text-xs focus:bg-transparent"
    }
      to={to}>
      {icon}
      <div className='overflow-hidden truncate'>
        {name}
      </div>
    </NavLink>
  )

}

function NavTab({ to, name, icon }) {
  return (
    <NavLink className={({ isActive, isPending }) =>
      isPending
        ? ""
        : isActive
          ? "h-9 flex flex-row gap-2 items-center justify-start bg-gradient-to-r active:bg-gradient-to-r active:from-custom-blue-5 active:to-custom-blue-5/80 from-custom-blue-5 to-custom-blue-5/80 hover:bg-custom-blue-5  focus:bg-transparent w-2/3 place-self-start p-2 text-custom-text-light text-sm transition-all"
          : "h-9 flex flex-row gap-2 items-center bg-custom-stress-1 justify-start text-custom-text active:bg-gradient-to-r active:from-custom-blue-5 active:to-custom-blue-5/80 hover:bg-gradient-to-r hover:from-custom-blue-5 hover:to-custom-blue-5/70 hover:text-custom-text-light active:text-custom-text-light focus:bg-transparent w-2/3 place-self-start p-2 text-sm transition-all"
    }
      to={to}>
      {icon}{name}
    </NavLink>
  )
}

function Library() {
  const { data, icons, setIcons, timestamp } = useRootStore();
  const [searchTerm, setSearchTerm] = useState('');
  useEffect(() => {
    async function loadImages() {
      setIcons({});
      const iconPaths = await Promise.all(
        Object.entries(data || {}).map(async ([key, game]) => {
          if (!game?.detail?.icon) {
            return [key, null];  // 如果icon为空，返回键和null值
          }
          const path = await window.electron.ipcRenderer.invoke('get-data-path', game.detail.icon);
          return [key, path];  // 返回键和路径
        })
      );
      setIcons(Object.fromEntries(iconPaths));  // 将结果转换回对象
    }
    loadImages();
  }, [data]);
  const filteredGames = useMemo(() => {
    return Object.entries(data).filter(([key, game]) => {
      const searchTermLower = searchTerm.toLowerCase();

      // 检查主要名称
      const mainNameMatch =
        game.detail?.chineseName?.toLowerCase().includes(searchTermLower) ||
        game.detail?.name?.toLowerCase().includes(searchTermLower);

      // 检查扩展名称（别名）数组
      const extensionNameMatch = game.detail?.extensionName?.some(alias =>
        alias.toLowerCase().includes(searchTermLower)
      );

      // 如果主要名称或任何别名匹配，则返回 true
      return mainNameMatch || extensionNameMatch;
    });
  }, [data, searchTerm]);
  return (
    <div className="flex flex-row w-full h-full">
      <div className="flex flex-col h-full border-black border-r-0.5 border-l-0.5 w-72 shrink-0 bg-gradient-to-b from-custom-stress-2 via-15% via-custom-blue-5/20 to-30% to-custom-main-2">
        <div className='flex flex-col items-center justify-start w-full'>
          <div className='w-full h-12 pt-2 pl-2 '>
            <NavTab to='./posterwall' name='主页' icon={<span className="icon-[icon-park-twotone--game-ps] w-5 h-5"></span>} />
          </div>
          <div className="flex flex-row w-full gap-2 p-2 h-14">
            <label className="flex items-center min-w-0 min-h-0 gap-3 pl-3 transition-all border-0 active:transition-none h-9 input bg-custom-stress-1 focus-within:outline-none group focus-within:shadow-inner focus-within:border-0 focus-within:shadow-black/80 hover:shadow-inner hover:shadow-black/80 focus-within:hover:brightness-100">
              <span className="icon-[material-symbols--search] w-7 h-7 text-custom-text-light"></span>
              <input type="text" className="min-w-0 min-h-0 grow focus:outline-transparent caret-custom-text-light" placeholder="" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
            </label>
            <button className='min-w-0 min-h-0 transition-all border-0 w-9 h-9 btn btn-square bg-custom-stress-1' onClick={() => { document.getElementById('addGame').showModal() }}>
              <span className="transition-all icon-[ic--sharp-plus] w-8 h-8 text-custom-text hover:text-custom-text-light"></span>
            </button>
          </div>
        </div>
        <div className="self-center object-center w-full grow">
          <ul className="w-full pl-0 pr-0 menu rounded-box text-custom-text-light gap-0.5">
            {searchTerm && (
              <div className="p-2 text-sm text-custom-text-light">
                找到 {filteredGames.length} 个结果
              </div>
            )}
            {filteredGames.map(([key, game], index) => {
              return (
                <li key={key} className='transition-none'>
                  <NavButton
                    to={`./${key}`}
                    name={game.detail.chineseName || game.detail.name}
                    icon={
                      icons[key]
                        ? <img src={`${icons[key]}?t=${timestamp}`} className='w-4.5 h-4.5' alt="" />
                        : <span className="icon-[mingcute--game-2-fill] w-4.5 h-4.5"></span>
                    }
                  />
                </li>
              );
            })}
          </ul>

        </div>
      </div>
      <div className="grow bg-custom-main">
        {
          Object.keys(data).length === 0 ?
            <div className="flex flex-row items-center justify-center w-full h-full">
              <div className="flex flex-col items-center justify-center gap-2">
                <span className="icon-[mingcute--game-2-fill] w-24 h-24"></span>
                <span className=" text-custom-text-light">{'暂无游戏，请点击下方按钮添加 ～(∠・ω< )⌒☆'}</span>
                <div className='pt-3'>
                  <button className='min-w-0 min-h-0 transition-all border-0 w-9 h-9 btn btn-square bg-custom-blue-6' onClick={() => { document.getElementById('addGame').showModal() }}>
                    <span className="transition-all icon-[ic--sharp-plus] w-8 h-8 text-custom-text-light hover:text-custom-text-light"></span>
                  </button>
                </div>
              </div>
            </div>
            :
            <Routes>
              <Route index element={<Navigate to={`./posterwall`} />} />
              {filteredGames.map(([key, game]) => {
                return <Route key={key} path={`/${key}/*`} element={<Game index={key} />} />
              })}
              <Route path={`/posterwall/*`} element={<PosterWall />} />
            </Routes>
        }
      </div>
    </div>
  );
}



export default Library;