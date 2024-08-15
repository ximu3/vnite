import { useStore, create } from 'zustand';
import { MemoryRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { useEffect, useRef } from 'react';
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
}));

export default function PosterWall() {
    const navigate = useNavigate();
    const { posters, setPosters, addPoster, recentPlay, setRecentPlay, setBackgrounds, backgrounds } = usePosterStore();
    const { data, icons, setIcons, timestamp } = useRootStore();
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
        const recentPlay = Object.entries(data || {}).sort((a, b) => {
            if (!a[1].lastVisitDate) return 1;
            if (!b[1].lastVisitDate) return -1;
            const dateComparison = new Date(b[1].lastVisitDate) - new Date(a[1].lastVisitDate);
            if (dateComparison === 0) {
                // 如果日期相同，可以使用游戏名称或ID作为次要排序标准
                return a[0].localeCompare(b[0]);
            }
            return dateComparison;
        }).slice(0, 6).map(([key, game]) => key);
        setRecentPlay(recentPlay);
        loadImages();
    }, [data]);
    return (
        <div className='w-full h-full overflow-auto p-7 bg-custom-main scrollbar-base'>
            <div className='flex flex-col w-full h-full gap-16'>
                <div className='flex flex-col gap-5 pt-7'>
                    <div className='m-0 divider-start divider'>最近游戏</div>
                    <div className='flex flex-row flex-wrap gap-7'>
                        {recentPlay.map((index, arrayIndex) => (
                            arrayIndex === 0 ? (
                                <div key={index} className='relative overflow-hidden shadow-md cursor-pointer w-87 h-60 group shadow-black/80' onClick={() => navigate(`../${index}`)}>
                                    <img src={backgrounds[index]} alt={index} className='object-cover w-full h-full transition-transform duration-500 ease-in-out group-hover:scale-105 will-change-transform' />
                                    <div className='absolute bottom-0 w-full transform-gpu will-change-opacity h-1/3 backdrop-blur-xl border-t-0.5 border-white/30'></div>
                                </div>
                            ) : (
                                <Poster key={index} index={index} />
                            )
                        ))}
                    </div>
                </div>
                <div className='flex flex-col gap-5 pb-9'>
                    <div className='flex flex-row m-0 divider-start divider'>
                        <div>所有游戏</div>
                        <div className='-ml-2 text-sm text-custom-text'>({Object.keys(data)?.length})</div>
                    </div>
                    <div className='flex flex-row flex-wrap gap-7'>
                        {Object.keys(posters).map((index) => (
                            <Poster index={index} />
                        ))}
                    </div>
                </div>
            </div>
        </div>
    )
}

function Poster({ index }) {
    const navigate = useNavigate();
    const { posters } = usePosterStore();
    return (
        <div onClick={() => navigate(`../${index}`)} className='relative w-40 overflow-hidden transition-all duration-500 ease-in-out shadow-md cursor-pointer shadow-black/80 h-60 group hover:scale-105 hover:-translate-y-1 hover:shadow-xl hover:shadow-black/80 transform-gpu'>
            <img src={posters[index]} alt={index} className='object-cover w-full h-full transition-transform duration-500 ease-in-out' />
        </div>
    )
}

