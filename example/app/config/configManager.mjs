import { promises as fs } from 'fs';
import { getConfigPath } from '../../../../main';


async function addObjectToJsonFile(newObject) {
  // const __filename = fileURLToPath(import.meta.url);
  // const __dirname = dirname(__filename);
  const filePath = getConfigPath('config.json');
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

async function getConfigData() {
  const filePath = getConfigPath('config.json');
  try {
    // Read the JSON file
    const data = await fs.readFile(filePath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading JSON file:', error);
    return [];
  }

}

async function updateConfigData(newData) {
  const filePath = getConfigPath('config.json');
  try {
    // 将更新后的数组转换回 JSON 字符串
    const updatedJsonString = JSON.stringify(newData, null, 2);

    // 将更新后的 JSON 写回文件
    await fs.writeFile(filePath, updatedJsonString, 'utf8');

    console.log('设置已成功更新');
  } catch (error) {
    console.error('更新设置时出错:', error);
  }
}

export { addObjectToJsonFile, getConfigData, updateConfigData };