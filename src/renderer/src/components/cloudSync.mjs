import axios from 'axios';
import crypto from 'crypto';
import http from 'http';
import url from 'url';
import { shell } from 'electron';
import simpleGit from 'simple-git';
import { promises as fs } from 'fs';
import path from 'path';

const PORT = 20721;
let server;

export function startAuthProcess(mainWindow, clientId, clientSecret) {
  return new Promise((resolve, reject) => {
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
    mainWindow.webContents.send('auth-success', { username });
    return { username: username, accessToken: accessToken };

  } catch (error) {
    console.error('Error in OAuth process:', error);
    mainWindow.webContents.send('auth-error', error.message);
  }
}

async function checkRepoExists(token, owner) {
  const repo = 'my-gal'
  try {
    const response = await axios.get(`https://api.github.com/repos/${owner}/${repo}`, {
      headers: {
        'Authorization': `token ${token}`,
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

export async function initializeRepo(token, user, path) {
  const repo = 'my-gal'
  try {
    // 检查仓库是否存在
    const exists = await checkRepoExists(token, user);
    if (exists) {
      console.log('仓库已存在');
      return;
    }
    // createRepo(repo, token);
    // 创建远程空仓库并推送本地文件
    const repoUrl = await createEmptyRepoAndPushLocalFiles(token, repo, path);
    console.log(`成功创建仓库并推送本地文件: ${repoUrl}`);
    return repoUrl;
  }
  catch (error) {
    console.error('初始化仓库时出错:', error);
    throw error;
  }
}

async function createEmptyRepoAndPushLocalFiles(token, repoName, localPath) {
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
    const git = simpleGit(localPath);
    await git.init().then(() => git.checkoutLocalBranch('main'));
    console.log(`初始化了本地仓库: ${localPath}`);

    // 3. 添加远程仓库链接
    let repoUrlWithToken = `https://${token}@github.com/ximu3/my-gal.git`
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
  const git = simpleGit();
  const authRepoUrl = repoUrl.replace('https://', `https://${token}@`);
  await git.clone(authRepoUrl, localPath);
  console.log(`仓库克隆到 ${localPath}`);
}


// 提交更改并推送到远程仓库
export async function commitAndPush(localPath, message) {
  const git = simpleGit(localPath);
  await git.add('.')
    .commit(message)
    .push('origin', 'main');
  console.log('更改已提交并推送到远程仓库');
}

// 从远程仓库拉取最新更改
export async function pullChanges(localPath) {
  const git = simpleGit(localPath);
  await git.pull('origin', 'main');
  console.log('已从远程仓库拉取最新更改');
}

export async function createRepo(repoName, token) {
  try {
    const response = await axios.post('https://api.github.com/user/repos', {
      name: repoName,
      private: true
    }, {
      headers: {
        Authorization: `token ${token}`,
        Accept: 'application/vnd.github.v3+json'
      }
    });
    return response.data.html_url;
  } catch (error) {
    console.error('Error creating repository:', error);
    throw error;
  }
}

export async function uploadFile(repoName, path, content, token) {
  try {
    const encodedContent = Buffer.from(content).toString('base64');
    const response = await axios.put(`https://api.github.com/repos/${repoName}/contents/${path}`, {
      message: 'Upload file',
      content: encodedContent
    }, {
      headers: {
        Authorization: `token ${token}`,
        Accept: 'application/vnd.github.v3+json'
      }
    });
    return response.data.content.html_url;
  } catch (error) {
    console.error('Error uploading file:', error);
    throw error;
  }
}

export async function downloadFile(repoName, path, token) {
  try {
    const response = await axios.get(`https://api.github.com/repos/${repoName}/contents/${path}`, {
      headers: {
        Authorization: `token ${token}`,
        Accept: 'application/vnd.github.v3+json'
      }
    });
    return Buffer.from(response.data.content, 'base64').toString('utf-8');
  } catch (error) {
    console.error('Error downloading file:', error);
    throw error;
  }
}