import React, { useState, useEffect, useMemo } from 'react';
import { Routes, Route, Navigate, NavLink } from 'react-router-dom';
import Game from './Game';
import { useRootStore } from './Root';
import PosterWall from './PosterWall';
import CategoryTree from './CategoryTree';
import ContextMenu from './ContextMenu';

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
  const { data, icons, setIcons, timestamp, setData, setTimestamp, setAlert, categoryData, setCategoryData } = useRootStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [contextMenu, setContextMenu] = useState(null);
  const dragRef = React.useRef(null);

  useEffect(() => {
    dragRef.current.addEventListener('drop', (event) => {
      event.preventDefault();
      event.stopPropagation();
      const files = event.dataTransfer.files;
      if (files.length > 0) {
        const file = files[0];
        if (file.name.endsWith('.exe') || file.name.endsWith('.bat')) {
          window.electron.ipcRenderer.send('organize-game-data-empty', file.path);
        } else {
          setAlert('不支持的文件类型！');
          setTimeout(() => {
            setAlert('');
          }, 3000);
        }
      }
    });
    dragRef.current.addEventListener('dragover', (event) => {
      event.preventDefault();
      event.stopPropagation();
    });
    window.electron.ipcRenderer.on('game-data-organized', (event, gameData) => {
      setData(gameData);
      setTimestamp(Date.now());
    });
    return () => {
      window.electron.ipcRenderer.removeAllListeners('game-data-organized');
    }
  }, []);

  useEffect(() => {
    async function loadImages() {
      setIcons({});
      const iconPaths = await Promise.all(
        Object.entries(data || {}).map(async ([key, game]) => {
          if (!game?.detail?.icon) {
            return [key, null];
          }
          const path = await window.electron.ipcRenderer.invoke('get-data-path', game.detail.icon);
          return [key, path];
        })
      );
      setIcons(Object.fromEntries(iconPaths));
    }
    loadImages();
  }, [data]);

  const filteredGames = useMemo(() => {
    return Object.entries(data).filter(([key, game]) => {
      const searchTermLower = searchTerm.toLowerCase();
      const mainNameMatch =
        game.detail?.chineseName?.toLowerCase().includes(searchTermLower) ||
        game.detail?.name?.toLowerCase().includes(searchTermLower);
      const extensionNameMatch = game.detail?.extensionName?.some(alias =>
        alias.toLowerCase().includes(searchTermLower)
      );
      return mainNameMatch || extensionNameMatch;
    });
  }, [data, searchTerm]);

  const [categoryId, setCategoryId] = useState(null);

  const handleCategoryContextMenu = (e, categoryId) => {
    e.preventDefault();
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      options: [
        {
          label: '删除分类',
          onClick: () => {
            if (categoryId === '0') {
              setAlert('无法删除默认分类！');
              setTimeout(() => {
                setAlert('');
              }, 3000);
              return;
            }
            document.getElementById('deleteCategory').showModal()
            setCategoryId(categoryId);
          },
        },
        {
          label: '上移',
          onClick: () => {
            window.electron.ipcRenderer.send('move-category-up', categoryId);
          }
        },
        {
          label: '下移',
          onClick: () => {
            window.electron.ipcRenderer.send('move-category-down', categoryId);
          }
        }
      ],
    });
  };

  const handleGameContextMenu = (e, gameId, categoryId) => {
    e.preventDefault();
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      options: [
        {
          label: '添加至',
          onClick: () => {
            document.getElementById('addGameToCategory').showModal();
            setGameId(gameId);
          },
        },
        {
          label: '移除',
          onClick: () => {
            if (categoryId === 0) {
              setAlert('无法将游戏从默认分类移除！');
              setTimeout(() => {
                setAlert('');
              }, 3000);
              return;
            }
            document.getElementById('deleteGameFromCategory').showModal();
            setCategoryId(categoryId);
            setGameId(gameId);
          },
        },
        {
          label: '上移',
          onClick: () => {
            window.electron.ipcRenderer.send('move-game-up', categoryId, gameId);
          }
        },
        {
          label: '下移',
          onClick: () => {
            window.electron.ipcRenderer.send('move-game-down', categoryId, gameId);
          }
        }
      ],
    });
  };

  const handleTopCategoryContextMenu = (e) => {
    e.preventDefault();
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      options: [
        {
          label: '添加分类',
          onClick: () => document.getElementById('addCategory').showModal(),
        },
      ],
    });
  };

  const [newCategoryName, setNewCategoryName] = useState('');
  const [gameId, setGameId] = useState(null);

  const addCategory = () => {
    window.electron.ipcRenderer.send('add-new-category', newCategoryName);
    document.getElementById('addCategory').close();
    setNewCategoryName('');
    console.log('添加分类');
  };

  const deleteCategory = () => {
    window.electron.ipcRenderer.send('delete-category', categoryId);
    document.getElementById('deleteCategory').close();
    setCategoryId(null);
    console.log('删除分类', categoryId);
  };

  const addGameToCategory = () => {
    window.electron.ipcRenderer.send('add-new-game-in-category', categoryId, gameId);
    document.getElementById('addGameToCategory').close();
    setCategoryId(null);
    setGameId(null);
    console.log('移动游戏', gameId);
  };

  const deleteGameFromCategory = () => {
    // 实现移除游戏的逻辑
    window.electron.ipcRenderer.send('delete-game-from-category', categoryId, gameId);
    document.getElementById('deleteGameFromCategory').close();
    setCategoryId(null);
    setGameId(null);
    console.log('移除游戏', gameId, '从分类', categoryId);
  };

  //获取分类名
  const getCategoryName = () => {
    const category = categoryData.find(category => category.id === categoryId);
    return category?.name || '未分类';
  };

  return (
    <div ref={dragRef} className="flex flex-row w-full h-full">
      <dialog id="addCategory" className="modal">
        <div className="w-1/3 h-auto modal-box bg-custom-modal">
          <form method="dialog">
            {/* if there is a button in form, it will close the modal */}
            {/* <button className="absolute btn btn-sm btn-ghost right-2 top-2">✕</button> */}
          </form>
          <div className='w-full h-full p-1 pt-3'>
            <div className='flex flex-row items-center justify-between'>
              <div className='text-sm text-custom-text-light'>分类名</div>
              <label className="flex items-center w-3/4 gap-2 border-0 input-sm input bg-custom-stress focus-within:outline-none hover:brightness-125 focus-within:border-0 focus-within:shadow-inner-sm focus-within:shadow-black focus-within:bg-custom-focus focus-within:text-custom-text-light/95 focus-within:hover:brightness-100">
                <input type='text' placeholder='' spellCheck='false' className='grow' value={newCategoryName} onChange={(e) => { setNewCategoryName(e.target.value) }} />
              </label>
            </div>
            <div className='flex flex-row-reverse gap-5 pt-7'>
              <button className='min-w-0 min-h-0 p-0 m-0 text-xs transition-all h-9 w-13 btn bg-custom-stress text-custom-text-light hover:brightness-125' onClick={() => { document.getElementById('addCategory').close() }}>取消</button>
              <button className='min-w-0 min-h-0 p-0 m-0 text-xs transition-all h-9 w-13 btn bg-custom-stress text-custom-text-light hover:brightness-125' onClick={() => { addCategory() }} >确定</button>
            </div>
          </div>
        </div>
      </dialog>
      <dialog id="deleteCategory" className="modal">
        <div className="w-1/2 h-auto modal-box bg-custom-modal">
          <form method="dialog">
            {/* if there is a button in form, it will close the modal */}
            {/* <button className="absolute btn btn-sm btn-ghost right-2 top-2">✕</button> */}
          </form>
          <div className='w-full h-full p-1 pt-3'>
            <div className='flex flex-row items-center justify-between'>
              <div className='text-sm font-bold text-custom-text-light'>确定要删除该分类吗？</div>
            </div>
            <div className='flex flex-row-reverse gap-5 pt-7'>
              <button className='min-w-0 min-h-0 p-0 m-0 text-xs transition-all h-9 w-13 btn bg-custom-stress text-custom-text-light hover:brightness-125' onClick={() => { document.getElementById('deleteCategory').close() }}>取消</button>
              <button className='min-w-0 min-h-0 p-0 m-0 text-xs transition-all h-9 w-13 btn bg-custom-stress text-custom-text-light hover:bg-custom-red' onClick={() => { deleteCategory() }} >确定</button>
            </div>
          </div>
        </div>
      </dialog>
      <dialog id="deleteGameFromCategory" className="modal">
        <div className="w-1/3 h-auto modal-box bg-custom-modal">
          <form method="dialog">
            {/* if there is a button in form, it will close the modal */}
            {/* <button className="absolute btn btn-sm btn-ghost right-2 top-2">✕</button> */}
          </form>
          <div className='w-full h-full p-1 pt-3'>
            <div className='flex flex-row items-center justify-between'>
              <div className='flex items-center text-sm font-bold text-custom-text-light'>
                <span className=''>确定要将游戏</span><span className='m-1.5 underline'> {data[gameId]?.detail?.chineseName || data[gameId]?.detail?.name} </span><span className=''>从分类</span><span className='m-1.5 underline'> {getCategoryName()} </span><span className='font-bold'>中移除吗？</span>
              </div>
            </div>
            <div className='flex flex-row-reverse gap-5 pt-7'>
              <button className='min-w-0 min-h-0 p-0 m-0 text-xs transition-all h-9 w-13 btn bg-custom-stress text-custom-text-light hover:brightness-125' onClick={() => { document.getElementById('deleteGameFromCategory').close() }}>取消</button>
              <button className='min-w-0 min-h-0 p-0 m-0 text-xs transition-all h-9 w-13 btn bg-custom-stress text-custom-text-light hover:bg-custom-red' onClick={() => { deleteGameFromCategory() }} >确定</button>
            </div>
          </div>
        </div>
      </dialog>
      <dialog id="addGameToCategory" className="modal">
        <div className="w-1/4 h-auto modal-box bg-custom-modal">
          <form method="dialog">
            {/* if there is a button in form, it will close the modal */}
            {/* <button className="absolute btn btn-sm btn-ghost right-2 top-2">✕</button> */}
          </form>
          <div className='flex flex-col items-center justify-center w-full h-full p-1 pt-3'>
            <div className='pb-2 text-sm font-bold text-center'>请选择分类</div>
            <div className='flex flex-col items-center justify-center w-4/5 mt-2 overflow-auto text-sm divide-black max-h-100 bg-custom-stress divide-y-1 scrollbar-base'>
              <button className='flex items-center justify-center w-full p-2 cursor-pointer bg-custom-stress hover:brightness-125' onClick={() => document.getElementById('addCategory').showModal()}><span className="w-4 h-4 icon-[cil--plus] pr-6">+</span></button>
              {
                categoryData
                  .filter(category => category.id !== 0)
                  .map(category => {
                    return (
                      <div
                        key={category.id}
                        className={categoryId === category.id ? 'flex justify-center w-full items-center p-2 cursor-pointer bg-custom-blue-4/60' : 'text-center w-full flex items-center justify-center p-2 cursor-pointer'}
                        onClick={() => { setCategoryId(category.id) }}
                      >
                        <div>{category.name}</div>
                      </div>
                    )
                  })
              }
            </div>
            <div className='flex flex-row-reverse gap-5 pt-7'>
              <button className='min-w-0 min-h-0 p-0 m-0 text-xs transition-all h-9 w-13 btn bg-custom-stress text-custom-text-light hover:brightness-125' onClick={() => {
                document.getElementById('addGameToCategory').close()
                setCategoryId(null)
              }}>取消</button>
              <button className='min-w-0 min-h-0 p-0 m-0 text-xs transition-all h-9 w-13 btn bg-custom-stress text-custom-text-light hover:brightness-125' onClick={() => { addGameToCategory() }} >确定</button>
            </div>
          </div>
        </div>
      </dialog>
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
        <div className="flex flex-col self-center object-center w-full overflow-auto grow scrollbar-base scrollbar-thumb-custom-text/70">
          <CategoryTree
            categories={categoryData}
            data={data}
            icons={icons}
            timestamp={timestamp}
            searchTerm={searchTerm}
            onCategoryContextMenu={handleCategoryContextMenu}
            onGameContextMenu={handleGameContextMenu}
          />
          <div className='pb-20 grow' onContextMenu={handleTopCategoryContextMenu}></div>
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
      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          options={contextMenu.options}
          onClose={() => setContextMenu(null)}
        />
      )}
    </div>
  );
}

export default Library;