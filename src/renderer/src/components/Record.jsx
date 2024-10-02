import { BrowserRouter, Routes, Route, Navigate, NavLink } from 'react-router-dom';
import { create } from 'zustand';
import { useRootStore } from './Root'
import { useEffect, useState } from 'react'

function NavButton({ to, name }) {
    return (
        <NavLink className={({ isActive, isPending }) =>
            isPending
                ? ""
                : isActive
                    ? "transition-none bg-gradient-to-r active:bg-gradient-to-r active:from-custom-blue-5 active:to-custom-blue-5/80 from-custom-blue-5 to-custom-blue-5/80 text-custom-text-light text-xs hover:bg-custom-blue-5 hover:brightness-125 focus:bg-transparent"
                    : "transition-none active:bg-gradient-to-r active:from-custom-blue-5 active:to-custom-blue-5/80 hover:bg-gradient-to-r hover:from-custom-blue-5/50 hover:to-custom-blue-5/30 active:text-custom-text-light text-xs focus:bg-transparent"
        }
            to={to}>
            {name}
        </NavLink>
    )
}

const useRecordStore = create(set => ({
    quantity: 0,
    setQuantity: (quantity) => set({ quantity }),
    volume: 0,
    setVolume: (volume) => set({ volume }),
    time: 0,
    setTime: (time) => set({ time }),
    notPlay: 0,
    setNotPlay: (notPlay) => set({ notPlay }),
    playing: 0,
    setPlaying: (playing) => set({ playing }),
    played: 0,
    setPlayed: (played) => set({ played }),
    playAgain: 0,
    setPlayAgain: (playAgain) => set({ playAgain }),
    cover: {},
    setCover: (cover) => set({ cover }),
    addCover: (key, path) => set((state) => {
        const newCover = { ...state.cover };
        newCover[key] = path;
        return { cover: newCover };
    }),
}));

function Record() {
    const { quantity, setQuantity, volume, setVolume, time, setTime, setNotPlay, setPlaying, setPlayed, setPlayAgain, addCover, setCover } = useRecordStore();
    const { data, setData, alert, config, setConfig } = useRootStore();
    useEffect(() => {
        setCover({});
        let volume = 0;
        let time = 0;
        let notPlay = 0;
        let playing = 0;
        let played = 0;
        let playAgain = 0;

        Object.values(data).forEach((game) => {
            volume += game?.detail.volume || 0;
            time += game?.detail.gameDuration || 0;
            switch (game?.detail.playtStatus) {
                case 0: notPlay++; break;
                case 1: playing++; break;
                case 2: played++; break;
                case 3: playAgain++; break;
            }
        });

        setVolume(volume);
        setTime(time);
        setQuantity(Object.keys(data).length);
        setNotPlay(notPlay);
        setPlaying(playing);
        setPlayed(played);
        setPlayAgain(playAgain);

        Object.entries(data).forEach(async ([key, game]) => {
            if (game?.detail.cover) {
                const path = await window.electron.ipcRenderer.invoke('get-data-path', game.detail.cover);
                addCover(key, path);
            }
        });

    }, [data]);
    return (
        <div className="flex flex-row w-full h-full">
            <div className="flex flex-col h-full border-black border-r-0.5 border-l-0.5 w-72 shrink-0">
                <div className="w-full grow bg-custom-main-2">
                    <ul className="flex flex-col w-full gap-1 menu rounded-box">
                        <li><NavButton to={"./global"} name={"全局"} /></li>
                        <li><NavButton to={"./ranking"} name={"排行"} /></li>
                    </ul>

                </div>
            </div>
            <div className="grow bg-custom-main">
                <Routes>
                    <Route index element={<Navigate to='./global' />} />
                    <Route path='/global/*' element={<Global />} />
                    <Route path='/ranking/*' element={<Ranking />} />
                </Routes>
            </div>
        </div>
    );
}

function Ranking() {
    const { data } = useRootStore();
    const { cover } = useRecordStore();
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
    const longestGameKey = Object.keys(data).reduce((maxKey, currentKey) =>
        data[currentKey]?.detail.gameDuration > data[maxKey]?.detail.gameDuration ? currentKey : maxKey
        , Object.keys(data)[0]);

    const mostPlayedKey = Object.keys(data).reduce((maxKey, currentKey) =>
        data[currentKey]?.detail.frequency > data[maxKey]?.detail.frequency ? currentKey : maxKey
        , Object.keys(data)[0]);

    return (
        <div className='w-full h-full p-3'>
            <div className='flex flex-col gap-3'>
                <div className='flex flex-row items-start gap-3 h-1/2'>
                    <div className="w-1/3 shadow-sm card bg-custom-stress">
                        <figure>
                            {
                                //找到最多游玩时间的游戏封面并显示
                                data[longestGameKey]?.detail.cover && (
                                    <img
                                        src={cover[longestGameKey]}
                                        alt={`Cover`}
                                        className=''
                                    />
                                )
                            }
                        </figure>
                        <div className="p-5 card-body">
                            <h2 className="flex flex-row justify-between text-center card-title">
                                <div>最多游玩时间！</div>
                                <div className=''>{formatTime(data[longestGameKey]?.detail['gameDuration'])}</div>
                            </h2>

                            <div className='flex justify-center pt-2'><span className='self-center font-bold'>《{data[longestGameKey]?.detail.chineseName ? data[longestGameKey]?.detail.chineseName : data[longestGameKey]?.detail.name}》</span></div>

                            <div className="justify-end card-actions">
                            </div>
                        </div>
                    </div>
                    <div className="w-1/3 shadow-sm card bg-custom-stress">
                        <figure>
                            {
                                //找到最多游玩时间的游戏封面并显示
                                data[mostPlayedKey]?.detail.cover && (
                                    <img
                                        src={cover[mostPlayedKey]}
                                        alt={`Cover`}
                                        className=''
                                    />
                                )
                            }
                        </figure>
                        <div className="p-5 card-body">
                            <h2 className="flex flex-row justify-between text-center card-title">
                                <div>最多游玩次数！</div>
                                <div className=''>{data[mostPlayedKey]?.detail.frequency}</div>
                            </h2>
                            <div className='flex justify-center pt-2'><span className='self-center font-bold'>《{data[mostPlayedKey]?.detail.chineseName ? data[mostPlayedKey]?.detail.chineseName : data[mostPlayedKey]?.detail.name}》</span></div>
                            <div className="justify-end card-actions">
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

function Global() {
    const { quantity, volume, time, notPlay, playing, played, playAgain } = useRecordStore();
    const { data } = useRootStore();
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
    function formatVolume(volume) {
        if (volume < 1024) {
            return `${volume.toFixed(2)}MB`;
        } else {
            return `${(volume / 1024).toFixed(2)}GB`;
        }
    }
    function switchTimestampToFomattedTime(timestamp) {
        const date = new Date(timestamp);
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0'); // 月份从0开始，需要+1
        const day = String(date.getDate()).padStart(2, '0');

        return `${year}.${month}.${day}`;
    }
    return (
        <div className='w-full h-full p-3'>
            <div className='flex flex-row items-start gap-7'>
                <div className='w-1/3 p-5 bg-custom-stress'>
                    <div className='text-lg font-bold'>总览</div>
                    <div className='m-0 divider'></div>
                    <div className='flex flex-col gap-3 pt-3 text-xs text-custom-text-light'>
                        <div className='flex flex-row justify-between'>
                            <div>全部</div>
                            <div>{quantity}</div>
                        </div>
                        <div className='flex flex-row justify-between'>
                            <div>未开始</div>
                            <div className='flex flex-row gap-5'>
                                <div className='text-right'>{notPlay}</div>
                                <div className='w-10 text-right'>{(notPlay / quantity * 100).toFixed(0)}%</div>
                            </div>
                        </div>
                        <div className='flex flex-row justify-between'>
                            <div>进行中</div>
                            <div className='flex flex-row gap-5'>
                                <div className='text-right'>{playing}</div>
                                <div className='w-10 text-right'>{(playing / quantity * 100).toFixed(0)}%</div>
                            </div>
                        </div>
                        <div className='flex flex-row justify-between'>
                            <div>已完成</div>
                            <div className='flex flex-row gap-5'>
                                <div className='text-right'>{played}</div>
                                <div className='w-10 text-right'>{(played / quantity * 100).toFixed(0)}%</div>
                            </div>
                        </div>
                        <div className='flex flex-row justify-between'>
                            <div>多周目</div>
                            <div className='flex flex-row gap-5'>
                                <div className='text-right'>{playAgain}</div>
                                <div className='w-10 text-right'>{(playAgain / quantity * 100).toFixed(0)}%</div>
                            </div>
                        </div>
                        <div className='flex flex-row justify-between pt-7'>
                            <span>总游玩时间</span>
                            <span>{formatTime(time)}</span>
                        </div>
                        <div className='flex flex-row justify-between'>
                            <span>平均游玩时间</span>
                            <span>{formatTime(time / quantity)}</span>
                        </div>
                        <div className='flex flex-row justify-between pt-5'>
                            <span>总占用空间</span>
                            <span>{formatVolume(volume)}</span>
                        </div>
                    </div>
                </div>
                <div className='w-1/3 p-5 pr-2 overflow-auto bg-custom-stress'>
                    <div className='text-lg font-bold'>最多游玩时间</div>
                    <div className='m-0 divider'></div>
                    <div className='flex flex-col gap-3 pt-3 pr-3 overflow-auto text-xs text-custom-text-light max-h-100 scrollbar-base'>
                        {Object.entries(data)
                            ?.sort(([, a], [, b]) => b.detail.gameDuration - a.detail.gameDuration)
                            ?.map(([key, game]) => {
                                return (
                                    <div key={key} className='flex flex-row justify-between'>
                                        <span>{game?.detail.chineseName || game?.detail.name}</span>
                                        <span>{formatTime(game?.detail.gameDuration)}</span>
                                    </div>
                                );
                            })
                        }
                    </div>
                </div>
                <div className='w-1/3 p-5 pr-2 bg-custom-stress'>
                    <div className='text-lg font-bold'>最近游玩</div>
                    <div className='m-0 divider'></div>
                    <div className='flex flex-col gap-3 pt-3 pr-3 overflow-auto text-xs text-custom-text-light max-h-100 scrollbar-base'>
                        {Object.entries(data)
                            ?.sort(([, a], [, b]) => {
                                const dateA = a.detail.lastVisitDate ? a.detail.lastVisitDate : new Date(0);
                                const dateB = b.detail.lastVisitDate ? b.detail.lastVisitDate : new Date(0);
                                return dateB - dateA; // 从新到旧排序
                            })
                            ?.map(([key, game]) => {
                                return (
                                    <div key={key} className='flex flex-row justify-between'>
                                        <span>{game?.detail.chineseName || game?.detail.name}</span>
                                        <span>{game?.detail.lastVisitDate ? switchTimestampToFomattedTime(game?.detail.lastVisitDate) : "从未运行"}</span>
                                    </div>
                                );
                            })
                        }
                    </div>
                </div>
            </div>
        </div>
    )
}

export default Record;