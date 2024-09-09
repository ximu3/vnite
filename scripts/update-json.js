const fs = require('fs');
const path = require('path');

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

function updateJsonFile(jsonPath, newPairs, isTopLevel = false) {
    if (!fs.existsSync(jsonPath)) {
        console.log(`JSON 文件不存在：${jsonPath}`);
        return false;
    }

    try {
        const jsonContent = fs.readFileSync(jsonPath, 'utf8');
        let json = JSON.parse(jsonContent);

        if (isTopLevel) {
            // 直接合并顶级键值对
            json = { ...json, ...newPairs };
        } else {
            // 原有的嵌套更新逻辑
            for (const key in json) {
                if (json.hasOwnProperty(key)) {
                    updateNestedObject(json[key], newPairs);
                }
            }
        }

        fs.writeFileSync(jsonPath, JSON.stringify(json, null, 2));
        console.log(`${jsonPath} 文件已成功更新。`);
        return true;
    }
    catch (error) {
        console.log(`无法解析或更新 JSON 文件：${jsonPath}`);
        console.log(error.message);
        return false;
    }
}

const dataJsonPath = path.join(process.env.APPDATA, 'vnite', 'app', 'data', 'data.json');
const configJsonPath = path.join(process.env.APPDATA, 'vnite', 'app', 'config', 'config.json');
const categoryJsonPath = path.join(process.env.APPDATA, 'vnite', 'app', 'data', 'categories.json');

// 先检测数据路径是否存在，不存在则创建并设置，存在则不做任何操作
const initDirPath = path.join(process.env.APPDATA, 'vnite', 'app');
if (!fs.existsSync(initDirPath)) {
    const initDataPath = path.join(process.env.APPDATA, 'vnite', 'app', 'data');
    const initConfigPath = path.join(process.env.APPDATA, 'vnite', 'app', 'config');
    fs.mkdirSync(initDataPath, { recursive: true });
    fs.mkdirSync(initConfigPath, { recursive: true });
    const dataJson = {}
    fs.writeFileSync(dataJsonPath, JSON.stringify(dataJson, null, 2));
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
    }
    fs.writeFileSync(configJsonPath, JSON.stringify(configJson, null, 2));
    console.log(`${initDirPath} 文件夹已成功创建。`);
} else {
    console.log(`${initDirPath} 文件夹已存在，无需创建。`);
}

// 更新 data.json
const dataNewPairs = {
    startWithLe: false
};
updateJsonFile(dataJsonPath, dataNewPairs);

// 更新 config.json

const configNewPairs = {
    advance: {
        lePath: ''
        // 其它配置项
    }
    // 其它配置项
};
updateJsonFile(configJsonPath, configNewPairs, true);

// 创建categories.json，先检测是否存在，不存在则创建并设置，存在则不做任何操作
if (!fs.existsSync(categoryJsonPath)) {
    // 创建格式如下的 category.json [{"id":0,"name":"所有游戏","games":[包含所有游戏的id]}] 请获取所有游戏的id并填入
    const categoryJson = [{ id: 0, name: '所有游戏', games: [] }];
    const dataJson = JSON.parse(fs.readFileSync(dataJsonPath, 'utf8'));
    // data格式为{"游戏id":{游戏信息}}
    for (const gameId in dataJson) {
        if (dataJson.hasOwnProperty(gameId)) {
            categoryJson[0].games.push(gameId);
        }
    }
    fs.writeFileSync(categoryJsonPath, JSON.stringify(categoryJson, null, 2));
    console.log(`${categoryJsonPath} 文件已成功创建。`);
} else {
    console.log(`${categoryJsonPath} 文件已存在，无需创建。`);
}
