import { useStore, create } from 'zustand';
import { MemoryRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { useEffect, useRef } from 'react';
import { useRootStore } from './Root';


export const useBatchAddGame = create(set => ({
    alert: '',
    setAlert: (alert) => set({ alert }),
    batchAddGameData: [],
    setBatchAddGameData: (batchAddGameData) => set({ batchAddGameData }),
    updateBatchAddGameData: (path, value) => set((state) => {
        const newBatchAddGameData = JSON.parse(JSON.stringify(state.batchAddGameData));
        let current = newBatchAddGameData;
        for (let i = 0; i < path.length - 1; i++) {
            current = current[path[i]];
        }
        current[path[path.length - 1]] = value;
        return { batchAddGameData: newBatchAddGameData };
    }),
    addBatchAddGameData: (data) => set((state) => {
        const newBatchAddGameData = JSON.parse(JSON.stringify(state.batchAddGameData));
        newBatchAddGameData.push(data);
        return { batchAddGameData: newBatchAddGameData };
    }),
}));

export default function BatchAddGame() {
    const { alert, setAlert, setBatchAddGameData } = useBatchAddGame();
    function quit() {
        setBatchAddGameData([]);
        setAlert('');
    }
    return (
        <dialog id="batchAddGame" className="modal">
            <div className="w-auto h-auto max-w-full max-h-full modal-box bg-custom-modal">
                <form method="dialog">
                    {/* if there is a button in form, it will close the modal */}
                    <button className="absolute btn btn-sm btn-ghost right-2 top-2" onClick={quit}>✕</button>
                </form>
                <div className='w-full h-full p-6 pl-10 pr-10'>
                    <Routes>
                        <Route index element={<Navigate to={'/gameList'} />} />
                        <Route path='/gameList' element={<GameList />} />
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

function GameList() {
    let navigate = useNavigate();
    const { batchAddGameData, setBatchAddGameData, updateBatchAddGameData, setAlert } = useBatchAddGame();
    function deleteOneGame(index) {
        const newBatchAddGameData = JSON.parse(JSON.stringify(batchAddGameData));
        newBatchAddGameData.splice(index, 1);
        setBatchAddGameData(newBatchAddGameData);
    }
    async function addAllGame() {
        for (let i = 0; i < batchAddGameData.length; i++) {
            try {
                if (batchAddGameData[i].status === 'waiting') {
                    await addOneGame(i);
                }
            } catch (error) {
                continue
            }
        }
    }
    async function addOneGame(index) {
        try {
            updateBatchAddGameData([index, 'status'], 'loading');
            const game = batchAddGameData[index];
            if (game.name === '' && game.gid === '') {
                updateBatchAddGameData([index, 'status'], 'error');
                return;
            }
            if (game.gid) {
                let cover = ''
                let bg = ''
                if (!game.gid.toLowerCase().startsWith('ga')) {
                    setAlert('GID格式错误');
                    updateBatchAddGameData([index, 'status'], 'error');
                    return;
                }
                if (game.vid) {
                    cover = await window.api.getCoverByVID(game.vid);
                    const bgs = await window.api.getScreenshotsByVID(game.vid);
                    bg = bgs[0];
                } else {
                    cover = await window.api.getCoverByTitle(game.name);
                    const bgs = await window.api.getScreenshotsByTitle(game.name);
                    bg = bgs[0];
                }
                const gid = Number(game.gid.slice(2));
                const id = await window.electron.ipcRenderer.invoke('generate-id', game.name);
                await window.electron.ipcRenderer.invoke('add-new-game-to-data', id, cover, bg);
                await window.electron.ipcRenderer.invoke('organize-game-data-handle', gid, '', '', id);
            } else {
                let cover = ''
                let bg = ''
                const gameList = await window.api.searchGameList(game.name)
                const gid = gameList["data"]["result"][0]['id'];
                const gameName = gameList["data"]["result"][0]['name'];
                if (game.vid) {
                    cover = await window.api.getCoverByVID(game.gid);
                    const bgs = await window.api.getScreenshotsByVID(game.gid);
                    bg = bgs[0];
                } else {
                    cover = await window.api.getCoverByTitle(game.name);
                    const bgs = await window.api.getScreenshotsByTitle(game.name);
                    bg = bgs[0];
                }
                const id = await window.electron.ipcRenderer.invoke('generate-id', gameName);
                await window.electron.ipcRenderer.invoke('add-new-game-to-data', id, cover, bg);
                await window.electron.ipcRenderer.invoke('organize-game-data-handle', gid, '', '', id);
            }
            //add game
            updateBatchAddGameData([index, 'status'], 'success');
        } catch (error) {
            updateBatchAddGameData([index, 'status'], 'error');
            throw error;
        }
    }
    return (
        <div className='flex flex-col h-full gap-5 w-270 min-w-170'>
            <div className='pb-3 text-2xl font-bold text-center text-custom-text-light'>扫描结果</div>
            <div className='overflow-x-auto h-100 scrollbar-base'>
                <table className="table bg-custom-stress table-pin-rows">
                    <thead className=''>
                        <tr className='text-custom-text-light bg-custom-stress'>
                            <th className='w-1/3'>原名</th>
                            <th>GID<span className='text-custom-text text-2xs'>（可选）</span></th>
                            <th>VID<span className='text-custom-text text-2xs'>（可选）</span></th>
                            <th>操作</th>
                            <th>状态</th>
                        </tr>
                    </thead>
                    <tbody>
                        {
                            batchAddGameData.length === 0 ?
                                <tr>
                                    <td colSpan='6' className='text-center text-custom-text-light'>文件夹为空</td>
                                </tr>
                                :
                                batchAddGameData.map((game, index) => {
                                    return (
                                        <tr key={index} className='text-custom-text-light bg-custom-stress'>
                                            <td><input spellCheck='false' type="text" className='w-full min-h-0 border-0 outline-none input focus:bg-custom-focus focus:text-custom-text-light bg-custom-stress input-sm hover:brightness-125 focus:shadow-inner-sm focus:shadow-black/80 focus:hover:brightness-100' value={game.name} onChange={(e) => { updateBatchAddGameData([index, 'name'], e.target.value) }} /></td>
                                            <td><input spellCheck='false' type="text" className='w-full min-h-0 border-0 outline-none input focus:bg-custom-focus focus:text-custom-text-light bg-custom-stress input-sm hover:brightness-125 focus:shadow-inner-sm focus:shadow-black/80 focus:hover:brightness-100' value={game.gid} onChange={(e) => { updateBatchAddGameData([index, 'gid'], e.target.value) }} /></td>
                                            <td><input spellCheck='false' type="text" className='w-full min-h-0 border-0 outline-none input focus:bg-custom-focus focus:text-custom-text-light bg-custom-stress input-sm hover:brightness-125 focus:shadow-inner-sm focus:shadow-black/80 focus:hover:brightness-100' value={game.vid} onChange={(e) => { updateBatchAddGameData([index, 'vid'], e.target.value) }} /></td>
                                            <td>
                                                {
                                                    game.status === 'waiting' ?
                                                        <div className='flex flex-row gap-2'>
                                                            <button className='h-6 min-h-0 text-xs font-thin border-0 btn bg-custom-blue-4/20 text-custom-text-light hover:brightness-125' onClick={() => { addOneGame(index) }}>添加</button>
                                                            <button className='h-6 min-h-0 text-xs font-thin border-0 btn bg-custom-blue-4/20 text-custom-text-light hover:bg-custom-red' onClick={() => { deleteOneGame(index) }}>删除</button>
                                                        </div>
                                                        :
                                                        game.status === 'success' ?
                                                            <div className='flex flex-row gap-2'>
                                                                已完成
                                                            </div>
                                                            :
                                                            game.status === 'error' ?
                                                                <div className='flex flex-row gap-2'>
                                                                    <button className='h-6 min-h-0 text-xs font-thin border-0 btn bg-custom-blue-4/20 text-custom-text-light hover:brightness-125' onClick={() => { addOneGame(index) }}>重试</button>
                                                                    <button className='h-6 min-h-0 text-xs font-thin border-0 btn bg-custom-blue-4/20 text-custom-text-light hover:bg-custom-red' onClick={() => { deleteOneGame(index) }}>删除</button>
                                                                </div>
                                                                :
                                                                <div className='flex flex-row gap-2'>
                                                                    <progress className="w-full progress"></progress>
                                                                </div>
                                                }
                                            </td>
                                            <td>
                                                {
                                                    //success, waiting, error, loading
                                                    game.status === 'success' ?
                                                        <div className='flex flex-row items-center justify-center gap-2'>
                                                            <div className='w-3 h-3 rounded-full bg-custom-green'></div>
                                                            <span>添加成功</span>
                                                        </div>
                                                        :
                                                        game.status === 'waiting' ?
                                                            <div className='flex flex-row items-center justify-center gap-2'>
                                                                <div className='w-3 h-3 rounded-full bg-custom-blue-4'></div>
                                                                <span>等待添加</span>
                                                            </div>
                                                            :
                                                            game.status === 'error' ?
                                                                <div className='flex flex-row items-center justify-center gap-2'>
                                                                    <div className='w-3 h-3 rounded-full bg-custom-red'></div>
                                                                    <span>错误</span>
                                                                </div>
                                                                :
                                                                <div className='flex flex-row items-center justify-center gap-2'>
                                                                    <div className='w-3 h-3 bg-yellow-500 rounded-full'></div>
                                                                    <span>添加中</span>
                                                                </div>
                                                }
                                            </td>
                                        </tr>
                                    )
                                })
                        }
                    </tbody>
                </table>
            </div>
            <div className='flex flex-row-reverse items-end gap-5 pt-3'>
                <button className='transition-all btn bg-custom-stress text-custom-text-light hover:brightness-125' onClick={() => { addAllGame() }}>全部添加</button>
            </div>
        </div>
    )
}

