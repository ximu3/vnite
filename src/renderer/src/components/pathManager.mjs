import { promises as fs } from 'fs';
import log from 'electron-log/main.js';

export async function getPathData(dataPath) {
    try {
        const data = await fs.readFile(dataPath, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        log.error('Error reading JSON file:', error);
        return [];
    }
}

export async function updatePathData(dataPath, newData) {
    try {
        const updatedJsonString = JSON.stringify(newData, null, 2);
        await fs.writeFile(dataPath, updatedJsonString, 'utf8');
        log.info('Path data successfully updated');
    }
    catch (error) {
        log.error('Error updating JSON file:', error);
        throw error;
    }
}

export async function addNewGameToPath(id, gamePath = '', savePath = '', dataPath) {
    try {
        const data = await getPathData(dataPath);
        data[id] = {
            id: id,
            gamePath: gamePath,
            savePath: savePath
        }
        await updatePathData(dataPath, data);
        return
    } catch (error) {
        log.error('Error adding new game path:', error);
        throw error;
    }
}