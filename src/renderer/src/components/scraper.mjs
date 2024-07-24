import fetch from 'node-fetch';
import { addCharacterImgToData, addNewGameToData, addObjectToJsonFile } from '../data/dataManager.mjs';

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
        console.error('Error in getAccessToken:', error);
        throw error;
    }
}

// 定义查询游戏详情的函数
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
        console.error('Error in searchGameDetails:', error);
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
        console.error('Error in searchGameList:', error);
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
        console.error('Error in searchGameId:', error);
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
        console.error('Error in searchCharacterId:', error);
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
        console.error('Error in searchDeveloperId:', error);
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

async function organizeGameData(gid, savePath, gamePath) {
    try {
        const Details = await searchGameId(gid);
        const gameData = Details.data;
        const characters = [];
        const vid = await getVIDByTitle(gameData.game.name);
        for (const character of gameData.game.characters) {
            const characterDetails = await searchCharacterId(character.cid);
            let cover = `/${gid}/characters/${character.cid}.webp`
            if (!characterDetails.data.character.mainImg) {
                console.log(`未找到角色 ${character.cid} 的主图。`);
                cover = ''
                continue;
            }else{
                await addCharacterImgToData(gid, character.cid, characterDetails.data.character.mainImg);
            }
            let extensionName = []
            for (const extension of characterDetails.data.character.extensionName) {
                extensionName.push(extension.name);
            }
            const vidc = await getCharacterIDByName(characterDetails.data.character.name, vid);
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
        }
        const saves = [];
        // for (const save of gameData.saves) {
        //     saves.push({
        //         time: save.time,
        //         tips: save.tips,
        //         path: save.path
        //     });
        // }
        const memory = [];
        // for (const mem of gameData.memory) {
        //     memory.push({
        //         img: mem.img,
        //         tips: mem.tips
        //     });
        // }
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
                    if (staffMember.empDesc.includes("人物设计")) {
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



        // console.log(staff);
        const data = {
            detail: {
                name: gameData.game.name,
                chineseName: gameData.game.chineseName,
                extensionName: extensionName,
                introduction: gameData.game.introduction,
                gid: `ga${gameData.game.gid}`,
                vid: vid,
                cover: `/${gid}/cover.webp`,
                backgroundImage: `/${gid}/background.webp`,
                savePath: savePath.replace(/\\/g, '/'),
                gamePath: gamePath.replace(/\\/g, '/'),
                addDate: getCurrentDate(),
                gameDuration: 0,
                lastVisitDate: "",
                frequency: 0,
                playStatus: 0,
                moreEntry: gameData.game.moreEntry,
                typeDesc: gameData.game.typeDesc,
                developer: await searchDeveloperId(gameData.game.developerId),
                developerId: gameData.game.developerId,
                releaseDate: gameData.game.releaseDate,
                restricted: gameData.game.restricted,
                websites: websites,
                releases: gameData.game.releases,
                staff: staff
            },
            characters: characters,
            saves: saves,
            memory: memory
        };
        await addObjectToJsonFile(data);
        return data;
    } catch (error) {
        console.error('Error in organizeGameData:', error);
        throw error;
    }
}

// 封装API请求函数
async function queryVNDB(filters, fields) {
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
            return [];
        }
    } catch (error) {
        console.error("获取截图时出错:", error);
        return [];
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
                return null;
            }
        } else {
            console.log(`未找到标题为 "${title}" 的视觉小说。`);
            return null;
        }
    } catch (error) {
        console.error("获取封面时出错:", error);
        return null;
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
            return null;
        }
    } catch (error) {
        console.error("获取ID时出错:", error);
        return null;
    }
}

async function queryVNDBc(filters, fields) {
    const response = await fetch('https://api.vndb.org/kana/character', {
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
}

async function getCharacterIDByName(name, vnId) {
    try {
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
        console.error("获取角色ID时出错:", error);
        return null;
    }
}

// let data = {};

// data = await organizeGameData(27702, 11, 'C:\\Users\\Administrator\\AppData\\Roaming\\RenPy\\月に寄りそう乙女の作法\\saves', 'C:\\Users\\Administrator\\AppData\\Roaming\\RenPy\\月に寄りそう乙女の作法');
// // 将数据转换为JSON字符串
// const jsonData = JSON.stringify(data, null, 2); // 第二个参数null和第三个参数2确保JSON文件格式化美观

// // 写入文件
// fs.writeFile('data.json', jsonData, 'utf8', (err) => {
//     if (err) {
//         console.error('Failed to write to file:', err);
//     } else {
//         console.log('Data successfully written to file');
//     }
// });

// 使用示例
// async function example() {
//   const title = "Steins;Gate";

//   const screenshots = await getScreenshotsByTitle(title);
//   console.log(screenshots);

//   const cover = await getCoverByTitle(title);
//   console.log(cover);
// }

// example();

// 使用示例
// searchGameDetails('月に寄りそう乙女の作法').then(data => {
//     console.log('Game Details:', data);
// }).catch(error => {
//     console.error('Failed to fetch game details:', error);
// });

// searchGameList('月に寄りそう乙女の作法').then(data => {
//     console.log('Game List:', data);
//     // 将数据转换为JSON字符串
//     const jsonData = JSON.stringify(data, null, 2); // 第二个参数null和第三个参数2确保JSON文件格式化美观

//     // 写入文件
//     fs.writeFile('gameList.json', jsonData, 'utf8', (err) => {
//         if (err) {
//             console.error('Failed to write to file:', err);
//         } else {
//             console.log('Data successfully written to file');
//         }
//     });
// }).catch(error => {
//     console.error('Failed to fetch game list:', error);
// });

// searchGameDetails('月に寄りそう乙女の作法').then(data => {
//     console.log('Game Details:', data);
//     // 将数据转换为JSON字符串
//     const jsonData = JSON.stringify(data, null, 2); // 第二个参数null和第三个参数2确保JSON文件格式化美观

//     // 写入文件
//     fs.writeFile('gameData.json', jsonData, 'utf8', (err) => {
//         if (err) {
//             console.error('Failed to write to file:', err);
//         } else {
//             console.log('Data successfully written to file');
//         }
//     });
// }).catch(error => {
//     console.error('Failed to fetch game details:', error);
// });

// searchGameId(27702).then(data => {
//     console.log('Game ID:', data);
//     // 将数据转换为JSON字符串
//     const jsonData = JSON.stringify(data, null, 2); // 第二个参数null和第三个参数2确保JSON文件格式化美观

//     // 写入文件
//     fs.writeFile('gameId.json', jsonData, 'utf8', (err) => {
//         if (err) {
//             console.error('Failed to write to file:', err);
//         } else {
//             console.log('Data successfully written to file');
//         }
//     });
// }).catch(error => {
//     console.error('Failed to fetch game ID:', error);
// });

export { searchGameList, searchGameId, searchGameDetails, getScreenshotsByTitle, getCoverByTitle, organizeGameData, searchCharacterId };
