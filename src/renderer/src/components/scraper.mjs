import fetch from 'node-fetch';
import { addCharacterImgToData, addNewGameToData, addObjectToJsonFile, getGameData, updateGameData } from './dataManager.mjs';
import path from 'path';
import getFolderSize from 'get-folder-size';
import log from 'electron-log/main.js';
import { get } from 'http';

async function retry(fn, retries, mainWindow) {
    try {
        return await fn();
    } catch (error) {
        if (retries > 0) {
            console.log(`操作失败，${1000 / 1000}秒后重试。剩余重试次数：${retries - 1}`);
            log.error(`操作失败，1秒后重试。剩余重试次数：${retries - 1} ${error}`);
            mainWindow.webContents.send('add-game-log', `[warning] 操作失败，1秒后重试。剩余重试次数：${retries - 1}`);
            await new Promise(resolve => setTimeout(resolve, 1000));
            return retry(fn, retries - 1, mainWindow);
        }
        throw error;
    }
}

// 定义获取Access Token的函数
async function getAccessToken(clientId, clientSecret) {
    const tokenEndpoint = 'https://www.ymgal.games/oauth/token';
    const params = new URLSearchParams();
    params.append('grant_type', 'client_credentials');
    params.append('client_id', clientId);
    params.append('client_secret', clientSecret);
    params.append('scope', 'public');

    try {
        const response = await fetch(`${tokenEndpoint}?${params}`, {
            method: 'GET'
        });
        const data = await response.json();
        if (data.access_token) {
            return data.access_token;
        } else {
            throw new Error('Failed to obtain access token: ' + data.error_description);
        }
    } catch (error) {
        log.error('Error in getAccessToken:', error);
        throw error;
    }
}

async function searchGameDetails(gameName) {
    const clientId = 'ymgal';
    const clientSecret = 'luna0327';
    try {
        const accessToken = await getAccessToken(clientId, clientSecret);
        const baseURL = 'https://www.ymgal.games';
        const url = new URL('/open/archive/search-game', baseURL);
        url.searchParams.append('mode', 'accurate');
        url.searchParams.append('keyword', gameName);
        url.searchParams.append('similarity', 90);

        const headers = new Headers();
        headers.append('Accept', 'application/json;charset=utf-8');
        headers.append('Authorization', `Bearer ${accessToken}`);
        headers.append('version', '1');

        const response = await fetch(url, {
            method: 'GET',
            headers: headers
        });
        const data = await response.json();
        return data;
    } catch (error) {
        log.error('Error in searchGameDetails:', error);
        throw error;
    }
}

async function searchGameList(keyword, pageNum = 1, pageSize = 20) {
    const clientId = 'ymgal';
    const clientSecret = 'luna0327';
    try {
        const accessToken = await getAccessToken(clientId, clientSecret);
        const baseURL = 'https://www.ymgal.games';
        const url = new URL('/open/archive/search-game', baseURL);
        url.searchParams.append('mode', 'list');
        url.searchParams.append('keyword', keyword);
        url.searchParams.append('pageNum', pageNum);
        url.searchParams.append('pageSize', pageSize);

        const headers = new Headers();
        headers.append('Accept', 'application/json;charset=utf-8');
        headers.append('Authorization', `Bearer ${accessToken}`);
        headers.append('version', '1');

        const response = await fetch(url, {
            method: 'GET',
            headers: headers
        });
        const data = await response.json();
        return data;
    } catch (error) {
        log.error('Error in searchGameList:', error);
        throw error;
    }
}

async function searchGameId(gid) {
    const clientId = 'ymgal';
    const clientSecret = 'luna0327';
    try {
        const accessToken = await getAccessToken(clientId, clientSecret);
        const baseURL = 'https://www.ymgal.games';
        const url = new URL('/open/archive', baseURL);
        // url.searchParams.append('mode', 'id');
        url.searchParams.append('gid', gid);

        const headers = new Headers();
        headers.append('Accept', 'application/json;charset=utf-8');
        headers.append('Authorization', `Bearer ${accessToken}`);
        headers.append('version', '1');

        const response = await fetch(url, {
            method: 'GET',
            headers: headers
        });
        const data = await response.json();
        return data;
    } catch (error) {
        log.error('Error in searchGameId:', error);
        throw error;
    }
}

async function searchGameNamebyId(gid) {
    const clientId = 'ymgal';
    const clientSecret = 'luna0327';
    try {
        const accessToken = await getAccessToken(clientId, clientSecret);
        const baseURL = 'https://www.ymgal.games';
        const url = new URL('/open/archive', baseURL);
        // url.searchParams.append('mode', 'id');
        url.searchParams.append('gid', gid);

        const headers = new Headers();
        headers.append('Accept', 'application/json;charset=utf-8');
        headers.append('Authorization', `Bearer ${accessToken}`);
        headers.append('version', '1');

        const response = await fetch(url, {
            method: 'GET',
            headers: headers
        });
        const data = await response.json();
        return data.data.game.name;
    } catch (error) {
        log.error('Error in searchGameNamebyId:', error);
        throw error;
    }
}

async function searchCharacterId(cid) {
    const clientId = 'ymgal';
    const clientSecret = 'luna0327';
    try {
        const accessToken = await getAccessToken(clientId, clientSecret);
        const baseURL = 'https://www.ymgal.games';
        const url = new URL('/open/archive', baseURL);
        // url.searchParams.append('mode', 'character');
        url.searchParams.append('cid', cid);

        const headers = new Headers();
        headers.append('Accept', 'application/json;charset=utf-8');
        headers.append('Authorization', `Bearer ${accessToken}`);
        headers.append('version', '1');

        const response = await fetch(url, {
            method: 'GET',
            headers: headers
        });
        const data = await response.json();
        return data;

    } catch (error) {
        log.error('Error in searchCharacterId:', error);
        throw error;
    }
}

async function searchDeveloperId(oid) {
    const clientId = 'ymgal';
    const clientSecret = 'luna0327';
    try {
        const accessToken = await getAccessToken(clientId, clientSecret);
        const baseURL = 'https://www.ymgal.games';
        const url = new URL('/open/archive', baseURL);
        // url.searchParams.append('mode', 'developer');
        url.searchParams.append('orgId', oid);

        const headers = new Headers();
        headers.append('Accept', 'application/json;charset=utf-8');
        headers.append('Authorization', `Bearer ${accessToken}`);
        headers.append('version', '1');

        const response = await fetch(url, {
            method: 'GET',
            headers: headers
        });
        const data = await response.json();
        return data.data.org.name;
    } catch (error) {
        log.error('Error in searchDeveloperId:', error);
        throw error;
    }
}

function getCurrentDate() {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
}

//organize一个游戏的数据结构，但数据为空，只有游戏名
async function organizeGameDataEmpty(name, id, mainWindow, dataPath, filePath, resPath, gamePath) {
    try {
        //不请求API，直接组织数据
        //根据name生成一个由0和4位正整数组成的字符串
        if (gamePath !== '') {
            gamePath = gamePath.replace(/\\/g, '/');
        }
        retry(() => addNewGameToData(id, '', '', filePath, resPath), 3, mainWindow);
        const data = {
            [`${id}`]: {
                detail: {
                    name: name,
                    chineseName: "",
                    extensionName: [],
                    introduction: "",
                    id: id,
                    gid: "",
                    vid: 0,
                    cover: `/games/${id}/cover.webp`,
                    icon: `/games/${id}/icon.png`,
                    backgroundImage: `/games/${id}/background.webp`,
                    savePath: "",
                    gamePath: gamePath,
                    startWithLe: false,
                    volume: 0,
                    addDate: getCurrentDate(),
                    gameDuration: 0,
                    lastVisitDate: "",
                    frequency: 0,
                    playStatus: 0,
                    moreEntry: "",
                    typeDesc: "",
                    developer: "",
                    developerId: 0,
                    releaseDate: "",
                    restricted: "",
                    websites: [],
                    releases: [],
                    staff: {}
                },
                characters: [],
                saves: [],
                memories: []
            }
        };
        await retry(() => addObjectToJsonFile(data, path.join(dataPath, 'data.json')), 3, mainWindow);
        mainWindow.webContents.send('add-game-log', `[success] 成功处理游戏 ${name} 的数据。`);
        return data;
    } catch (error) {
        mainWindow.webContents.send('add-game-log', `[error] 获取游戏数据时出错：${error}`);
        log.error('Error in organizeGameData:', error);
        throw error;
    }
}

import crypto from 'crypto';

function generateNineDigitNumber(inputString) {
    // 计算输入字符串的MD5哈希值
    const hash = crypto.createHash('md5').update(inputString).digest('hex');

    // 将哈希值转换为数字（取前8位十六进制，转为十进制）
    const number = parseInt(hash.slice(0, 8), 16);

    // 对900000000取模，然后加上100000000，确保结果为9位数且不以0开头
    const nineDigitNumber = (number % 900000000) + 100000000;

    return nineDigitNumber.toString();
}

//更新一个游戏的数据，传入id，gid，主窗口，数据路径
async function updateGameMetaData(id, gid, mainWindow, dataPath) {
    try {
        const Details = await retry(() => searchGameId(gid), 3, mainWindow);
        const gameData = Details.data;
        const characters = [];
        const vid = await retry(() => getVIDByTitle(gameData.game.name), 3, mainWindow);
        for (const character of gameData.game.characters) {
            try {
                mainWindow.webContents.send('add-game-log', `[info] 正在获取角色 ${character.cid} 的数据...`);
                const characterDetails = await retry(() => searchCharacterId(character.cid), 3, mainWindow);
                mainWindow.webContents.send('add-game-log', `[info] 成功获取角色 ${character.cid} 的数据。`);
                let cover = `/games/${id}/characters/${character.cid}.webp`
                if (!characterDetails.data.character.mainImg) {
                    console.log(`未找到角色 ${character.cid} 的主图。`);
                    mainWindow.webContents.send('add-game-log', `[warning] 未找到角色 ${character.cid} 的主图。`);
                    cover = ''
                    continue;
                } else {
                    mainWindow.webContents.send('add-game-log', `[info] 正在下载角色 ${character.cid} 的图片...`);
                    await retry(() => addCharacterImgToData(id, character.cid, characterDetails.data.character.mainImg, path.join(dataPath, 'games')), 3, mainWindow);
                    mainWindow.webContents.send('add-game-log', `[info] 成功下载角色 ${character.cid} 的图片。`);
                }
                let extensionName = []
                for (const extension of characterDetails.data.character.extensionName) {
                    extensionName.push(extension.name);
                }
                mainWindow.webContents.send('add-game-log', `[info] 正在获取角色 ${character.cid} 的VID...`);
                const vidc = await retry(() => getCharacterIDByName(characterDetails.data.character.name, vid), 3, mainWindow);
                mainWindow.webContents.send('add-game-log', `[info] 成功获取角色 ${character.cid} 的VID。`);
                characters.push({
                    name: characterDetails.data.character.name,
                    chineseName: characterDetails.data.character.chineseName,
                    introduction: characterDetails.data.character.introduction,
                    cid: character.cid,
                    vid: vidc,
                    cover: cover,
                    extensionName: extensionName,
                    birthday: characterDetails.data.character.birthday && characterDetails.data.character.birthday.replace(/^.{5}/, ''),
                    gender: characterDetails.data.character.gender,
                    websites: [{ "title": "月幕Galgame", "url": `https://www.ymgal.games/ca${character.cid}` }, { "title": "VNDB", "url": `https://vndb.org/${vidc}` }]
                });
            } catch (error) {
                mainWindow.webContents.send('add-game-log', `[error] 获取角色 ${character.cid} 的数据时出错：${error}`);
                log.error(`获取角色 ${character.cid} 的数据时出错：`, error);
                throw error;
            }
        }
        const saves = [];

        const memory = [];

        const extensionName = []

        for (const extension of gameData.game.extensionName) {
            extensionName.push(extension.name);
        }
        let websites = []
        for (const web of gameData.game.website) {
            websites.push({ "title": web.title, "url": web.link });
        }
        websites.push({ "title": "月幕Galgame", "url": `https://www.ymgal.games/ga${gid}` }, { "title": "VNDB", "url": `https://vndb.org/${vid}` });
        const staff = {
            "脚本": [],
            "音乐": [],
            "原画": [],
            "歌曲": [],
            "人物设计": [],
            "监督": [],
            "其他": []
        };
        gameData.game.staff.forEach(staffMember => {
            const person = gameData.pidMapping[staffMember.pid];
            const name = person ? person.name : staffMember.empName;
            const staffInfo = {
                name: name,
                pid: staffMember.pid,
                empDesc: staffMember.empDesc
            };

            switch (staffMember.jobName) {
                case "脚本":
                    staff.脚本.push(staffInfo);
                    break;
                case "音乐":
                    staff.音乐.push(staffInfo);
                    break;
                case "原画":
                    staff.原画.push(staffInfo);
                    break;
                case "歌曲":
                    staff.歌曲.push(staffInfo);
                    break;
                case "导演/监督":
                    staff.监督.push(staffInfo);
                    break;
                default:
                    if (staffMember?.empDesc?.includes("人物设计")) {
                        staff.人物设计.push(staffInfo);
                    } else {
                        staff.其他.push(staffInfo);
                    }
            }
        });

        // Remove empty staff categories
        for (const category in staff) {
            if (staff[category].length === 0) {
                delete staff[category];
            }
        }

        let sizeInMB = 0;
        let icon = '';

        // 更新data.json文件中的数据，保留原有数据中的游戏时长、最后访问日期、访问频率、游戏状态
        // 在函数末尾，return data; 之前添加以下代码：

        // 读取现有的 data.json 文件
        let existingData = {};
        try {
            const dataFilePath = path.join(dataPath, 'data.json');
            existingData = await getGameData(dataFilePath);
        } catch (error) {
            console.error('读取现有 data.json 文件时出错:', error);
            mainWindow.webContents.send('add-game-log', `[error] 读取现有 data.json 文件时出错: ${error}`);
        }

        // 准备新的游戏数据
        const newGameData = {
            detail: {
                name: gameData.game.name,
                chineseName: gameData.game.chineseName,
                extensionName: extensionName,
                introduction: gameData.game.introduction,
                id: id,
                gid: `ga${gameData.game.gid}`,
                vid: vid,
                cover: `/games/${id}/cover.webp`,
                icon: icon,
                backgroundImage: `/games/${id}/background.webp`,
                savePath: '',
                gamePath: '',
                startWithLe: false,
                volume: Number(sizeInMB),
                addDate: getCurrentDate(),
                gameDuration: 0,
                lastVisitDate: "",
                frequency: 0,
                playStatus: 0,
                moreEntry: gameData.game.moreEntry,
                typeDesc: gameData.game.typeDesc,
                developer: await retry(() => searchDeveloperId(gameData.game.developerId), 3, mainWindow),
                developerId: gameData.game.developerId,
                releaseDate: gameData.game.releaseDate,
                restricted: gameData.game.restricted,
                websites: websites,
                releases: gameData.game.releases,
                staff: staff
            },
            characters: characters,
            saves: saves,
            memories: memory
        };

        // 保留原有数据中的特定字段
        if (existingData[id]) {
            newGameData.detail.gameDuration = existingData[id].detail.gameDuration || 0;
            newGameData.detail.savePath = existingData[id].detail.savePath || 0;
            newGameData.detail.gamePath = existingData[id].detail.gamePath || 0;
            newGameData.detail.icon = existingData[id].detail.icon || '';
            newGameData.detail.lastVisitDate = existingData[id].detail.lastVisitDate || "";
            newGameData.detail.frequency = existingData[id].detail.frequency || 0;
            newGameData.detail.playStatus = existingData[id].detail.playStatus || 0;
        }

        // 更新 data 对象
        existingData[id] = newGameData;

        // 将更新后的数据写入 data.json 文件
        try {
            const dataFilePath = path.join(dataPath, 'data.json');
            await updateGameData(existingData, dataFilePath);
        } catch (error) {
            console.error('写入 data.json 文件时出错:', error);
            mainWindow.webContents.send('add-game-log', `[error] 写入 data.json 文件时出错: ${error}`);
        }

        mainWindow.webContents.send('add-game-log', `[success] 成功处理游戏 ${gameData.game.name} 的数据。`);
        return existingData;
    } catch (error) {
        mainWindow.webContents.send('add-game-log', `[error] 获取游戏数据时出错：${error}`);
        log.error('Error in organizeGameData:', error);
        throw error;
    }
}

async function organizeGameData(gid, savePath, gamePath, mainWindow, dataPath) {
    try {
        const Details = await retry(() => searchGameId(gid), 3, mainWindow);
        const gameData = Details.data;
        const id = generateNineDigitNumber(gameData.game.name);
        const characters = [];
        const vid = await retry(() => getVIDByTitle(gameData.game.name), 3, mainWindow);
        for (const character of gameData.game.characters) {
            try {
                mainWindow.webContents.send('add-game-log', `[info] 正在获取角色 ${character.cid} 的数据...`);
                const characterDetails = await retry(() => searchCharacterId(character.cid), 3, mainWindow);
                mainWindow.webContents.send('add-game-log', `[info] 成功获取角色 ${character.cid} 的数据。`);
                let cover = `/games/${id}/characters/${character.cid}.webp`
                if (!characterDetails.data.character.mainImg) {
                    console.log(`未找到角色 ${character.cid} 的主图。`);
                    mainWindow.webContents.send('add-game-log', `[warning] 未找到角色 ${character.cid} 的主图。`);
                    cover = ''
                    continue;
                } else {
                    mainWindow.webContents.send('add-game-log', `[info] 正在下载角色 ${character.cid} 的图片...`);
                    await retry(() => addCharacterImgToData(id, character.cid, characterDetails.data.character.mainImg, path.join(dataPath, 'games')), 3, mainWindow);
                    mainWindow.webContents.send('add-game-log', `[info] 成功下载角色 ${character.cid} 的图片。`);
                }
                let extensionName = []
                for (const extension of characterDetails.data.character.extensionName) {
                    extensionName.push(extension.name);
                }
                mainWindow.webContents.send('add-game-log', `[info] 正在获取角色 ${character.cid} 的VID...`);
                const vidc = await retry(() => getCharacterIDByName(characterDetails.data.character.name, vid), 3, mainWindow);
                mainWindow.webContents.send('add-game-log', `[info] 成功获取角色 ${character.cid} 的VID。`);
                characters.push({
                    name: characterDetails.data.character.name,
                    chineseName: characterDetails.data.character.chineseName,
                    introduction: characterDetails.data.character.introduction,
                    cid: character.cid,
                    vid: vidc,
                    cover: cover,
                    extensionName: extensionName,
                    birthday: characterDetails.data.character.birthday && characterDetails.data.character.birthday.replace(/^.{5}/, ''),
                    gender: characterDetails.data.character.gender,
                    websites: [{ "title": "月幕Galgame", "url": `https://www.ymgal.games/ca${character.cid}` }, { "title": "VNDB", "url": `https://vndb.org/${vidc}` }]
                });
            } catch (error) {
                mainWindow.webContents.send('add-game-log', `[error] 获取角色 ${character.cid} 的数据时出错：${error}`);
                log.error(`获取角色 ${character.cid} 的数据时出错：`, error);
                throw error;
            }
        }
        const saves = [];

        const memory = [];

        const extensionName = []

        for (const extension of gameData.game.extensionName) {
            extensionName.push(extension.name);
        }
        let websites = []
        for (const web of gameData.game.website) {
            websites.push({ "title": web.title, "url": web.link });
        }
        websites.push({ "title": "月幕Galgame", "url": `https://www.ymgal.games/ga${gid}` }, { "title": "VNDB", "url": `https://vndb.org/${vid}` });
        const staff = {
            "脚本": [],
            "音乐": [],
            "原画": [],
            "歌曲": [],
            "人物设计": [],
            "监督": [],
            "其他": []
        };
        gameData.game.staff.forEach(staffMember => {
            const person = gameData.pidMapping[staffMember.pid];
            const name = person ? person.name : staffMember.empName;
            const staffInfo = {
                name: name,
                pid: staffMember.pid,
                empDesc: staffMember.empDesc
            };

            switch (staffMember.jobName) {
                case "脚本":
                    staff.脚本.push(staffInfo);
                    break;
                case "音乐":
                    staff.音乐.push(staffInfo);
                    break;
                case "原画":
                    staff.原画.push(staffInfo);
                    break;
                case "歌曲":
                    staff.歌曲.push(staffInfo);
                    break;
                case "导演/监督":
                    staff.监督.push(staffInfo);
                    break;
                default:
                    if (staffMember?.empDesc?.includes("人物设计")) {
                        staff.人物设计.push(staffInfo);
                    } else {
                        staff.其他.push(staffInfo);
                    }
            }
        });

        // Remove empty staff categories
        for (const category in staff) {
            if (staff[category].length === 0) {
                delete staff[category];
            }
        }

        let sizeInMB = 0;
        let icon = '';

        if (gamePath !== '') {
            try {
                gamePath = gamePath.replace(/\\/g, '/');
                const size = await getFolderSize.loose(path.dirname(gamePath), { bigint: true });
                sizeInMB = Number((size / BigInt(1024 * 1024))).toFixed(0);
                icon = `/games/${gid}/icon.png`;
            } catch (error) {
                console.error('Error calculating folder size:', error);
            }
        }

        if (savePath !== '') {
            savePath = savePath.replace(/\\/g, '/');
        }


        const data = {
            [`${id}`]: {
                detail: {
                    name: gameData.game.name,
                    chineseName: gameData.game.chineseName,
                    extensionName: extensionName,
                    introduction: gameData.game.introduction,
                    id: id,
                    gid: `ga${gameData.game.gid}`,
                    vid: vid,
                    cover: `/games/${id}/cover.webp`,
                    icon: icon,
                    backgroundImage: `/games/${id}/background.webp`,
                    savePath: savePath,
                    gamePath: gamePath,
                    startWithLe: false,
                    volume: Number(sizeInMB),
                    addDate: getCurrentDate(),
                    gameDuration: 0,
                    lastVisitDate: "",
                    frequency: 0,
                    playStatus: 0,
                    moreEntry: gameData.game.moreEntry,
                    typeDesc: gameData.game.typeDesc,
                    developer: await retry(() => searchDeveloperId(gameData.game.developerId), 3, mainWindow),
                    developerId: gameData.game.developerId,
                    releaseDate: gameData.game.releaseDate,
                    restricted: gameData.game.restricted,
                    websites: websites,
                    releases: gameData.game.releases,
                    staff: staff
                },
                characters: characters,
                saves: saves,
                memories: memory
            }
        };
        await retry(() => addObjectToJsonFile(data, path.join(dataPath, 'data.json')), 3, mainWindow);
        mainWindow.webContents.send('add-game-log', `[success] 成功处理游戏 ${gameData.game.name} 的数据。`);
        return data;
    } catch (error) {
        mainWindow.webContents.send('add-game-log', `[error] 获取游戏数据时出错：${error}`);
        log.error('Error in organizeGameData:', error);
        throw error;
    }
}

// 封装API请求函数
async function queryVNDB(filters, fields) {
    try {
        const response = await fetch('https://api.vndb.org/kana/vn', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                filters: filters,
                fields: fields
            }),
        });
        return await response.json();
    } catch (error) {
        log.error("查询 VNDB API 时出错:", error);
        throw error;
    }
}

// 获取游戏截图
async function getScreenshotsByTitle(title) {
    try {
        const data = await queryVNDB(["search", "=", title], "title, screenshots{url}");
        if (data.results.length > 0) {
            const vn = data.results[0];
            console.log(`获取到 "${vn.title}" 的截图:`);
            return vn.screenshots.map(screenshot => screenshot.url);
        } else {
            console.log(`未找到标题为 "${title}" 的视觉小说。`);
            if (title.includes('/')) {
                return await getScreenshotsByTitle(title.split('/')[0]);
            } else {
                return [];
            }
        }
    } catch (error) {
        log.error("获取截图时出错:", error);
        throw error;
    }
}

// 获取游戏封面
async function getCoverByTitle(title) {
    try {
        const data = await queryVNDB(["search", "=", title], "title, image{url}");
        if (data.results.length > 0) {
            const vn = data.results[0];
            if (vn.image) {
                console.log(`获取到 "${vn.title}" 的封面:`);
                return vn.image.url;
            } else {
                console.log(`"${vn.title}" 没有封面图片。`);
                return '';
            }
        } else {
            console.log(`未找到标题为 "${title}" 的视觉小说。`);
            if (title.includes('/')) {
                return await getCoverByTitle(title.split('/')[0]);
            } else {
                return '';
            }
        }
    } catch (error) {
        log.error("获取封面时出错:", error);
        throw error;
    }
}

async function getVIDByTitle(title) {
    try {
        const data = await queryVNDB(["search", "=", title], "id, title");
        if (data.results.length > 0) {
            const vn = data.results[0];
            console.log(`获取到 "${vn.title}" 的ID:`);
            return vn.id;
        } else {
            console.log(`未找到标题为 "${title}" 的视觉小说。`);
            if (title.includes('/')) {
                return await getVIDByTitle(title.split('/')[0]);
            } else {
                return null;
            }
        }
    } catch (error) {
        log.error("获取ID时出错:", error);
        throw error;
    }
}

async function queryVNDBc(filters, fields) {
    try {
        const response = await fetch('https://api.vndb.org/kana/character', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify({
                filters: filters,
                fields: fields
            }),
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const contentType = response.headers.get("content-type");
        if (!contentType || !contentType.includes("application/json")) {
            throw new TypeError("Oops, we haven't got JSON!");
        }

        return await response.json();
    } catch (error) {
        log.error("查询 VNDB API 时出错:", error);
        throw error;
    }
}

async function getCharacterIDByName(name, vnId) {
    try {
        if (vnId === null) {
            return null;
        }
        const filters = ["and",
            ["search", "=", name],
            ["vn", "=", ["id", "=", vnId]]
        ];
        const fields = "id,name";
        console.log("发送到 API 的过滤器:", JSON.stringify(filters));
        console.log("发送到 API 的字段:", fields);

        const data = await queryVNDBc(filters, fields);

        if (data.results && data.results.length > 0) {
            const character = data.results[0];
            console.log(`获取到角色 "${character.name}" 的ID: ${character.id}`);
            return character.id;
        } else {
            console.log(`未找到名为 "${name}" 的角色。`);
            return null;
        }
    } catch (error) {
        log.error("获取角色ID时出错:", error);
        throw error;
    }
}

export { searchGameList, searchGameId, searchGameDetails, getScreenshotsByTitle, getCoverByTitle, organizeGameData, searchCharacterId, searchGameNamebyId, organizeGameDataEmpty, updateGameMetaData };
