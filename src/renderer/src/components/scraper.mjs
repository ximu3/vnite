import fetch from 'node-fetch';
import { addCharacterImgToData, addNewGameToData } from '..data/dataManager.mjs';

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

async function organizeGameData(gid, savePath, gamePath) {
    try {
        const Details = await searchGameId(gid);
        const gameDetails = Details.data.game;
        const characters = [];
        for (const character of gameDetails.characters) {
            const characterDetails = await searchCharacterId(character.cid);
            await addCharacterImgToData(gid, character.cid, characterDetails.data.character.mainImg);
            let extensionName = []
            for (const extension of characterDetails.data.character.extensionName) {
                extensionName.push(extension.name);
            }
            characters.push({
                name: character.name,
                chineseName: character.chineseName,
                introduction: character.introduction,
                cId: character.cid,
                // vndbId: character.vndbId,
                cover: `./${gid}/characters/${character.cid}.webp`,
                extensionName: extensionName,
                birthday: character.birthday,
                gender: character.gender,
                website: [{"title": "月幕Galgame", "url": `https://www.ymgal.games/ca${character.cid}`}]
            });
        }
        const saves = [];
        // for (const save of gameDetails.saves) {
        //     saves.push({
        //         time: save.time,
        //         tips: save.tips,
        //         path: save.path
        //     });
        // }
        const memory = [];
        // for (const mem of gameDetails.memory) {
        //     memory.push({
        //         img: mem.img,
        //         tips: mem.tips
        //     });
        // }
        const extensionName = []
        for (const extension of gameDetails.extensionName) {
            extensionName.push(extension.name);
        }
        let website = []
        for (const web of gameDetails.website) {
            website.push({"title": web.title, "url": web.link});
        }
        website.push({"title": "月幕Galgame", "url": `https://www.ymgal.games/ga${gid}`}, {"title": "VNDB", "url": `https://vndb.org/v${vndbId}`});
        const data = {
            detail: {
                name: gameDetails.name,
                chineseName: gameDetails.chineseName,
                extensionName: extensionName,
                introduction: gameDetails.introduction,
                gId: gameDetails.gid,
                vndbId: vndbId,
                cover: `./${gid}/cover.webp`,
                backgroundImage: `./${gid}/background.webp`,
                savePath: savePath,
                gamePath: gamePath,
                moreEntry: gameDetails.moreEntry,
                typeDesc: gameDetails.typeDesc,
                releaseDate: gameDetails.releaseDate,
                restricted: gameDetails.restricted,
                website: website,
                releases: gameDetails.releases,
                staff: gameDetails.detail.staff
            },
            characters: characters,
            saves: saves,
            memory: memory
        };
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
//     fs.writeFile('gameDetails.json', jsonData, 'utf8', (err) => {
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

export { searchGameList, searchGameId, searchGameDetails, getScreenshotsByTitle, getCoverByTitle }
