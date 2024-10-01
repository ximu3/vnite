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
    const { alert, setAlert } = useBatchAddGame();
    function quit() {
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
    const { batchAddGameData, setBatchAddGameData, updateBatchAddGameData } = useBatchAddGame();
    return (
        <div className='flex flex-col h-full gap-5 w-270 min-w-170'>
            <div className='pb-3 text-2xl font-bold text-center text-custom-text-light'>扫描结果</div>
            <div className='overflow-x-auto h-100 scrollbar-base'>
                <table className="table bg-custom-stress table-pin-rows">
                    <thead className=''>
                        <tr className='text-custom-text-light bg-custom-stress'>
                            <th className='w-2/3'>原名</th>
                            <th>GID<span className='text-custom-text text-2xs'>（可选）</span></th>
                            <th>VID<span className='text-custom-text text-2xs'>（可选）</span></th>
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
                                            <td><input spellCheck='false' type="text" className='w-full min-h-0 border-0 outline-none input focus:bg-custom-focus focus:text-custom-text-light/95 bg-custom-stress input-sm hover:brightness-125 focus:shadow-inner-sm focus:shadow-black/80 focus:hover:brightness-100' value={game.name} onChange={(e) => { updateBatchAddGameData([index, ' name'], e.target.value) }} /></td>
                                            <td><input spellCheck='false' type="text" className='w-full min-h-0 border-0 outline-none input focus:bg-custom-focus focus:text-custom-text-light/95 bg-custom-stress input-sm hover:brightness-125 focus:shadow-inner-sm focus:shadow-black/80 focus:hover:brightness-100' value={game.gid} onChange={(e) => { updateBatchAddGameData([index, ' gid'], e.target.value) }} /></td>
                                            <td><input spellCheck='false' type="text" className='w-full min-h-0 border-0 outline-none input focus:bg-custom-focus focus:text-custom-text-light/95 bg-custom-stress input-sm hover:brightness-125 focus:shadow-inner-sm focus:shadow-black/80 focus:hover:brightness-100' value={game.vid} onChange={(e) => { updateBatchAddGameData([index, ' vid'], e.target.value) }} /></td>
                                        </tr>
                                    )
                                })
                        }
                    </tbody>
                </table>
            </div>
            <div className='flex flex-row-reverse items-end gap-5 pt-3'>
                <button className='transition-all btn bg-custom-stress text-custom-text-light hover:brightness-125' onClick={() => { }}>下一步</button>
                <button className='transition-all btn bg-custom-stress text-custom-text-light hover:brightness-125' onClick={() => { }}>上一步</button>
            </div>
        </div>
    )
}

