import { useStore, create } from 'zustand';
import { MemoryRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { useEffect, useRef } from 'react';
import { useRootStore } from './Root';

export const useUpdateGame = create(set => ({
    gameName: '',
    gid: '',
    id: '',
    vid: '',
    alert: '',
    gameList: [],
    isLoading: false,
    gamePath: '',
    savePath: '',
    gameBgList: [],
    gameBg: '',
    addGameLog: ['[start] 开始处理游戏数据'],
    isError: false,
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
    setIsError: (isError) => set({ isError }),
    setId: (id) => set({ id }),
}));



function UpdateGame() {
    const { alert, setGameName, setGameList, setGID, setVID, isLoading, setAlert, setGameBg, setGameBgList, setSavePath, setGamePath, setAddGameLog, setIsLoading } = useUpdateGame();
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
            setIsLoading(false);
            setAddGameLog(['[start] 开始处理游戏数据']);
            navigate('/info');
        }, 1000);
    }
    return (
        <dialog id="updateGame" className="modal">
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
    const { gameName, gid, vid, setGameName, setGID, setVID, setAlert, setGameList, isLoading, setIsLoading, setGameBgList } = useUpdateGame();
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
                    let GameName = ""
                    await window.electron.ipcRenderer.invoke('get-game-name', Gid).then((name) => {
                        setGameName(name);
                        GameName = name;
                    })
                    let gameBgList = [];
                    if (vid) {
                        gameBgList = await window.api.getScreenshotsByVID(vid);
                    } else {
                        gameBgList = await window.api.getScreenshotsByTitle(GameName);
                    }
                    setGameBgList(gameBgList);
                    navigate('/bg');
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
                document.getElementById('discernup').click();
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
                    <input type="text" spellCheck='false' name='gid' className="grow" placeholder="月幕Galgame档案id，带GA" value={gid} onChange={(e) => { setGID(e.target.value) }} />
                    <span className="border-0 badge bg-custom-blue-6 text-custom-text-light">可选</span>
                </label>
                <label className="flex items-center w-full gap-2 border-0 input-sm input bg-custom-stress focus-within:outline-none hover:brightness-125 focus-within:border-0 focus-within:shadow-inner-sm focus-within:shadow-black focus-within:bg-custom-focus focus-within:text-custom-text-light/95 focus-within:hover:brightness-100">
                    <div className='font-semibold'>VID |</div>
                    <input type="text" spellCheck='false' name='gid' className="grow" placeholder="VNDB id，带v" value={vid} onChange={(e) => { setVID(e.target.value) }} />
                    <span className="border-0 badge bg-custom-blue-6 text-custom-text-light">可选</span>
                </label>
                <div className='pt-1'>填写&nbsp;<span className='bg-custom-blue-6 text-custom-text-light'> GID </span>&nbsp;项可大幅提高识别正确率。</div>
            </div>
            <button id='discernup' className='w-full h-10 transition-all mt-9 btn bg-custom-stress text-custom-text-light hover:brightness-125' onClick={submitInfo}>
                {isLoading && <span className='loading loading-spinner'></span>}
                识别
            </button>
        </div>
    )
}

function GameList() {
    let navigate = useNavigate();
    const { gid, gameList, setGID, setGameName, setGameBgList, gameName, setIsLoading, isLoading, setAlert, vid } = useUpdateGame();
    async function next() {
        if (gameList.length === 0) {
            setAlert('未找到相关游戏，请重新填写！');
            setTimeout(() => { setAlert(''); }, 3000);
            return
        }
        setIsLoading(true);
        let gameBgList = [];
        if (vid) {
            gameBgList = await window.api.getScreenshotsByVID(vid);
        } else {
            gameBgList = await window.api.getScreenshotsByTitle(gameName);
        }
        setGameBgList(gameBgList);
        navigate('/bg');
        setIsLoading(false);
    }
    return (
        <div className='flex flex-col w-full h-full gap-5 min-w-170'>
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
                                        <tr className={gid === gameData["id"] ? "bg-custom-blue-4/50 text-custom-text-light" : ""} key={index} onClick={() => {
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
                <button className='transition-all btn bg-custom-stress text-custom-text-light hover:brightness-125' onClick={next}>
                    {isLoading && <span className='loading loading-spinner'></span>}
                    下一步
                </button>
                <button className='transition-all btn bg-custom-stress text-custom-text-light hover:brightness-125' onClick={() => { navigate(-1) }}>上一步</button>
            </div>
        </div>
    )
}

function GameBg() {
    const { gameBgList, gameName, savePath, isLoading, gamePath, setGameBg, gameBg, gid, setIsLoading, id, vid } = useUpdateGame();
    let navigate = useNavigate();
    async function submitAllData() {
        try {
            if (gameBg === '' && gameBgList.length !== 0) {
                setAlert('请选择背景图！');
                setTimeout(() => { setAlert(''); }, 3000);
                return
            }
            setIsLoading(true);
            let coverUrl = '';
            if (vid) {
                coverUrl = await window.api.getCoverByVID(vid);
            } else {
                coverUrl = await window.api.getCoverByTitle(gameName);
            }
            await window.electron.ipcRenderer.invoke('add-new-game-to-data', id, coverUrl, gameBg);
            await window.electron.ipcRenderer.send('update-game-meta-data', id, gid);
            navigate('/load')
        } catch (error) {
            console.log(error)
        }
    }
    return (
        <div className='h-full w-270'>
            <div className='pb-5 text-2xl font-bold text-center text-custom-text-light'>选择背景图</div>
            {gameBgList.length === 0 ? <div className='text-custom-text-light'>未找到相关背景图</div> :
                < div className='overflow-x-auto h-120 scrollbar-base'>
                    <div className='flex flex-wrap gap-3'>
                        {
                            gameBgList.map((bg, index) => {
                                return (
                                    <div key={index} className={gameBg === bg ? 'w-86 p-3 bg-custom-blue-4/50' : 'w-86 p-3 bg-custom-stress'} onClick={() => { setGameBg(bg) }}>
                                        <img src={bg} alt={index} className='w-full h-auto' />
                                    </div>
                                )
                            })
                        }
                    </div>
                </div>
            }
            <div className='flex flex-row-reverse items-end gap-5 pt-5'>
                <button className='transition-all btn bg-custom-stress text-custom-text-light hover:brightness-125' onClick={submitAllData}>
                    {isLoading && <span className='loading loading-spinner'></span>}
                    确定
                </button>
                <button className='transition-all btn bg-custom-stress text-custom-text-light hover:brightness-125' onClick={() => { navigate(-1) }}>上一步</button>
            </div>
        </div >
    )
}

function GameLoad() {
    const { setData, setTimestamp } = useRootStore();
    const { isLoading, setIsLoading, addGameLog, setAddGameLog, setId, id, updateAddGameLog, gid, isError, setIsError, setSavePath, setGID, setGameBg, setGameBgList, setGameList, setGameName, setGamePath } = useUpdateGame();
    const logContainerRef = useRef(null);
    let navigate = useNavigate();
    useEffect(() => {
        if (logContainerRef.current) {
            logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
        }
    }, [addGameLog]);
    useEffect(() => {
        window.electron.ipcRenderer.on('game-data-updated', (event, gameData) => {
            setIsLoading(false);
            setTimestamp(Date.now());
        })
        window.electron.ipcRenderer.on('add-game-log', (event, log) => {
            if (log.startsWith('[error]')) {
                setIsLoading(false);
                setIsError(true);
            }
            updateAddGameLog(log);
        })
        return () => {
            window.electron.ipcRenderer.removeAllListeners('game-data-organized');
            window.electron.ipcRenderer.removeAllListeners('add-game-log');
        }
    }, [])
    function back() {
        setIsError(false);
        setIsLoading(false);
        setSavePath('');
        setGID('');
        setGameBg('');
        setGameBgList([]);
        setGameList([]);
        setGameName('');
        setGamePath('');
        setAddGameLog(['[start] 开始处理游戏数据']);
        navigate('/info');
    }
    function retry() {
        setIsError(false);
        setIsLoading(true);
        window.electron.ipcRenderer.send('update-game-data', gid, id);
        setAddGameLog(['[start] 开始处理游戏数据']);
    }
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
            {isError ? (
                <div className='flex flex-row-reverse items-end gap-5'>
                    <button className='transition-all btn bg-custom-stress text-custom-text-light hover:brightness-125' onClick={retry}>重试</button>
                    <button className='transition-all btn bg-custom-stress text-custom-text-light hover:brightness-125' onClick={back}>返回</button>
                </div>
            ) : (
                isLoading ? (
                    <progress className="w-140 progress"></progress>
                ) : (
                    <div className='text-2xl font-bold text-custom-text-light'>下载成功</div>
                )
            )}
        </div >
    )
}

export default UpdateGame