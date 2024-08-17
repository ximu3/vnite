import axios from 'axios';
import crypto from 'crypto';
import http from 'http';
import url from 'url';
import { shell } from 'electron';
import simpleGit from 'simple-git';
import { promises as fs } from 'fs';
import path from 'path';
import fse from 'fs-extra';

const PORT = 20721;
let server;

export function startAuthProcess(mainWindow, clientId, clientSecret) {
  return new Promise((resolve, reject) => {
    try {
      const state = crypto.randomBytes(16).toString('hex');
      const authUrl = `https://github.com/login/oauth/authorize?client_id=${clientId}&scope=repo&state=${state}`;

      server = http.createServer((req, res) => {
        const parsedUrl = url.parse(req.url, true);
        if (parsedUrl.pathname === '/callback') {
          const code = parsedUrl.query.code;
          const returnedState = parsedUrl.query.state;

          if (returnedState === state) {
            exchangeCodeForToken(code, mainWindow, clientId, clientSecret)
              .then(result => {
                res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
                res.end('认证成功!你可以关闭这个窗口了。');
                server.close();
                resolve(result);
              })
              .catch(error => {
                res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
                res.end('认证失败: ' + error.message);
                server.close();
                reject(error);
              });
          } else {
            res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
            res.end('认证失败:state不匹配');
            server.close();
            reject(new Error('State mismatch'));
          }
        }
      });

      server.listen(PORT, () => {
        console.log(`Server running on http://localhost:${PORT}`);
        shell.openExternal(authUrl);
      });
    } catch (e) {
      console.log(e)
      throw e;
    }
  });
}

async function exchangeCodeForToken(code, mainWindow, clientId, clientSecret) {
  try {
    // 获取访问令牌
    const tokenResponse = await axios.post('https://github.com/login/oauth/access_token', {
      client_id: clientId,
      client_secret: clientSecret,
      code: code
    }, {
      headers: { Accept: 'application/json' }
    });

    const accessToken = tokenResponse.data.access_token;

    // 使用访问令牌获取用户信息
    const userResponse = await axios.get('https://api.github.com/user', {
      headers: {
        'Authorization': `token ${accessToken}`,
        'Accept': 'application/vnd.github.v3+json'
      }
    });

    const username = userResponse.data.login;
    // 存储用户名
    mainWindow.webContents.send('auth-success', { username: username, accessToken: accessToken });
    return { username: username, accessToken: accessToken };

  } catch (error) {
    console.error('Error in OAuth process:', error);
    mainWindow.webContents.send('auth-error', error.message);
  }
}

async function checkRepoExists(token, owner) {
  const repo = 'my-gal'
  console.log(`开始检查仓库: ${owner}/my-gal, token: ${token}`);
  try {
    const response = await axios.get(`https://api.github.com/repos/${owner}/${repo}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/vnd.github.v3+json'
      }
    });

    // 如果请求成功（状态码 200），说明仓库存在
    return response.status === 200;
  } catch (error) {
    // 如果收到 404 错误，说明仓库不存在
    if (error.response && error.response.status === 404) {
      return false;
    }
    // 其他错误（如网络问题、认证失败等）
    console.error('检查仓库时出错:', error);
    throw error;
  }
}

export async function initializeRepo(token, user, localPath, mainWindow) {
  const repo = 'my-gal'
  try {
    // 检查仓库是否存在
    const exists = await checkRepoExists(token, user);
    const data = await fs.readFile(path.join(localPath, 'data/data.json'));
    const jsonData = JSON.parse(data);
    if (exists) {
      console.log('仓库已存在');
      if (Object.keys(jsonData).length === 0) {
        await fse.remove(localPath);
        console.log('清空本地文件夹');
        clonePrivateRepo(token, `https://github.com/${user}/my-gal.git`, localPath);
        return `https://github.com/${user}/my-gal.git`;
      } else {
        mainWindow.webContents.send('initialize-diff-data');
        return
      }
    }
    // createRepo(repo, token);
    // 创建远程空仓库并推送本地文件
    const repoUrl = await createEmptyRepoAndPushLocalFiles(token, repo, localPath, user);
    console.log(`成功创建仓库并推送本地文件: ${repoUrl}`);
    return repoUrl;
  }
  catch (error) {
    console.error('初始化仓库时出错:', error);
    throw error;
  }
}


export async function initAndPushLocalRepo(token, localPath, user) {
  try {
    const git = simpleGit(localPath, { config: ['safe.directory=*'] });
    await git.init().then(() => git.checkoutLocalBranch('main'));
    console.log(`初始化了本地仓库: ${localPath}`);
    let repoUrlWithToken = `https://${token}@github.com/${user}/my-gal.git`
    await git.addRemote('origin', repoUrlWithToken);
    console.log('添加了远程仓库链接');
    await git.add('./*');
    await git.commit(`${Date.now()}`);
    console.log('添加并提交了本地文件');
    await git.push(['--force', 'origin', 'main']);
    console.log('成功推送到远程仓库');
    return repoUrlWithToken;
  } catch (error) {
    console.error('操作过程中出错:', error);
    throw error;
  }
  //把本地文件推送到远程仓库
}

async function createEmptyRepoAndPushLocalFiles(token, repoName, localPath, user) {
  try {
    // 1. 创建远程空仓库
    const response = await axios.post('https://api.github.com/user/repos', {
      name: repoName,
      private: true
    }, {
      headers: {
        'Authorization': `token ${token}`,
        'Accept': 'application/vnd.github.v3+json'
      }
    });
    let repoUrl = response.data.clone_url;
    console.log(`创建了空的远程仓库: ${repoUrl}`);

    // 2. 初始化本地仓库
    const git = simpleGit(localPath, { config: ['safe.directory=*'] });
    await git.init().then(() => git.checkoutLocalBranch('main'));
    console.log(`初始化了本地仓库: ${localPath}`);

    // 3. 添加远程仓库链接
    let repoUrlWithToken = `https://${token}@github.com/${user}/my-gal.git`
    await git.addRemote('origin', repoUrlWithToken);
    console.log('添加了远程仓库链接');

    // 4. 添加并提交本地文件
    await git.add('./*');
    await git.commit('初始提交');
    console.log('添加并提交了本地文件');

    // 5. 推送到远程仓库
    await git.push('origin', 'main');
    console.log('成功推送到远程仓库');

    return repoUrl;
  } catch (error) {
    console.error('操作过程中出错:', error);
    throw error;
  }
}

// 克隆私有仓库
export async function clonePrivateRepo(token, repoUrl, localPath) {
  try {
    const git = simpleGit({ config: ['safe.directory=*'] });
    const authRepoUrl = repoUrl.replace('https://', `https://${token}@`);
    await git.clone(authRepoUrl, localPath);
    console.log(`仓库克隆到 ${localPath}`);
  } catch (error) {
    console.error('操作过程中出错:', error);
    throw error;
  }
}


// 提交更改并推送到远程仓库
export async function commitAndPush(localPath, message) {
  try {
    const git = simpleGit(localPath, { config: ['safe.directory=*'] });
    await git.add('.').commit(message).push('origin', 'main');
    console.log('更改已提交并推送到远程仓库');
  } catch (error) {
    console.error('操作过程中出错:', error);
    throw error;
  }
}

// 从远程仓库拉取最新更改
export async function pullChanges(localPath) {
  try {
    const git = simpleGit(localPath);
    await git.pull('origin', 'main');
    console.log('已从远程仓库拉取最新更改');
  } catch (error) {
    console.error('操作过程中出错:', error);
    throw error;
  }
}


import { createClient } from 'webdav';

export async function createWebDavClient(url, username, password) {
  console.log(`创建 WebDAV 客户端: ${url}`);
  return createClient(url, {
    username: username,
    password: password
  });
}

async function createDirectoryRecursive(client, path) {
  const parts = path.split('/').filter(Boolean);
  let currentPath = '';
  for (const part of parts) {
    currentPath += '/' + part;
    try {
      await createDirectoryWithRetry(client, currentPath);
    } catch (error) {
      if (error.status !== 405) { // 忽略"已存在"的错误
        throw error;
      }
    }
  }
}

async function createDirectoryWithRetry(client, path, retries = 5, delay = 1000) {
  for (let i = 0; i < retries; i++) {
    try {
      await client.createDirectory(path);
      return;
    } catch (error) {
      if (error.status === 423 && i < retries - 1) {
        console.log(`Directory ${path} is locked. Retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      } else {
        throw error;
      }
    }
  }
}

async function retry(fn, retries) {
  try {
    return await fn();
  } catch (error) {
    if (retries > 0) {
      console.log(`操作失败，${1000 / 1000}秒后重试。剩余重试次数：${retries - 1}`);
      await new Promise(resolve => setTimeout(resolve, 1000));
      return retry(fn, retries - 1);
    }
    throw error;
  }
}

export async function uploadDirectory(client, localDir, remoteDir) {
  try {
    const stats = await fs.stat(localDir);

    // 忽略 .git 目录
    if (path.basename(localDir) === '.git') {
      console.log(`Skipping .git directory: ${localDir}`);
      return;
    }

    if (stats.isDirectory()) {
      // 如果是目录，先创建远程目录
      await createDirectoryRecursive(client, remoteDir).catch(err => {
        if (err.status !== 405) { // 忽略"已存在"的错误
          console.warn(`Warning: Could not create directory ${remoteDir}:`, err);
        }
      });

      // 读取目录内容
      const files = await fs.readdir(localDir);

      // 递归上传每个文件/子目录
      for (const file of files) {
        await uploadDirectory(client, path.join(localDir, file), path.join(remoteDir, file));
      }
    } else {
      // 如果是文件，直接上传
      const fileContent = await fs.readFile(localDir);
      await retry(() => client.putFileContents(remoteDir, fileContent), 5);
      console.log(`Uploaded: ${remoteDir}`);
    }
  } catch (error) {
    if (error.code === 'ENOENT') {
      console.warn(`Warning: File or directory not found: ${localDir}. Skipping.`);
    } else {
      console.error(`Error processing ${localDir}:`, error);
    }
    throw error;
  }
}


export async function downloadDirectory(client, remoteDir, localDir) {
  try {
    // 确保本地目录存在
    await fs.mkdir(localDir, { recursive: true });

    // 获取远程目录内容列表
    const directoryItems = await client.getDirectoryContents(remoteDir);

    for (const item of directoryItems) {
      const remotePath = item.filename;
      const localPath = path.join(localDir, path.basename(remotePath));

      if (item.type === 'directory') {
        // 如果是目录，递归下载
        await downloadDirectory(client, remotePath, localPath);
      } else {
        // 如果是文件，下载文件内容
        const fileContent = await retry(() => client.getFileContents(remotePath), 5);
        await fs.writeFile(localPath, fileContent);
        console.log(`Downloaded: ${remotePath} to ${localPath}`);
      }
    }
  } catch (error) {
    console.error(`Error downloading ${remoteDir}:`, error);
    throw error;
  }
}