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

// 更新 data.json
const dataJsonPath = path.join(process.env.APPDATA, 'vnite', 'app', 'data', 'data.json');
const dataNewPairs = {
    startWithLe: false
};
updateJsonFile(dataJsonPath, dataNewPairs);

// 更新 config.json
const configJsonPath = path.join(process.env.APPDATA, 'vnite', 'app', 'config', 'config.json');
const configNewPairs = {
    advance: {
        lePath: ''
        // 其它配置项
    }
    // 其它配置项
};
updateJsonFile(configJsonPath, configNewPairs, true);