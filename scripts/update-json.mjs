import fs from 'fs/promises';
import path from 'path';

function updateNestedObject(obj, updates) {
    for (const [key, value] of Object.entries(updates)) {
        if (typeof value === 'object' && value !== null) {
            if (!obj.hasOwnProperty(key)) {
                obj[key] = {};
            }
            updateNestedObject(obj[key], value);
        }
        else {
            if (!obj.hasOwnProperty(key)) {
                obj[key] = value;
            }
        }
    }
}

async function updateJsonFile(jsonPath, newPairs, isTopLevel = false) {
    try {
        await fs.access(jsonPath);
    } catch (error) {
        console.log(`JSON 文件不存在：${jsonPath}`);
        return false;
    }

    try {
        const jsonContent = await fs.readFile(jsonPath, 'utf8');
        let json = JSON.parse(jsonContent);

        if (isTopLevel) {
            json = { ...json, ...newPairs };
        } else {
            for (const key in json) {
                if (json.hasOwnProperty(key)) {
                    updateNestedObject(json[key], newPairs);
                }
            }
        }

        await fs.writeFile(jsonPath, JSON.stringify(json, null, 2));
        console.log(`${jsonPath} 文件已成功更新。`);
        return true;
    }
    catch (error) {
        console.log(`无法解析或更新 JSON 文件：${jsonPath}`);
        console.log(error.message);
        return false;
    }
}

export async function initData() {
    const dataJsonPath = path.join(process.env.APPDATA, 'vnite', 'app', 'data', 'data.json');
    const configJsonPath = path.join(process.env.APPDATA, 'vnite', 'app', 'config', 'config.json');
    const categoryJsonPath = path.join(process.env.APPDATA, 'vnite', 'app', 'data', 'categories.json');
    const initDirPath = path.join(process.env.APPDATA, 'vnite', 'app');
    const pathsJsonPath = path.join(process.env.APPDATA, 'vnite', 'app', 'path');

    try {
        await fs.access(initDirPath);
        console.log(`${initDirPath} 文件夹已存在，无需创建。`);
    } catch (error) {
        const initDataPath = path.join(process.env.APPDATA, 'vnite', 'app', 'data');
        const initConfigPath = path.join(process.env.APPDATA, 'vnite', 'app', 'config');
        await fs.mkdir(initDataPath, { recursive: true });
        await fs.mkdir(initConfigPath, { recursive: true });

        const dataJson = {};
        await fs.writeFile(dataJsonPath, JSON.stringify(dataJson, null, 2));

        const configJson = {
            cloudSync: {
                enabled: false,
                mode: "github",
                webdav: {
                    url: "",
                    path: "",
                    username: "",
                    password: "",
                    lastSyncTime: ""
                },
                github: {
                    clientId: "Ov23liVrFw4AK7oYgYNm",
                    clientSecret: "a67c7a575870e7e4469abf74d4d81c3ba7beb7d5",
                    username: "",
                    accessToken: "",
                    repoUrl: "",
                    lastSyncTime: ""
                }
            },
            advance: {
                lePath: ""
            }
        };
        await fs.writeFile(configJsonPath, JSON.stringify(configJson, null, 2));
        console.log(`${initDirPath} 文件夹已成功创建。`);
    }

    //如果app下存在.git文件夹，将其删除
    const gitPath = path.join(process.env.APPDATA, 'vnite', 'app', '.git');
    try {
        await fs.access(gitPath);
        await fs.rm(gitPath, { recursive: true, force: true });
        console.log(`${gitPath} 文件夹已删除。`);
    } catch (error) {
        console.log(`${gitPath} 文件夹不存在，无需删除。`);
    }

    // 更新 data.json
    const dataNewPairs = {
        startWithLe: false
    };
    await updateJsonFile(dataJsonPath, dataNewPairs);

    // 更新 config.json
    const configNewPairs = {
        general: {
            theme: "default",
            language: "en",
            quitToTray: true
        },
        advance: {
            lePath: ''
        },
        others: {
            posterWall: {
                sortOrder: 'desc',
                sortBy: 'name'
            }
        }
    };
    await updateJsonFile(configJsonPath, configNewPairs, true);

    try {
        await fs.access(categoryJsonPath);
        console.log(`${categoryJsonPath} 文件已存在，无需创建。`);
    } catch (error) {
        const categoryJson = [{ id: 0, name: '所有游戏', games: [] }];
        const dataJsonContent = await fs.readFile(dataJsonPath, 'utf8');
        const dataJson = JSON.parse(dataJsonContent);
        for (const gameId in dataJson) {
            if (dataJson.hasOwnProperty(gameId)) {
                categoryJson[0].games.push(gameId);
            }
        }
        await fs.writeFile(categoryJsonPath, JSON.stringify(categoryJson, null, 2));
        console.log(`${categoryJsonPath} 文件已成功创建。`);
    }

    // paths.json不存在时创建
    try {
        await fs.access(pathsJsonPath);
        console.log(`${pathsJsonPath} 文件已存在，无需创建。`);
    } catch (error) {
        // 将data.json中的gamePath和savePath添加到paths.json，格式为{id: {id: '', gamePath: data中对应的gamePath, savePath: data中对应的savePath}}
        await fs.mkdir(pathsJsonPath, { recursive: true });
        const pathsJson = {};
        const dataJsonContent = await fs.readFile(dataJsonPath, 'utf8');
        const dataJson = JSON.parse(dataJsonContent);
        for (const gameId in dataJson) {
            if (dataJson.hasOwnProperty(gameId)) {
                pathsJson[gameId] = {
                    id: gameId,
                    gamePath: dataJson[gameId].detail.gamePath,
                    savePath: dataJson[gameId].detail.savePath
                };
            }
        }
        await fs.writeFile(path.join(pathsJsonPath, 'paths.json'), JSON.stringify(pathsJson, null, 2));
        console.log(`${pathsJsonPath} 文件已成功创建。`);
    }

}

// await initData();