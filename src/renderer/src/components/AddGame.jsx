import { useStore, create } from 'zustand';
import { MemoryRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { useEffect, useRef } from 'react';
import { useRootStore } from './Root';

export const useAddGame = create(set => ({
  gameName: '',
  gid: '',
  vid: '',
  alert: '',
  gameList: [],
  isLoading: false,
  gamePath: '',
  savePath: '',
  gameBgList: [],
  gameBg: '',
  addGameLog: ['[start] 开始处理游戏数据'],
  setGameName: (gameName) => set({ gameName }),
  setGID: (gid) => set({ gid }),
  setVID: (vid) => set({ vid }),
  setAlert: (alert) => set({ alert }),
  setGameList: (gameList) => set({ gameList }),
  setIsLoading: (isLoading) => set({ isLoading }),
  setGamePath: (gamePath) => set({ gamePath }),
  setSavePath: (savePath) => set({ savePath }),
  setGameBgList: (gameBgList) => set({ gameBgList }),
  setGameBg: (gameBg) => set({ gameBg }),
  setAddGameLog: (addGameLog) => set({ addGameLog }),
  updateAddGameLog: (log) => set(state => ({ addGameLog: [...state.addGameLog, log] })),
}));



function AddGame() {
  const { alert, setGameName, setGameList, setGID, setVID, isLoading, setAlert, setGameBg, setGameBgList, setSavePath, setGamePath, setAddGameLog } = useAddGame();
  let navigate = useNavigate();
  function quit() {
    if (isLoading) {
      setAlert('请等待操作完成！');
      setTimeout(() => { setAlert(''); }, 3000);
      return
    }
    setTimeout(() => {
      setGameName('');
      setGID('');
      setVID('');
      setGameList([]);
      setGameBgList([]);
      setGameBg('');
      setSavePath('');
      setGamePath('');
      setAddGameLog(['[start] 开始处理游戏数据']);
      navigate('/info');
    }, 1000);
  }
  return (
    <dialog id="addGame" className="modal">
      <div className="w-auto h-auto max-w-full max-h-full modal-box bg-custom-modal">
        <form method="dialog">
          {/* if there is a button in form, it will close the modal */}
          <button className="absolute btn btn-sm btn-ghost right-2 top-2" onClick={quit}>✕</button>
        </form>
        <div className='w-full h-full p-6 pl-10 pr-10'>
          <Routes>
            <Route index element={<Navigate to={'/info'} />} />
            <Route path='/info' element={<Info />} />
            <Route path='/list' element={<GameList />} />
            <Route path='/path' element={<GamePath />} />
            <Route path='/bg' element={<GameBg />} />
            <Route path='/load' element={<GameLoad />} />
          </Routes>
        </div>
        {alert &&
          <div className="toast toast-center">
            <div className="pr-0 alert bg-custom-blue-6">
              <span className='text-custom-text-light'>{alert}</span>
            </div>
          </div>
        }
      </div>
    </dialog>
  )
}

function Info() {
  let navigate = useNavigate();
  const { gameName, gid, vid, setGameName, setGID, setVID, setAlert, setGameList, isLoading, setIsLoading } = useAddGame();
  async function submitInfo() {
    setIsLoading(true);
    if (gameName === '' && gid === '') {
      setAlert('请填写游戏原名!');
      setTimeout(() => { setAlert(''); }, 3000);
      return
    }
    if (gid) {
      if (gid.toLowerCase().startsWith('ga')) {
        try {
          const Gid = Number(gid.slice(2));
          setGID(Number(gid.slice(2)));
          await window.electron.ipcRenderer.invoke('get-game-name', Gid).then((name) => {
            setGameName(name);
          })
          navigate('/path')
          setIsLoading(false);
          return
        } catch (error) {
          setAlert('GID不存在，请重新填写！');
          setTimeout(() => { setAlert(''); }, 3000);
          setIsLoading(false);
          return
        }
      } else {
        setAlert('GID格式错误，请重新填写！');
        setTimeout(() => { setAlert(''); }, 3000);
        setIsLoading(false);
        return
      }
    }
    const gameList = await window.api.searchGameList(gameName)
    setGameList(gameList["data"]["result"]);
    navigate('/list');
    setIsLoading(false);
  }
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'Enter') {
        // 模拟按钮点击
        document.getElementById('discern').click();
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    // 清理函数
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  return (
    <div className='h-full w-120'>
      <div className='pb-5 text-2xl font-bold text-center text-custom-text-light'>基本信息</div>
      <div className='flex flex-col gap-5'>
        <label className="flex items-center w-full gap-2 border-0 input-sm input bg-custom-stress focus-within:outline-none hover:brightness-125 focus-within:border-0 focus-within:shadow-inner-sm focus-within:shadow-black focus-within:bg-custom-focus focus-within:text-custom-text-light/95 focus-within:hover:brightness-100">
          <div className='font-semibold'>游戏名 |</div>
          <input type="text" spellCheck='false' name='gameName' className="grow" placeholder="推荐使用原名，请准确填写" value={gameName} onChange={(e) => { setGameName(e.target.value) }} />
        </label>
        <label className="flex items-center w-full gap-2 border-0 input-sm input bg-custom-stress focus-within:outline-none hover:brightness-125 focus-within:border-0 focus-within:shadow-inner-sm focus-within:shadow-black focus-within:bg-custom-focus focus-within:text-custom-text-light/95 focus-within:hover:brightness-100">
          <div className='font-semibold'>GID |</div>
          <input type="text" spellCheck='false' name='gid' className="grow" placeholder="月幕Galgame档案id，不带GA" value={gid} onChange={(e) => { setGID(e.target.value) }} />
          <span className="border-0 badge bg-custom-blue-6 text-custom-text-light">可选</span>
        </label>
        {/* <label className="flex items-center w-full gap-2 border-0 input-sm input bg-custom-stress focus-within:outline-none hover:brightness-125 focus-within:border-0 focus-within:shadow-inner-sm focus-within:shadow-black focus-within:bg-custom-focus focus-within:text-custom-text-light/95 focus-within:hover:brightness-100">
          <div className='font-semibold'>VID |</div>
          <input type="text" spellCheck='false' name='vid' className="grow" placeholder="VNDB档案id，不带v" value={vid} onChange={(e) => { setVID(e.target.value) }} />
          <span className="border-0 badge bg-custom-blue-6 text-custom-text-light">可选</span>
        </label> */}
        <div className='pt-1'>填写&nbsp;<span className='bg-custom-blue-6 text-custom-text-light'> GID </span>&nbsp;项可大幅提高识别正确率。</div>
      </div>
      <button id='discern' className='w-full h-10 transition-all mt-9 btn bg-custom-stress text-custom-text-light hover:brightness-125' onClick={submitInfo}>
        {isLoading && <span className='loading loading-spinner'></span>}
        识别
      </button>
    </div>
  )
}

function GameList() {
  let navigate = useNavigate();
  const { gid, gameList, setGID, setGameName } = useAddGame();
  return (
    <div className='flex flex-col w-full h-full gap-5'>
      <div className='pb-3 text-2xl font-bold text-center text-custom-text-light'>识别结果</div>
      <div className='overflow-x-auto h-100 scrollbar-base'>
        <table className="table bg-custom-stress table-pin-rows">
          <thead className=''>
            <tr className='text-custom-text-light bg-custom-stress'>
              <th>中文名</th>
              <th>原名</th>
              <th>GID</th>
              <th>发行时间</th>
              <th>开发商</th>
              <th>汉化</th>
            </tr>
          </thead>
          <tbody>
            {
              gameList.length === 0 ?
                <tr>
                  <td colSpan='6' className='text-center text-custom-text-light'>未找到相关游戏</td>
                </tr>
                :
                gameList.map((gameData, index) => {
                  return (
                    <tr className={gid === gameData["id"] ? "bg-custom-blue-4/20 text-custom-text-light" : ""} key={index} onClick={() => {
                      setGID(gameData["id"])
                      setGameName(gameData["name"])
                    }}>
                      <td>{gameData["chineseName"] ? gameData["chineseName"] : "无"}</td>
                      <td>{gameData["name"]}</td>
                      <td>{gameData["id"]}</td>
                      <td>{gameData["releaseDate"]}</td>
                      <td>{gameData["orgName"]}</td>
                      <td>{gameData["haveChinese"] ? "有" : "无"}</td>
                    </tr>
                  )
                })
            }
          </tbody>
        </table>
      </div>
      <div className='flex flex-row-reverse items-end gap-5 pt-3'>
        <button className='transition-all btn bg-custom-stress text-custom-text-light hover:brightness-125' onClick={() => { navigate('/path') }}>下一步</button>
        <button className='transition-all btn bg-custom-stress text-custom-text-light hover:brightness-125' onClick={() => { navigate(-1) }}>上一步</button>
      </div>
    </div>
  )
}

function GamePath() {
  const { gamePath, savePath, gameName, setGamePath, setSavePath, setAlert, setIsLoading, setGameBgList, isLoading, gid } = useAddGame();
  let navigate = useNavigate();

  async function selectGamePath() {
    const path = await window.electron.ipcRenderer.invoke("open-file-dialog")
    setGamePath(path);
    if (path !== '') {
      await window.electron.ipcRenderer.invoke('get-game-icon', path, gid);
    }
  }

  async function selectSavePath() {
    const path = await window.electron.ipcRenderer.invoke("open-file-folder-dialog")
    setSavePath(path);
  }

  function handleDragOver(e) {
    e.preventDefault();
  }

  async function getGamePathByDrag(e) {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 1) {
      setAlert('只能选择一个路径！');
      setTimeout(() => { setAlert(''); }, 3000);
      return
    }
    const file = files[0];
    const fileExtension = file.name.split('.').pop();
    if (fileExtension !== 'exe') {
      setAlert('请选择可执行文件！');
      setTimeout(() => { setAlert(''); }, 3000);
      return
    }
    await window.electron.ipcRenderer.invoke('get-game-icon', path, gid);
    setGamePath(file.path);
  }

  function getSavePathByDrag(e) {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 1) {
      setAlert('只能选择一个路径！');
      setTimeout(() => { setAlert(''); }, 3000);
      return
    }
    setSavePath(files[0].path);
  }

  async function submitGamePath() {
    setIsLoading(true);
    const gameBgList = await window.api.getScreenshotsByTitle(gameName);
    setGameBgList(gameBgList);
    navigate('/bg');
    setIsLoading(false);
  }

  return (
    <div className='flex flex-col gap-5 w-140 h-77'>
      <div className='pb-3 text-2xl font-bold text-center text-custom-text-light'>选择路径</div>
      <div className='flex flex-row'>
        <button className='transition-all btn bg-custom-stress border-1 border-custom-stress text-custom-text-light hover:brightness-125 no-animation' onClick={selectGamePath}>选择游戏路径</button>
        <input type='text' placeholder='拖拽获取路径' onDrop={getGamePathByDrag} onDragOver={handleDragOver} className='w-full border-0 hover:brightness-125 input bg-custom-stress focus-within:outline-none focus-within:border-0 focus-within:shadow-inner-sm focus-within:shadow-black focus-within:bg-custom-focus focus-within:hover:brightness-100 focus-within:text-custom-text-light/95' value={gamePath} onChange={(e) => { setGamePath(e.target.value) }} />
      </div>
      <div className='flex flex-row'>
        <button className='transition-all btn bg-custom-stress border-1 border-custom-stress text-custom-text-light hover:brightness-125 no-animation' onClick={selectSavePath}>选择存档路径</button>
        <input type='text' placeholder='拖拽获取路径' onDrop={getSavePathByDrag} onDragOver={handleDragOver} className='w-full border-0 hover:brightness-125 input bg-custom-stress focus-within:outline-none focus-within:border-0 focus-within:shadow-inner-sm focus-within:shadow-black focus-within:bg-custom-focus focus-within:hover:brightness-100 focus-within:text-custom-text-light/95' value={savePath} onChange={(e) => { setSavePath(e.target.value) }} />
      </div>
      <div className='pt-1'>可暂时跳过此步，后续可在该游戏设置页填写</div>
      <div className='flex flex-row-reverse items-end gap-5 pt-3'>
        <button className='transition-all btn bg-custom-stress text-custom-text-light hover:brightness-125' onClick={submitGamePath}>
          {isLoading && <span className='loading loading-spinner'></span>}下一步</button>
        <button className='transition-all btn bg-custom-stress text-custom-text-light hover:brightness-125' onClick={() => { navigate(-1) }}>上一步</button>
      </div>
    </div>
  )
}

function GameBg() {
  const { gameBgList, gameName, savePath, isLoading, gamePath, setGameBg, gameBg, gid, setIsLoading } = useAddGame();
  let navigate = useNavigate();
  async function submitAllData() {
    if (gameBg === '') {
      setAlert('请选择背景图！');
      setTimeout(() => { setAlert(''); }, 3000);
      return
    }
    setIsLoading(true);
    const coverUrl = await window.api.getCoverByTitle(gameName);
    await window.electron.ipcRenderer.send('add-new-game-to-data', gid, coverUrl, gameBg);
    await window.electron.ipcRenderer.send('organize-game-data', gid, savePath, gamePath);
    navigate('/load')
  }
  return (
    <div className='h-full w-270'>
      <div className='pb-5 text-2xl font-bold text-center text-custom-text-light'>选择背景图</div>
      <div className='overflow-x-auto h-120 scrollbar-base'>
        <div className='flex flex-wrap gap-3'>
          {
            gameBgList.map((bg, index) => {
              return (
                <div key={index} className={gameBg === bg ? 'w-86 p-3 bg-custom-blue-4/20' : 'w-86 p-3 bg-custom-stress'} onClick={() => { setGameBg(bg) }}>
                  <img src={bg} alt={index} className='w-full h-auto' />
                </div>
              )
            })
          }
        </div>
      </div>
      <div className='flex flex-row-reverse items-end gap-5 pt-5'>
        <button className='transition-all btn bg-custom-stress text-custom-text-light hover:brightness-125' onClick={submitAllData}>确定</button>
        <button className='transition-all btn bg-custom-stress text-custom-text-light hover:brightness-125' onClick={() => { navigate(-1) }}>上一步</button>
      </div>
    </div>
  )
}

function GameLoad() {
  const { setData } = useRootStore();
  const { isLoading, setIsLoading, addGameLog, setAddGameLog, updateAddGameLog } = useAddGame();
  const logContainerRef = useRef(null);
  useEffect(() => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [addGameLog]); // 每当日志更新时执行
  useEffect(() => {
    window.electron.ipcRenderer.on('game-data-organized', (event, gameData) => {
      setIsLoading(false);
      setData(gameData);
    })
    window.electron.ipcRenderer.on('add-game-log', (event, log) => {
      updateAddGameLog(log);
    })
    return () => {
      window.electron.ipcRenderer.removeAllListeners('game-data-organized');
      window.electron.ipcRenderer.removeAllListeners('add-game-log');
    }
  }, [])
  return (
    <div className='flex flex-col items-center justify-center gap-9 w-165 h-140'>
      <div ref={logContainerRef} className='flex flex-col items-start w-11/12 gap-1 p-3 overflow-auto bg-custom-stress h-5/6 scrollbar-base'>
        {
          addGameLog.map((log, index) => {
            return (
              <div key={index} className='text-custom-text'>{log}</div>
            )
          })
        }
      </div>
      {isLoading ? <progress className="w-140 progress"></progress> : <div className='text-2xl font-bold text-custom-text-light'>添加成功</div>}
    </div>
  )
}

export default AddGame