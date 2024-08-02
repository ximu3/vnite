import { promises as fs } from 'fs';
import axios from 'axios';
import path from 'path';


async function addObjectToJsonFile(newObject) {
    // const __filename = fileURLToPath(import.meta.url);
    // const __dirname = dirname(__filename);
    const filePath = 'src/renderer/src/data/data.json'
    try {
        // 读取 JSON 文件
        const data = await fs.readFile(filePath, 'utf8');

        // 解析 JSON 数据
        let jsonArray = JSON.parse(data);

        // 确保 jsonArray 是一个数组
        if (!Array.isArray(jsonArray)) {
            jsonArray = [];
        }

        // 添加新对象到数组
        jsonArray.push(newObject);

        // 将更新后的数组转换回 JSON 字符串
        const updatedJsonString = JSON.stringify(jsonArray, null, 2);

        // 将更新后的 JSON 写回文件
        await fs.writeFile(filePath, updatedJsonString, 'utf8');

        console.log('新对象已成功添加到 JSON 文件');
    } catch (error) {
        console.error('添加对象到 JSON 文件时出错:', error);
    }
}

async function getGameData() {
    const filePath = 'src/renderer/src/data/data.json'
    try {
        // Read the JSON file
        const data = await fs.readFile(filePath, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error('Error reading JSON file:', error);
        return [];
    }

}

async function updateGameData(newData) {
    const filePath = 'src/renderer/src/data/data.json'
    try {
        // 将更新后的数组转换回 JSON 字符串
        const updatedJsonString = JSON.stringify(newData, null, 2);

        // 将更新后的 JSON 写回文件
        await fs.writeFile(filePath, updatedJsonString, 'utf8');

        console.log('游戏数据已成功更新');
    } catch (error) {
        console.error('更新游戏数据时出错:', error);
    }
}

async function addNewGameToData(gid, coverUrl, bgUrl) {
    // const __filename = fileURLToPath(import.meta.url);
    // const __dirname = dirname(__filename);

    const folderPath = `src/renderer/public/${gid}`;
    const memoryFolderPath = path.join(folderPath, 'memory');
    const savesFolderPath = path.join(folderPath, 'saves');
    const characterFolderPath = path.join(folderPath, 'characters');
    const coverFilePath = path.join(folderPath, 'cover.webp');
    const bgFilePath = path.join(folderPath, 'background.webp');

    try {
        // Create the gid folder
        await fs.mkdir(folderPath);

        // Create the memory and saves folders
        await fs.mkdir(memoryFolderPath);
        await fs.mkdir(savesFolderPath);
        await fs.mkdir(characterFolderPath);

        // Download and save the cover image
        const coverResponse = await axios.get(coverUrl, { responseType: 'arraybuffer' });
        await fs.writeFile(coverFilePath, coverResponse.data);

        // Download and save the background image
        const bgResponse = await axios.get(bgUrl, { responseType: 'arraybuffer' });
        await fs.writeFile(bgFilePath, bgResponse.data);

        console.log('New game data has been added successfully');
    } catch (error) {
        console.error('Error adding new game data:', error);
    }
}

async function addCharacterImgToData(gid, cid, imgUrls) {
    // const __filename = fileURLToPath(import.meta.url);
    // const __dirname = dirname(__filename);

    const folderPath = `src/renderer/public/${gid}`;
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

        console.log('New character image has been added successfully');
    } catch (error) {
        console.error('Error adding new character image:', error);
    }

}

// addNewGameToData('27702', 'https://t.vndb.org/sf/23/8523.jpg', 'https://t.vndb.org/sf/24/8524.jpg');

// addCharacterImgToData('123', '456', 'https://t.vndb.org/cv/23/8523.jpg');

export { addObjectToJsonFile, addNewGameToData, addCharacterImgToData, getGameData, updateGameData };