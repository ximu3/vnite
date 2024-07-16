import fetch from 'node-fetch';

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

async function searchGameList(keyword, pageNum = 1, pageSize = 30) {
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

export { searchGameList, searchGameId };
