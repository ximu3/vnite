import bg from '../assets/bg.webp'
import cover from '../assets/cover.webp'
import c1 from '../assets/c1.jpg'
import c2 from '../assets/c2.jpg'
import mem from '../assets/mem.webp'
import { Icon } from '@iconify/react/dist/iconify.js'
import { BrowserRouter, Routes, Route, Navigate, NavLink } from 'react-router-dom';
import { useRootStore } from './Root'
import { useEffect } from 'react'
import { create } from 'zustand'

function NavTab({to, name}){
    return (
    <NavLink className={({ isActive, isPending }) =>
      isPending
        ? "tab"
        : isActive
        ? "tab tab-active"
        : "tab"
    }
    to={to} role="tab">
      {name}
    </NavLink>
  )
}

function Game({index}) {
    const { data, setData, setAlert, updateData } = useRootStore();
    const gameData = data[index]['detail'];
    const characterData = data[index]['characters'];
    const { settingData, setSettingData } = useGameSetting();
    function getFormattedDate(date = new Date()) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        
        return `${year}-${month}-${day}`;
    }
    useEffect(() => {
        window.electron.ipcRenderer.on('game-start-result', (event, result) => {
        if (result.success) {
            return
        } else {
            setAlert(result.error);
            setTimeout(() => {setAlert('')}, 3000);
        }
        });

        window.electron.ipcRenderer.on('game-running-time', (event, { processId, runningTime }) => {
            if (processId === index) {
                updateData([index, 'detail', 'gameDuration'], data[index]['detail']['gameDuration'] + runningTime);
                updateData([index, 'detail', 'lastVisitDate'], getFormattedDate());
                if (runningTime >= 180){
                    updateData([index, 'detail', 'frequency'], data[index]['detail']['frequency'] + 1);
                }
            }else{
                return
            }
        });

        return () => {
            window.electron.ipcRenderer.removeAllListeners('exe-open-result');
            window.electron.ipcRenderer.removeAllListeners('exe-running-time');
        };
    }, []);
    function handleStart(){
        if (gameData['gamePath']) {
            window.electron.ipcRenderer.send('start-game', gameData['gamePath'], index)
        } else {
            setAlert('游戏路径未设置，请前往设置!')
            setTimeout(() => {setAlert('')}, 3000)
        }
    }
    function quitSetting(){
        setSettingData(data[index])
    }
    function formatTime(seconds) {
        if (seconds < 0) {
            return "无效时间";
        }
        
        if (seconds < 60) {
            return "小于一分钟";
        }
        
        const minutes = Math.floor(seconds / 60);
        const hours = minutes / 60;

        if (hours < 1) {
            return `${minutes}分钟`;
        } else {
            return `${hours.toFixed(1)}小时`;
        }
    }
    function convertStatus(status) {
        const statusMap = {
            0: "未开始",
            1: "游玩中",
            2: "已完成",
            3: "N周目"
        };
        
        return statusMap[status] || "未知状态";
    }
    return (
        <div className="flex flex-col w-full h-full overflow-auto scrollbar-base scrollbar-w-2">

            <dialog id="my_modal_2" className="modal">
                <div className="w-3/5 max-w-full max-h-full h-5/6 modal-box">
                <form method="dialog">
                    {/* if there is a button in form, it will close the modal */}
                    <button className="absolute btn btn-sm btn-ghost right-2 top-2" onClick={quitSetting}>✕</button>
                </form>
                    <div className='w-full h-full p-6 pl-10 pr-10'>
                        <Setting index={index} />
                    </div>
                </div>
            </dialog>
            
            <div className="relative w-full h-96">
                
                <img src={gameData['backgroundImage']} alt="bg" className="object-cover w-full h-full"></img>
                
                <div className="absolute inset-0 bg-gradient-to-b from-transparent to-base-100"></div>
                
                {/* <img alt="cover image" src={gameData['cover']} className="absolute z-10 object-cover w-56 h-auto transform border-2 right-16 lg:right-24 2xl:right-40 2xl:-bottom-60 -bottom-16 lg:-bottom-48 lg:w-64 2xl:w-80 border-primary"></img> */}
                
                {/* <div class="absolute right-16 lg:right-28 -bottom-16 lg:-bottom-40 transform w-56 h-72 lg:w-64 lg:h-96 bg-base-100 bg-opacity-15 z-20"></div> */}
           
                <div className="absolute flex flex-row gap-2 text-4xl font-bold left-14 -bottom-14">
                    {gameData['chineseName'] ? gameData['chineseName'] : gameData['name']}
                    <div className="self-center font-normal badge badge-outline badge-success">云存档：最新</div>
                    <div className="self-center font-normal badge badge-outline badge-accent">{convertStatus(gameData['playtStatus'])}</div>
                </div>
                <button className='absolute w-28 btn left-14 -bottom-32 btn-success' onClick={handleStart}>开始</button>
                <button className='absolute w-28 btn left-48 -bottom-32 btn-accent' onClick={()=>{document.getElementById('my_modal_2').showModal()}}>设置</button>

                {/* <div className="absolute z-0 w-full divider -bottom-44"></div> */}
                <div className="absolute z-0 flex flex-row items-center w-full pl-8 h-28 -bottom-67 ">
                    <div className="stats bg-base-300">
                        <div className="stat">
                            <div className="stat-figure text-secondary">
                                <span className="icon-[material-symbols-light--menu-open] w-14 h-14"></span>
                            </div>
                            <div className="stat-title">最后运行日期</div>
                            <div className="stat-value text-secondary">{gameData['lastVisitDate'] ? gameData['lastVisitDate'].replace(/-/g, '.') : "还未运行过"}</div>
                        </div>
                        <div className="stat">
                            <div className="flex items-center justify-center stat-figure text-secondary">
                                <span className="icon-[material-symbols-light--avg-time-outline-sharp] w-14 h-14"></span>
                            </div>
                            <div className="stat-title">游戏时长</div>
                            <div className="stat-value text-secondary">{formatTime(gameData['gameDuration'])}</div>
                            {/* <div className="stat-desc">21% more than last month</div> */}
                        </div>
                        <div className="stat">
                            <div className="stat-figure text-secondary">
                                <span className="icon-[material-symbols-light--calendar-add-on-outline-sharp] w-14 h-14"></span>
                            </div>
                            <div className="stat-title">添加日期</div>
                            <div className="stat-value text-secondary">{gameData['addDate'].replace(/-/g, '.')}</div>
                        </div>
                    </div>
                </div>
            </div>
            <div className="flex flex-col w-full pt-77">
                <div role="tablist" className="pl-44 pr-44 tabs tabs-bordered">
                    <NavTab to="./detail" name="详情" />
                    <NavTab to="./character" name="角色" />
                    {/* <NavTab to="./2.5" name="版本" /> */}
                    <NavTab to="./save" name="存档" />
                    <NavTab to="./memory" name="回忆" />
                </div>
                <div className='flex pl-8 pr-8 pt-7 pb-7 grow-0'>
                    <Routes>
                        <Route index element={<Navigate to='./detail' />} />
                        <Route path='/detail' element={<Detail gameData={gameData} />} />
                        <Route path='/character' element={<Character characterData={characterData} />} />
                        <Route path='/save' element={<Save />} />
                        <Route path='/memory' element={<Memory />} />
                    </Routes>
                </div>
            </div>
        </div>
    )
}

function Detail({gameData}){
    return (
        <div className='flex flex-row items-start w-full gap-5 grow-0'>
            <div className='flex flex-col w-2/3 gap-5 grow-0'>
                <div className='p-3 bg-base-300'>
                    <div className='font-bold'>游戏简介</div>
                    <div className='pt-2 text-sm whitespace-pre-wrap'>
                        {gameData['introduction']}
                    </div>
                </div>
                <div className='p-3 bg-base-300'>
                    <div className='font-bold'>发行列表</div>
                    <div className="flex flex-col gap-2 pt-2 text-sm">
                        {gameData['releases'].map((release, index) => {
                            return (
                                <div key={index} className='flex flex-row justify-between'>
                                    <div>
                                        <a className='link link-hover' href={release['relatedLink']} target='_blank'>{release['releaseName']}</a>
                                        <div className='text-xs'>发行时间：{release['releaseDate']}&nbsp;&nbsp;发行语言：{release['releaseLanguage']}</div>
                                    </div>
                                    <div className='flex gap-2'>
                                        <div className='badge-outline badge badge-info'>{release['platform']}</div>
                                        <div className={release['restrictionLevel'] === 'R18+' ? "badge-outline badge badge-error" : "badge-outline badge badge-success"}>{release['restrictionLevel']}</div>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </div>
            </div>
            <div className='flex flex-col w-1/3 gap-5'>
                <div className='p-3 bg-base-300'>
                    <div className='font-bold'>作品信息</div>
                    <div className='pt-2 text-sm'>
                        <div>原名：{gameData['name']}</div>
                        <div>中文名：{gameData['chineseName']}</div>
                        <div>发行日期：{gameData['releaseDate']}</div>
                        <div>会社：<a className='link link-hover' href={`https://www.ymgal.games/oa${gameData['developerId']}`}>{gameData['developer']}</a></div>
                        <div>类型：{gameData['typeDesc']}</div>
                    </div>
                </div>
                <div className='p-3 bg-base-300'>
                    <div className='font-bold'>相关网站</div>
                    <div className="pt-2 text-sm">
                        {gameData['websites'].map((website, index) => {
                            return <div key={index}>▪<a className='link link-secondary' href={website['url']} target='_blank'>{website['title']}</a></div>
                        })}
                    </div>
                </div>
                <div className='p-3 bg-base-300'>
                    <div className='font-bold'>STAFF</div>
                    <div className='pt-1 text-sm'>
                        {
                            Object.keys(gameData['staff']).map((key, index) => {
                                return (
                                    <div key={index}>
                                        <div>{key}：</div>
                                        {
                                            gameData['staff'][key].map((staff, index) => {
                                                return (
                                                    <div key={index}>&nbsp;▪<a className='link link-secondary' href={`https://www.ymgal.games/pa${staff['pid']}`} target='_blank'>{staff['name']}</a><span className='text-xs'>{staff['empDesc'] && `(${staff['empDesc']})`}</span></div>
                                                )
                                            })
                                        }
                                    </div>
                                )
                            })
                        }
                    </div>
                </div>
            </div>
        </div>
    )
}

function Character({characterData}){
    return (
        <div className='flex flex-col w-full gap-5'>
            { characterData.map((character, index) => {
                return (
                    <div>
                        <div key={index} className='flex flex-row items-start gap-5'>
                            <div className='flex flex-row w-3/4 bg-base-300 grow'>
                                {character['cover'] && <img src={character['cover']} alt="c1" className="bg-cover"></img>}
                                <div className='flex flex-col'>
                                    <div className='p-3 text-lg font-bold'>{character['chineseName'] ? character['chineseName'] : character['name']}</div>
                                    <div className='p-3 pt-0 text-sm'>{character['introduction']}</div>
                                </div>
                            </div>
                            <div className='flex flex-col w-1/4 gap-5 text-sm'>
                                <div className='p-3 bg-base-300'>
                                    <div className='pb-2 font-bold'>基本信息</div>
                                    <div>原名：{character['name']}</div>
                                    <div>中文名：{character['chineseName'] ? character['chineseName'] : "未知"}</div>
                                    <div>别名：{character['extensionName'][0] ? character['extensionName'].join('、') : "未知"}</div>
                                    <div>生日：{character['birthday'] ? character['birthday'] : "未知"}</div>
                                    <div>性别：{character['gender'] === 0 ? "未知" : character['gender'] === 1 ? "男" : character['gender'] === 2 ? "女" : "扶她"}</div>
                                </div>
                                <div className='p-3 bg-base-300'>
                                    <div className='pb-2 font-bold'>相关网站</div>
                                    {character['websites'].map((website, index) => {
                                        return <div key={index}>▪<a className='link link-secondary' href={website['url']} target="_blank" rel="noreferrer">{website['title']}</a></div>
                                    })}
                                </div>
                            </div>
                        </div>
                        {index + 1 !== characterData.length && <div className='pt-6 divider'></div>}
                    </div>
                )
            })}
        </div> 
    )
}

function Save(){
    return (
        <div className='w-full'>
            <div className="overflow-x-auto bg-base-300">
                <table className="table">
                    {/* head */}
                    <thead>
                    <tr>
                        <th></th>
                        <th>存档时间</th>
                        <th className='w-1/2'>备注</th>
                        <th>操作</th>
                    </tr>
                    </thead>
                    <tbody>
                    {/* row 1 */}
                    <tr>
                        <th>1</th>
                        <td>2024-7-14 12:59:32</td>
                        <td>第一次存档</td>
                        <td>
                            <div className='flex flex-row gap-2'>
                                <button className="h-6 min-h-0 btn btn-success">切换</button>
                                <button className="h-6 min-h-0 btn btn-accent">编辑</button>
                                <button className="h-6 min-h-0 btn btn-error">删除</button>
                            </div>
                        </td>
                    </tr>
                    {/* row 2 */}
                    <tr>
                        <th>2</th>
                        <td>2024-7-14 13:09:11</td>
                        <td></td>
                        <td>
                            <div className='flex flex-row gap-2'>
                                <button className="h-6 min-h-0 btn btn-success">切换</button>
                                <button className="h-6 min-h-0 btn btn-accent">编辑</button>
                                <button className="h-6 min-h-0 btn btn-error">删除</button>
                            </div>
                        </td>
                    </tr>
                    {/* row 3 */}
                    <tr>
                        <th>3</th>
                        <td>2024-7-14 13:10:03</td>
                        <td></td>
                        <td>
                            <div className='flex flex-row gap-2'>
                                <button className="h-6 min-h-0 btn btn-success">切换</button>
                                <button className="h-6 min-h-0 btn btn-accent">编辑</button>
                                <button className="h-6 min-h-0 btn btn-error">删除</button>
                            </div>
                        </td>
                    </tr>
                    </tbody>
                </table>
            </div>
        </div>
    )
}

function Memory(){
    return(
        <div className='flex flex-col w-full gap-7'>
            <div className='flex flex-col w-full'>
                <img src={bg} className='w-full h-auto'></img>
                <div className='p-3 bg-base-300'>夕阳与少女与烟</div>
            </div>
            <div className='flex flex-col w-full'>
                <img src={mem} className='w-full h-auto'></img>
                <div className='p-3 bg-base-300'>夕阳与少女与死亡</div>
            </div>
        </div>
    )
}

function NavTabWithoutRouter({name}){
    return (
        <div className="tab tab-active" role="tab">
            {name}
        </div>
    )
}

const useGameSetting = create(set => ({
    activeTab: 'general',
    setActiveTab: (activeTab) => set({activeTab}),
    settingData: {},
    setSettingData: (settingData) => set({settingData}),
    updateSettiongData: (path, value) => set((state) => {
        const newData = JSON.parse(JSON.stringify(state.settingData));
        let current = newData;
        for (let i = 0; i < path.length - 1; i++) {
        current = current[path[i]];
        }
        current[path[path.length - 1]] = value;
        return { settingData: newData };
    }),
    settingAlert: "",
    setSettingAlert: (settingAlert) => set({settingAlert})
}))


function Setting({index}){
    const { activeTab, setActiveTab } = useGameSetting()
    const { updateData, data, setAlert, alert } = useRootStore()
    const { settingData, updateSettiongData, setSettingData, settingAlert, setSettingAlert } = useGameSetting()
    useEffect(() => {
        setSettingData(data[index])
    }, [data, index])
    function quitSetting(){
        setSettingData(data[index])
        document.getElementById('my_modal_2').close()
    }
    function saveSetting(){
        updateData([index], settingData)
        setSettingAlert('保存成功')
        setTimeout(() => {setSettingAlert('')}, 3000)
    }
    const tabs = ['general', 'advanced', 'media', 'archive'];
    const renderContent = () => {
        switch(activeTab) {
            case 'general':
                return <GeneralSettings index={index} />;
            case 'advanced':
                return <AdvancedSettings />;
            case 'media':
                return <MediaSettings />;
            case 'archive':
                return <ArchiveSettings />;
            default:
                return null;
        }
    };
    return (
        <div className='flex flex-col w-full gap-5'>
            <div role="tablist" className="tabs tabs-bordered">
                {tabs.map((tab) => (
                    <a 
                        key={tab}
                        role="tab" 
                        className={`tab ${activeTab === tab ? 'tab-active' : ''}`}
                        onClick={() => setActiveTab(tab)}
                    >
                        {tab === 'general' ? '通用' : 
                         tab === 'advanced' ? '高级' : 
                         tab === 'media' ? '媒体' : '存档'}
                    </a>
                ))}
            </div>
            <div>
                {renderContent()}
            </div>
            <div className='absolute flex flex-row gap-5 right-10 bottom-10'>
                <button className='btn btn-primary' onClick={saveSetting}>保存</button>
                <button className='btn btn-error' onClick={quitSetting}>取消</button>
            </div>
            {settingAlert &&
                <div className="toast toast-center">
                    <div className="alert alert-error">
                        <span className='text-base-100'>{settingAlert}</span>
                    </div>
                </div>
            }
        </div>
    )
}

function GeneralSettings({index}){
    const { updateData, data } = useRootStore()
    const { settingData, updateSettiongData, setSettingData } = useGameSetting()
    // useEffect(() => {
    //     setSettingData(data[index])
    // }, [data, index])
    // function quitSetting(){
    //     setSettingData(data[index])
    //     document.getElementById('my_modal_2').close()
    // }
    return(
        <div className='flex flex-col w-full h-full gap-3'>
            <div className='flex flex-row gap-3'>
                <div className='flex flex-col w-1/2 gap-3'>
                    <label className="flex items-center w-full gap-2 input-sm input input-bordered focus-within:outline-none">
                        <div className='font-semibold'>原名 |</div>
                        <input type="text" name='gameName' className="grow" value={settingData?.detail?.name || ''} onChange={(e)=>{updateSettiongData(['detail', 'name'], e.target.value)}} />
                    </label>
                    <label className="flex items-center gap-2 input-sm input input-bordered focus-within:outline-none">
                        <div className='font-semibold'>中文名 |</div>
                        <input type="text" name='gameChineseName' className="grow" value={settingData?.detail?.chineseName || ''} onChange={(e)=>{updateSettiongData(['detail', 'chineseName'], e.target.value)}} />
                    </label>
                    <label className="flex items-center gap-2 input-sm input input-bordered focus-within:outline-none">
                        <div className='font-semibold'>GID |</div>
                        <input type="text" name='gid' className="grow" value={settingData?.detail?.gid || ''} onChange={(e)=>{updateSettiongData(['detail', 'gid'], e.target.value)}} />
                    </label>
                    <label className="flex items-center gap-2 input-sm input input-bordered focus-within:outline-none">
                        <div className='font-semibold'>VID |</div>
                        <input type="text" name='vid' className="grow" value={settingData?.detail?.vid || ''} onChange={(e)=>{updateSettiongData(['detail', 'vid'], e.target.value)}} />
                    </label>
                </div>
                <div className='flex flex-col w-1/2 gap-3'>
                    <label className="flex items-center gap-2 input-sm input input-bordered focus-within:outline-none">
                        <div className='font-semibold'>发行日期 |</div>
                        <input type="text" name='releaseDate' className="grow" value={settingData?.detail?.releaseDate || ''} onChange={(e)=>{updateSettiongData(['detail', 'releaseDate'], e.target.value)}} />
                    </label>
                    <label className="flex items-center gap-2 input-sm input input-bordered focus-within:outline-none">
                        <div className='font-semibold'>开发者 |</div>
                        <input type="text" name='developer' className="grow" value={settingData?.detail?.developer || ''} onChange={(e)=>{updateSettiongData(['detail', 'developer'], e.target.value)}} />
                    </label>
                    <label className="flex items-center gap-2 input-sm input input-bordered focus-within:outline-none">
                        <div className='font-semibold'>类型 |</div>
                        <input type="text" name='typeDesc' className="grow" value={settingData?.detail?.typeDesc || ''} onChange={(e)=>{updateSettiongData(['detail', 'typeDesc'], e.target.value)}} />
                    </label>
                    {/* <label className="flex items-center gap-2 pr-2 mr-0 input-sm input-bordered input focus-within:outline-none">
                        <div className='text-sm font-semibold'>游玩状态 |</div>
                        <select className="outline-none grow bg-base-100" value={settingData?.detail?.playtStatus || 0} onChange={(e)=>{updateSettiongData(['detail', 'playtStatus'], Number(e.target.value))}}>
                            <option value={0}>未开始</option>
                            <option value={1}>游玩中</option>
                            <option value={2}>已完成</option>
                            <option value={3}>N周目</option>
                        </select>
                    </label> */}
                    <label className="flex items-center gap-2 pr-2 mr-0 input-sm input-bordered input focus-within:outline-none">
                        <div className='text-sm font-semibold'>限制级 |</div>
                        <select className="outline-none grow bg-base-100" value={settingData?.detail?.restricted ?? true} onChange={(e)=>{
                            const boolValue = e.target.value === "true";
                            updateSettiongData(['detail', 'restricted'], boolValue)
                        }}>
                            <option value={true}>是</option>
                            <option value={false}>否</option>
                        </select>
                    </label>
                </div>
            </div>
            <label className="flex flex-col items-start self-stretch h-full pt-2 border-1 input-bordered grow">
                <div className='self-center text-sm font-semibold'>简介</div>
                <textarea className="self-stretch p-2 overflow-auto text-sm outline-none bg-base-100 grow scrollbar-base" placeholder="Bio" value={settingData?.detail?.introduction || ''} onChange={(e)=>{updateSettiongData(['detail', 'introduction'], e.target.value)}} />
            </label>
        </div>
    )
}

function AdvancedSettings(){
    return(
        <div>高级</div>
    )
}

function MediaSettings(){
    return(
        <div>媒体</div>
    )
}

function ArchiveSettings(){
    return(
        <div>存档</div>
    )
}

export default Game