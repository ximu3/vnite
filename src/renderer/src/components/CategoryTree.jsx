import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { useRootStore } from './Root';

function NavButton({ to, name, icon }) {
    return (
        <NavLink className={({ isActive, isPending }) =>
            isPending
                ? ""
                : isActive
                    ? "transition-none p-1.5 pl-4 bg-gradient-to-r active:bg-gradient-to-r active:from-custom-blue-5 active:to-custom-blue-5/80 from-custom-blue-5 to-custom-blue-5/80 text-custom-text-light text-xs hover:bg-custom-blue-5 hover:brightness-125 focus:bg-transparent"
                    : "transition-none p-1.5 pl-4 active:bg-gradient-to-r active:from-custom-blue-5 active:to-custom-blue-5/80 hover:bg-gradient-to-r hover:from-custom-blue-5/50 hover:to-custom-blue-5/30 active:text-custom-text-light text-xs focus:bg-transparent"
        }
            to={to}>
            {icon}
            <div className='overflow-hidden truncate'>
                {name}
            </div>
        </NavLink>
    )
}

function CategoryTree({ categories, data, icons, timestamp, searchTerm, onCategoryContextMenu, onGameContextMenu }) {
    const { categoryData } = useRootStore();
    return (
        <ul className="w-full pl-0 pr-0 menu rounded-box text-custom-text-light gap-0.5">
            {categoryData?.map((category, index) => (
                <CategoryItem
                    key={category.id}
                    category={category}
                    index={index}
                    data={data}
                    icons={icons}
                    timestamp={timestamp}
                    searchTerm={searchTerm}
                    onCategoryContextMenu={onCategoryContextMenu}
                    onGameContextMenu={onGameContextMenu}
                />
            ))}
        </ul>
    );
}

function CategoryItem({ category, index, data, icons, timestamp, searchTerm, onCategoryContextMenu, onGameContextMenu }) {
    const [isOpen, setIsOpen] = useState(true);

    const filteredGames = category.games ? category.games.filter(gameId => {
        const game = data[gameId];
        if (!game) return false;
        const searchTermLower = searchTerm.toLowerCase();
        const mainNameMatch =
            game.detail?.chineseName?.toLowerCase().includes(searchTermLower) ||
            game.detail?.name?.toLowerCase().includes(searchTermLower);
        const extensionNameMatch = game.detail?.extensionName?.some(alias =>
            alias.toLowerCase().includes(searchTermLower)
        );
        return mainNameMatch || extensionNameMatch;
    }) : [];

    const hasMatchingGames = filteredGames.length > 0;
    const hasMatchingChildren = category.children && category.children.some(child =>
        child.games && child.games.some(gameId => {
            const game = data[gameId];
            if (!game) return false;
            const searchTermLower = searchTerm.toLowerCase();
            const mainNameMatch =
                game.detail?.chineseName?.toLowerCase().includes(searchTermLower) ||
                game.detail?.name?.toLowerCase().includes(searchTermLower);
            const extensionNameMatch = game.detail?.extensionName?.some(alias =>
                alias.toLowerCase().includes(searchTermLower)
            );
            return mainNameMatch || extensionNameMatch;
        })
    );

    if (searchTerm && !hasMatchingGames && !hasMatchingChildren) {
        return null;
    }

    let gameCount = 0;
    if (category.games) {
        gameCount += category.games.length;
    }
    if (category.children) {
        category.children.forEach(child => {
            if (child.games) {
                gameCount += child.games.length;
            }
        });
    }

    return (
        <div className=''>
            <div
                onClick={() => setIsOpen(!isOpen)}
                onContextMenu={(e) => onCategoryContextMenu(e, category.id)}
                className="text-custom-text-blue hover:text-custom-text-light mt-0.5 flex items-center cursor-pointer transition-none p-1.5 pl-1 bg-gradient-to-r from-custom-blue-5/25 to-custom-blue-5/5 hover:bg-gradient-to-r hover:from-custom-blue-5 hover:to-custom-blue-5/80 active:text-custom-text-light text-xs focus:bg-transparent"
            >
                {isOpen ? <span className="w-3 h-3 icon-[cil--minus] pr-6 text-custom-text hover:text-custom-text-light">-</span> : <span className="w-3 h-3 icon-[cil--plus] pr-6 text-custom-text hover:text-custom-text-light">+</span>}
                {category.name}{gameCount > 0 && <span className="text-2xs text-custom-text/30">（{gameCount}）</span>}
            </div>
            {isOpen && (
                <>
                    {category.children && (
                        <ul className='list-none'>
                            {category.children.map((child, childIndex) => (
                                <CategoryItem
                                    key={child.id}
                                    category={child}
                                    index={childIndex}
                                    data={data}
                                    icons={icons}
                                    timestamp={timestamp}
                                    searchTerm={searchTerm}
                                    onCategoryContextMenu={onCategoryContextMenu}
                                    onGameContextMenu={onGameContextMenu}
                                />
                            ))}
                        </ul>
                    )}
                    {filteredGames.length > 0 && (
                        <ul className='list-none'>
                            {filteredGames.map((gameId, gameIndex) => (
                                <GameItem
                                    key={gameId}
                                    gameId={gameId}
                                    category={category}
                                    index={gameIndex}
                                    data={data}
                                    icons={icons}
                                    timestamp={timestamp}
                                    onContextMenu={onGameContextMenu}
                                />
                            ))}
                        </ul>
                    )}
                </>
            )}
        </div>
    );
}

function GameItem({ gameId, index, category, data, icons, timestamp, onContextMenu }) {
    const game = data[gameId];
    if (!game) return null;

    return (
        <li onContextMenu={(e) => onContextMenu(e, gameId, category.id)}>
            <NavButton
                to={`./${gameId}`}
                name={game.detail.chineseName || game.detail.name}
                icon={
                    icons[gameId]
                        ? <img src={`${icons[gameId]}?t=${timestamp}`} className='w-4.5 h-4.5' alt="" />
                        : <span className="icon-[mingcute--game-2-fill] w-4.5 h-4.5"></span>
                }
            />
        </li>
    );
}

export default CategoryTree;