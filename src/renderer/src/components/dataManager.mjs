import { promises as fs } from 'fs';
import fse from 'fs-extra';
import axios from 'axios';
import path from 'path';
import log from 'electron-log/main.js';


async function addObjectToJsonFile(newObject, filePath) {
    try {
        // 读取 JSON 文件
        const data = await fs.readFile(filePath, 'utf8');

        // 解析 JSON 数据
        let jsonObject = JSON.parse(data);

        // 确保 jsonObject 是一个对象
        if (typeof jsonObject !== 'object' || jsonObject === null) {
            jsonObject = {};
        }

        // 获取 newObject 的键和值
        const [[key, value]] = Object.entries(newObject);

        // 将新的键值对添加到 jsonObject
        jsonObject[key] = value;

        // 将更新后的对象转换回 JSON 字符串
        const updatedJsonString = JSON.stringify(jsonObject, null, 2);

        // 将更新后的 JSON 写回文件
        await fs.writeFile(filePath, updatedJsonString, 'utf8');

        log.info('新对象已成功添加到 JSON 文件');
    } catch (error) {
        log.error('添加对象到 JSON 文件时出错:', error);

    }
}

async function getGameData(filePath) {
    // const filePath = getDataPath('data.json');
    try {
        // Read the JSON file
        const data = await fs.readFile(filePath, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        log.error('Error reading JSON file:', error);
        return {};
    }

}

async function updateGameData(newData, filePath) {
    // const filePath = getDataPath('data.json');
    try {
        // 将更新后的数组转换回 JSON 字符串
        const updatedJsonString = JSON.stringify(newData, null, 2);

        // 将更新后的 JSON 写回文件
        await fs.writeFile(filePath, updatedJsonString, 'utf8');

        log.info('游戏数据已成功更新');
    } catch (error) {
        log.error('更新游戏数据时出错:', error);
    }
}

async function addNewGameToData(id, coverUrl, bgUrl, filePath, resPath) {
    // const __filename = fileURLToPath(import.meta.url);
    // const __dirname = dirname(__filename);

    const folderPath = path.join(filePath, `${id}`);
    const memoryFolderPath = path.join(folderPath, 'memories');
    const savesFolderPath = path.join(folderPath, 'saves');
    const characterFolderPath = path.join(folderPath, 'characters');
    const coverFilePath = path.join(folderPath, 'cover.webp');
    const bgFilePath = path.join(folderPath, 'background.webp');

    try {
        // Create the id folder
        await fs.mkdir(folderPath, { recursive: true });

        // Create the memory and saves folders
        await fs.mkdir(memoryFolderPath, { recursive: true });
        await fs.mkdir(savesFolderPath, { recursive: true });
        await fs.mkdir(characterFolderPath, { recursive: true });

        // Download and save the cover image
        if (coverUrl) {
            const coverResponse = await axios.get(coverUrl, { responseType: 'arraybuffer' });
            await fs.writeFile(coverFilePath, coverResponse.data);
        } else {
            await fs.copyFile(path.join(resPath, 'cover.webp'), coverFilePath);
        }

        // Download and save the background image
        if (bgUrl) {
            const bgResponse = await axios.get(bgUrl, { responseType: 'arraybuffer' });
            await fs.writeFile(bgFilePath, bgResponse.data);
        } else {
            await fs.copyFile(path.join(resPath, 'background.webp'), bgFilePath);
        }

        log.info('New game data has been added successfully');
    } catch (error) {
        log.error('Error adding new game data:', error);
        throw error;
    }
}

async function addCharacterImgToData(id, cid, imgUrls, filePath) {
    // const __filename = fileURLToPath(import.meta.url);
    // const __dirname = dirname(__filename);

    const folderPath = path.join(filePath, `${id}`);
    const characterFolderPath = path.join(folderPath, 'characters');
    const characterImgPath = path.join(characterFolderPath, `${cid}.webp`);

    try {
        // // Create the characters folder if it doesn't exist
        // if (!await fs.exists(characterFolderPath)) {
        //     await fs.mkdir(characterFolderPath);
        // }

        // Download and save the character image
        const characterResponse = await axios.get(imgUrls, { responseType: 'arraybuffer' });
        await fs.writeFile(characterImgPath, characterResponse.data);

        log.info('New character image has been added successfully');
    } catch (error) {
        log.error('Error adding new character image:', error);
        throw error;
    }

}

async function deleteGame(id, filePath) {
    try {
        // 读取 JSON 文件
        const data = await fs.readFile(path.join(filePath, 'data.json'), 'utf8');

        // 解析 JSON 数据
        let jsonObject = JSON.parse(data);

        // 确保 jsonObject 是一个对象
        if (typeof jsonObject !== 'object' || jsonObject === null) {
            throw new Error('Invalid data structure');
        }

        // 检查游戏 ID 是否存在
        if (!jsonObject.hasOwnProperty(id)) {
            log.error('Game not found');
            return
        }

        // 删除文件夹
        const folderPath = path.join(filePath, 'games', `${id}`);
        await fse.remove(folderPath);

        // 从对象中删除游戏
        delete jsonObject[id];

        // 将更新后的对象转换回 JSON 字符串
        const updatedJsonString = JSON.stringify(jsonObject, null, 2);

        // 将更新后的 JSON 写回文件
        await fs.writeFile(path.join(filePath, 'data.json'), updatedJsonString, 'utf8');

        console.log('游戏已成功删除');

    } catch (error) {
        console.error('删除游戏时出错:', error);
        throw error;
    }
}

// addNewGameToData('27702', 'https://t.vndb.org/sf/23/8523.jpg', 'https://t.vndb.org/sf/24/8524.jpg');

// addCharacterImgToData('123', '456', 'https://t.vndb.org/cv/23/8523.jpg');

export { addObjectToJsonFile, addNewGameToData, addCharacterImgToData, getGameData, updateGameData, deleteGame };