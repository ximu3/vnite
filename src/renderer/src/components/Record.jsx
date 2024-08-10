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
                    ? "bg-custom-blue-4/20 text-custom-text-light"
                    : ""
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
}));

function Record() {
    const { quantity, setQuantity, volume, setVolume, time, setTime, setNotPlay, setPlaying, setPlayed, setPlayAgain } = useRecordStore();
    const { data, setData, alert, config, setConfig } = useRootStore();
    useEffect(() => {
        let volume = 0;
        let time = 0;
        let notPlay = 0;
        let playing = 0;
        let played = 0;
        let playAgain = 0;
        data.forEach((game, index) => {
            volume += game.detail.volume;
            time += game.detail.gameDuration;
            if (game.detail.playtStatus === 0) {
                notPlay++;
            } else if (game.detail.playtStatus === 1) {
                playing++;
            } else if (game.detail.playtStatus === 2) {
                played++;
            } else if (game.detail.playtStatus === 3) {
                playAgain++;
            }
        })
        setVolume(volume);
        setTime(time);
        setQuantity(data.length);
        setNotPlay(notPlay);
        setPlaying(playing);
        setPlayed(played);
        setPlayAgain(playAgain);
    }, [data]);
    return (
        <div className="flex flex-row w-full h-full">
            <div className="flex flex-col h-full border-black border-r-0.5 border-l-0.5 w-72 shrink-0">
                <div className="w-full grow bg-custom-main-2">
                    <ul className="w-full menu rounded-box">
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
    return (
        <div className='w-full h-full p-3'>
            <div className='flex flex-col gap-3'>
                <div className='flex flex-row gap-3 h-1/2'>
                    <div className="w-1/3 shadow-sm card bg-custom-main-7">
                        <figure>
                            {
                                //找到最多游玩时间的游戏封面并显示
                                data.map((game, index) => {
                                    if (game.detail.gameDuration === Math.max(...data.map(game => game.detail.gameDuration))) {
                                        return <img src={game.detail.cover} alt="Cover" className='' />
                                    }
                                })
                            }
                        </figure>
                        <div className="p-5 card-body">
                            {
                                data.map((game, index) => {
                                    if (game.detail.gameDuration === Math.max(...data.map(game => game.detail.gameDuration))) {
                                        return <h2 className="flex flex-row justify-between text-center card-title">
                                            <div>最多游玩时间！</div>
                                            <div className=''>{formatTime(game.detail.gameDuration)}</div>
                                        </h2>
                                    }
                                })
                            }
                            {
                                //找到最多游玩时间的游戏名并显示
                                data.map((game, index) => {
                                    if (game.detail.gameDuration === Math.max(...data.map(game => game.detail.gameDuration))) {
                                        return <div className='flex justify-center pt-2'><span className='self-center font-bold'>《{game.detail.chineseName ? game.detail.chineseName : game.detail.name}》</span></div>
                                    }
                                })
                            }
                            <div className="justify-end card-actions">
                                {/* <button className="btn btn-primary">Buy Now</button> */}
                            </div>
                        </div>
                    </div>
                    <div className="w-1/3 shadow-sm card bg-custom-main-7">
                        <figure>
                            {
                                data.map((game, index) => {
                                    if (game.detail.frequency === Math.max(...data.map(game => game.detail.frequency))) {
                                        return <img src={game.detail.cover} alt="Cover" className='' />
                                    }
                                })
                            }
                        </figure>
                        <div className="p-5 card-body">
                            {
                                data.map((game, index) => {
                                    if (game.detail.frequency === Math.max(...data.map(game => game.detail.frequency))) {
                                        return <h2 className="flex flex-row justify-between text-center card-title">
                                            <div>最多游玩次数！</div>
                                            <div className=''>{game.detail.frequency}</div>
                                        </h2>
                                    }
                                })

                            }
                            {
                                data.map((game, index) => {
                                    if (game.detail.frequency === Math.max(...data.map(game => game.detail.frequency))) {
                                        return <div className='flex justify-center pt-2'><span className='self-center font-bold'>《{game.detail.chineseName ? game.detail.chineseName : game.detail.name}》</span></div>
                                    }
                                })
                            }
                            <div className="justify-end card-actions">
                                {/* <button className="btn btn-primary">Buy Now</button> */}
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
    const sortedData = data.sort((a, b) => {
        return new Date(b.detail.lastVisitDate) - new Date(a.detail.lastVisitDate);
    });
    return (
        <div className='w-full h-full p-3'>
            <div className='flex flex-row gap-7'>
                <div className='w-1/3 p-3 bg-custom-main-7'>
                    <div className='text-lg font-bold'>总览</div>
                    <div className='m-0 divider'></div>
                    <div className='flex flex-col gap-3 text-custom-text-light'>
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
                <div className='w-1/3 p-3 bg-custom-main-7'>
                    <div className='text-lg font-bold'>最多游玩时间</div>
                    <div className='m-0 divider'></div>
                    <div className='flex flex-col gap-1 overflow-auto text-custom-text-light scrollbar-base'>
                        {data.map((game, index) => {
                            return <div key={index} className='flex flex-row justify-between'>
                                <span>{game.detail.chineseName ? game.detail.chineseName : game.detail.name}</span>
                                <span>{formatTime(game.detail.gameDuration)}</span>
                            </div>
                        })}
                    </div>
                </div>
                <div className='w-1/3 p-3 bg-custom-main-7'>
                    <div className='text-lg font-bold'>最近游玩</div>
                    <div className='m-0 divider'></div>
                    <div className='flex flex-col gap-1 overflow-auto text-custom-text-light scrollbar-base'>
                        {sortedData.map((game, index) => {
                            return <div key={index} className='flex flex-row justify-between'>
                                <span>{game.detail.chineseName ? game.detail.chineseName : game.detail.name}</span>
                                <span>{game.detail.lastVisitDate}</span>
                            </div>
                        })}
                    </div>
                </div>
            </div>
        </div>
    )
}

export default Record;