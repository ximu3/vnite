import { useStore, create } from 'zustand';
import { MemoryRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { useEffect, useRef, useState, useMemo, useCallback, useLayoutEffect } from 'react';
import { useRootStore } from './Root';

const usePosterStore = create(set => ({
    posters: {},
    setPosters: (posters) => set({ posters }),
    addPoster: (key, value) => set((state) => {
        const newPosters = JSON.parse(JSON.stringify(state.posters));
        newPosters[key] = value;
        return { posters: newPosters };
    }),
    recentPlay: [],
    setRecentPlay: (recentPlay) => set({ recentPlay }),
    backgrounds: {},
    setBackgrounds: (backgrounds) => set({ backgrounds }),
    sortedGames: [],
    setSortedGames: (sortedGames) => set({ sortedGames }),
    sortOrder: 'asc',
    setSortOrder: (sortOrder) => set({ sortOrder }),
    sortBy: 'name',
    setSortBy: (sortBy) => set({ sortBy }),
}));

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

export default function PosterWall() {
    const navigate = useNavigate();
    const { posters, setPosters, addPoster, recentPlay, setRecentPlay, setBackgrounds, backgrounds, sortedGames, setSortedGames, sortOrder, sortBy, setSortBy, setSortOrder } = usePosterStore();
    const { data, icons, setIcons, timestamp, config, updateConfig } = useRootStore();
    useEffect(() => {
        async function loadImages() {
            setPosters({});
            const posterPaths = await Promise.all(
                Object.entries(data || {}).map(async ([key, game]) => {
                    if (!game?.detail?.cover) {
                        return [key, null];
                    }
                    const path = await window.electron.ipcRenderer.invoke('get-data-path', game.detail.cover);
                    return [key, path];
                })
            );
            setPosters(Object.fromEntries(posterPaths));

            setBackgrounds({});
            const backgroundPaths = await Promise.all(
                Object.entries(data || {}).map(async ([key, game]) => {
                    if (!game?.detail?.backgroundImage) {
                        return [key, null];
                    }
                    const path = await window.electron.ipcRenderer.invoke('get-data-path', game.detail.backgroundImage);
                    return [key, path];
                })
            );
            setBackgrounds(Object.fromEntries(backgroundPaths));
        }
        //找到最近游玩的最多8个游戏，按时间远近排序，将key存入recentPlay数组，"lastVisitDate"格式为"2024-08-14"
        const recentPlays = Object.entries(data || {}).sort((a, b) => {
            if (!a[1].detail.lastVisitDate) return 1;
            if (!b[1].detail.lastVisitDate) return -1;
            const dateComparison = new Date(b[1].detail.lastVisitDate) - new Date(a[1].detail.lastVisitDate);
            if (dateComparison === 0) {
                // 如果日期相同，可以使用游戏名称或ID作为次要排序标准
                return a[0].localeCompare(b[0]);
            }
            return dateComparison;
        }).slice(0, 6).map(([key, game]) => key);
        setRecentPlay(recentPlays);
        loadImages();
    }, [data]);
    useEffect(() => {
        const sortGames = Object.entries(data)?.sort((a, b) => {
            const [keyA, gameA] = a;
            const [keyB, gameB] = b;
            let comparison = 0;

            switch (config?.others?.posterWall?.sortBy) {
                case 'name':
                    comparison = (gameA.detail.chineseName || gameA.detail.name).localeCompare(gameB.detail.chineseName || gameB.detail.name);
                    break;
                case 'lastPlayed':
                    comparison = (gameA.detail.lastVisitDate || 0) - (gameB.detail.lastVisitDate || 0);
                    break;
                case 'playTime':
                    comparison = (gameA.detail.gameDuration || 0) - (gameB.detail.gameDuration || 0);
                    break;
                case 'addDate':
                    comparison = new Date(gameA.detail.addDate || 0) - new Date(gameB.detail.addDate || 0);
                    break;
                default:
                    comparison = 0;
            }

            return config?.others?.posterWall?.sortOrder === 'asc' ? comparison : -comparison;
        });
        setSortedGames(sortGames);
    }, [data, config?.others?.posterWall?.sortBy, config?.others?.posterWall?.sortOrder]);
    function convertSortName(sortBy) {
        switch (sortBy) {
            case 'name':
                return '名称';
            case 'lastPlayed':
                return '最后运行日期';
            case 'playTime':
                return '游玩时间';
            case 'addDate':
                return '添加日期';
            default:
                return '名称';
        }
    }
    function toggleSortOrder() {
        updateConfig(['others', 'posterWall', 'sortOrder'], config?.others?.posterWall?.sortOrder === 'asc' ? 'desc' : 'asc');
    }
    return (
        <div className='w-full h-full overflow-auto p-7 bg-custom-main-2 scrollbar-base'>
            <div className='flex flex-col w-full h-full gap-16'>
                <div className='flex flex-col w-full gap-5 pt-7'>
                    <div className='m-0 divider-start divider'>最近游戏</div>
                    <div className='flex flex-row flex-wrap w-full gap-7'>
                        {recentPlay.map((index, arrayIndex) => (
                            arrayIndex === 0 ? (
                                <div key={index} className='relative overflow-hidden shadow-md cursor-pointer w-87 h-60 group shadow-black/80 shine-effect-large' onClick={() => navigate(`../${index}`)}>
                                    <img src={backgrounds[index]} alt={index} className='relative object-cover w-full h-full transition-transform ease-in-out duration-400 group-hover:scale-103 will-change-transform' />
                                    <div className='absolute bg-custom-stress/60 flex items-center pl-5 flex-row justify-start bottom-0 w-full transform-gpu will-change-opacity h-1/3 backdrop-blur-xl border-t-0.5 border-white/30'>
                                        <div className='flex items-center justify-center shadow-sm shadow-black/50 w-14 h-14 bg-gradient-to-tl from-custom-blue-6 to-custom-blue-2'>
                                            <span className="icon-[mdi--clock-star-four-points] w-8 h-8 bg-custom-text-light"></span>
                                        </div>
                                        <div className='flex flex-col gap-1 p-4'>
                                            <div className='text-xs font-semibold'>游玩信息</div>
                                            <div className='flex flex-row text-xs text-custom-text'>
                                                <div className='font-semibold'>
                                                    游戏时间：
                                                </div>
                                                <div className='font-semibold'>
                                                    {formatTime(data[index]?.detail?.gameDuration)}
                                                </div>
                                            </div>
                                            <div className='flex flex-row text-xs text-custom-text'>
                                                <div className='font-semibold'>
                                                    最后运行日期：
                                                </div>
                                                <div className='font-semibold'>
                                                    {data[index]?.detail?.lastVisitDate}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <Poster key={index} index={index} />
                            )
                        ))}
                    </div>
                </div>
                <div className='flex flex-col gap-5 pb-9'>
                    <div className='flex flex-row items-center justify-center m-0 divider-start divider'>
                        <div>所有游戏</div>
                        <div className='-ml-4 -mr-3 text-sm text-custom-text/90'>（{Object.keys(data)?.length}）</div>
                        <div className="z-50 dropdown">
                            <div tabIndex={0} role="button" className="flex flex-row w-auto h-5 min-h-0 pr-2 text-xs font-normal border-0 no-animation btn text-custom-text bg-custom-stress-2 hover:text-custom-text-light">
                                <div className='flex flex-row items-center justify-center gap-1'>
                                    按{convertSortName(sortBy)}排序
                                    <span className="icon-[material-symbols-light--keyboard-arrow-down] w-4 h-4"></span>
                                </div>
                            </div>
                            <ul tabIndex={0} className="dropdown-content menu bg-custom-dropdown rounded-box z-[1] w-52 p-2 shadow mt-1">
                                <li onClick={() => { updateConfig(['others', 'posterWall', 'sortBy'], 'name') }} className='hover:bg-custom-text hover:text-black active:bg-custom-text'><a className='transition-none active:bg-custom-text active:text-black'>按名称排序</a></li>
                                <li onClick={() => { updateConfig(['others', 'posterWall', 'sortBy'], 'lastPlayed') }} className='hover:bg-custom-text hover:text-black'><a className='transition-none active:bg-custom-text active:text-black'>按最后运行日期排序</a></li>
                                <li onClick={() => { updateConfig(['others', 'posterWall', 'sortBy'], 'playTime') }} className='hover:bg-custom-text hover:text-black'><a className='transition-none active:bg-custom-text active:text-black'>按游玩时间排序</a></li>
                                <li onClick={() => { updateConfig(['others', 'posterWall', 'sortBy'], 'addDate') }} className='hover:bg-custom-text hover:text-black'><a className='transition-none active:bg-custom-text active:text-black'>按添加日期排序</a></li>
                            </ul>
                        </div>
                        <label className="w-auto h-5 p-1 -m-2 swap bg-custom-stress-2 text-custom-text hover:text-custom-text-light">
                            <input type="checkbox" onChange={toggleSortOrder} />
                            <div className="flex items-center justify-center text-xs swap-off"><span className="icon-[ic--sharp-arrow-downward] w-4 h-4"></span></div>
                            <div className="flex items-center justify-center text-xs swap-on"><span className="icon-[ic--sharp-arrow-upward] w-4 h-4"></span></div>
                        </label>
                    </div>
                    <div className='flex flex-row flex-wrap gap-7'>
                        {sortedGames?.map(([index, game]) => (
                            <Poster key={index} index={index} />
                        ))}
                    </div>
                </div>
            </div>
        </div>
    )
}

function useElementPosition() {
    const [position, setPosition] = useState('right');
    const ref = useRef(null);
    const { config } = useRootStore();

    useLayoutEffect(() => {
        const checkPosition = () => {
            if (ref.current) {
                const rect = ref.current.getBoundingClientRect();
                const spaceOnRight = window.innerWidth - rect.right;
                setPosition(spaceOnRight > 400 ? 'right' : 'left');
            }
        };

        const timer = setTimeout(checkPosition, 0);

        window.addEventListener('resize', checkPosition);
        return () => {
            window.removeEventListener('resize', checkPosition);
            clearTimeout(timer);
        };
    }, [config?.others?.posterWall?.sortBy, config?.others?.posterWall?.sortOrder]);

    return [ref, position];
}

function Poster({ index }) {
    const navigate = useNavigate();
    const { posters, backgrounds } = usePosterStore();
    const [ref, position] = useElementPosition();
    const { data } = useRootStore();
    return (
        <div className="relative group" ref={ref}>
            <div onClick={() => navigate(`../${index}`)} className='relative z-10 w-40 overflow-visible transition-all ease-in-out shadow-md cursor-pointer group duration-400 h-60 shadow-black/80 hover:-translate-y-1 hover:shadow-xl hover:shadow-black/80 transform-gpu shine-effect'>
                <img src={posters[index]} alt={index} loading='lazying' className='object-cover w-full h-full' />
            </div>

            <div className={`w-60 absolute -top-1 z-20 invisible h-61 transition-opacity duration-300 ease-in-out delay-500 shadow-lg shadow-black/80 opacity-0 group-hover:opacity-100 group-hover:visible overflow-hidden
            ${position === 'right' ? 'left-full ml-4' : 'right-full mr-4'}`}>
                <div className="absolute inset-0">
                    <img src={posters[index]} alt={index} className='object-cover w-full h-full' />
                    <div className="absolute inset-0 bg-black/30 backdrop-blur-xl"></div>
                </div>
                <div className="relative z-10 flex flex-col h-full">
                    <div className="p-3 overflow-hidden text-xs font-semibold text-white truncate">
                        {data[index]?.detail?.chineseName || data[index]?.detail?.name}
                    </div>
                    <div className='relative w-full h-32 pt-1'>
                        <img src={backgrounds[index]} className='object-cover w-full h-full' />
                        <div className="absolute w-full h-4 top-28 bg-gradient-to-b from-transparent to-black/30"></div>
                    </div>
                    <div className='flex flex-col justify-center gap-1 p-3 pt-4'>
                        <div className='text-xs font-semibold text-custom-text-light/90'>游玩信息</div>
                        <div className='flex flex-row text-xs text-custom-text-light/80'>
                            <div className=''>
                                游戏时间：
                            </div>
                            <div className=''>
                                {formatTime(data[index]?.detail?.gameDuration)}
                            </div>
                        </div>
                        <div className='flex flex-row text-xs text-custom-text-light/80'>
                            <div className=''>
                                最后运行日期：
                            </div>
                            <div className=''>
                                {data[index]?.detail?.lastVisitDate || '从未运行'}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

