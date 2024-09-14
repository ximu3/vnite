import { promises as fs } from 'fs';
import log from 'electron-log/main.js';

async function getCategoryData(dataPath) {
    try {
        const data = await fs.readFile(dataPath, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        log.error('Error reading JSON file:', error);
        return [];
    }
}

async function updateCategoryData(dataPath, newData) {
    try {
        const updatedJsonString = JSON.stringify(newData, null, 2);
        await fs.writeFile(dataPath, updatedJsonString, 'utf8');
        log.info('Category data successfully updated');
    }
    catch (error) {
        log.error('Error updating JSON file:', error);
        throw error;
    }
}

async function getNewId(data) {
    try {
        const id = data.length;
        return id;
    } catch (error) {
        log.error('Error getting new id:', error);
        throw error;
    }
}

async function addNewCategory(dataPath, categoryName) {
    try {
        const data = await getCategoryData(dataPath);
        const newId = await getNewId(data);
        const newCategory = {
            id: newId,
            name: categoryName,
            games: []
        };
        data.push(newCategory);
        await updateCategoryData(dataPath, data);
        return
    }
    catch (error) {
        log.error('Error adding new category:', error);
        throw error;
    }
}

async function addNewGameToCategory(dataPath, categoryId, gameId) {
    try {
        const data = await getCategoryData(dataPath);
        const category = data.find(category => category.id === categoryId);
        // Check if the game is already in the category
        if (category.games.includes(gameId)) {
            log.warn(`Game ${gameId} is already in category ${categoryId}`);
            return
        }
        category.games.push(gameId);
        await updateCategoryData(dataPath, data);
        return
    }
    catch (error) {
        log.error('Error adding new game:', error);
        throw error;
    }
}

async function deleteCategory(dataPath, categoryId) {
    try {
        const data = await getCategoryData(dataPath);
        const newData = data.filter(category => category.id !== categoryId);
        await updateCategoryData(dataPath, newData);
        return
    }
    catch (error) {
        log.error('Error deleting category:', error);
        throw error;
    }
}

async function deleteGameFromCategory(dataPath, categoryId, gameId) {
    try {
        const data = await getCategoryData(dataPath);
        const category = data.find(category => category.id === categoryId);
        category.games = category.games.filter(game => game !== gameId);
        await updateCategoryData(dataPath, data);
        return
    }
    catch (error) {
        log.error('Error deleting game:', error);
        throw error;
    }
}

async function deleteGameFromAllCategories(dataPath, gameId) {
    try {
        const data = await getCategoryData(dataPath);
        data.forEach(category => {
            category.games = category.games.filter(game => game !== gameId);
        });
        await updateCategoryData(dataPath, data);
        return
    }
    catch (error) {
        log.error('Error deleting game from all categories:', error);
        throw error;
    }
}

// 把指定id的分类上移一位
async function moveCategoryUp(dataPath, categoryId) {
    try {
        const data = await getCategoryData(dataPath);
        const index = data.findIndex(category => category.id === categoryId);
        if (index === 0) {
            return;
        }
        const temp = data[index];
        data[index] = data[index - 1];
        data[index - 1] = temp;
        await updateCategoryData(dataPath, data);
        return
    }
    catch (error) {
        log.error('Error moving category up:', error);
        throw error;
    }
}

// 把指定id的分类下移一位
async function moveCategoryDown(dataPath, categoryId) {
    try {
        const data = await getCategoryData(dataPath);
        const index = data.findIndex(category => category.id === categoryId);
        if (index === data.length - 1) {
            return;
        }
        const temp = data[index];
        data[index] = data[index + 1];
        data[index + 1] = temp;
        await updateCategoryData(dataPath, data);
        return
    }
    catch (error) {
        log.error('Error moving category down:', error);
        throw error;
    }
}

// 把指定id的游戏上移一位
async function moveGameUp(dataPath, categoryId, gameId) {
    try {
        const data = await getCategoryData(dataPath);
        const category = data.find(category => category.id === categoryId);
        const index = category.games.findIndex(game => game === gameId);
        if (index === 0) {
            return;
        }
        const temp = category.games[index];
        category.games[index] = category.games[index - 1];
        category.games[index - 1] = temp;
        await updateCategoryData(dataPath, data);
        return
    }
    catch (error) {
        log.error('Error moving game up:', error);
        throw error;
    }
}

// 把指定id的游戏下移一位
async function moveGameDown(dataPath, categoryId, gameId) {
    try {
        const data = await getCategoryData(dataPath);
        const category = data.find(category => category.id === categoryId);
        const index = category.games.findIndex(game => game === gameId);
        if (index === category.games.length - 1) {
            return;
        }
        const temp = category.games[index];
        category.games[index] = category.games[index + 1];
        category.games[index + 1] = temp;
        await updateCategoryData(dataPath, data);
        return
    }
    catch (error) {
        log.error('Error moving game down:', error);
        throw error;
    }
}


export { getCategoryData, updateCategoryData, addNewCategory, addNewGameToCategory, deleteCategory, deleteGameFromCategory, moveCategoryUp, moveCategoryDown, moveGameUp, moveGameDown, deleteGameFromAllCategories };

