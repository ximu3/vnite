import { BrowserWindow, shell } from 'electron'
import axios from 'axios'
import { jwtDecode } from 'jwt-decode'

import { ConfigDBManager } from '~/database'
import { AuthResult, UserRole } from '@appTypes/sync'
import { startSync } from '~/database'

// Authentik用户接口
interface AuthentikUser {
  sub: string
  name: string
  email: string
  preferred_username: string
  groups: string[]
  couchdb?: {
    username: string
    password: string
    url: string
    databases: {
      config: { dbName: string }
      game: { dbName: string }
      gameCollection: { dbName: string }
    }
  }
}

export class AuthManager {
  private static instance: AuthManager | null = null
  private serverUrl!: string
  private clientId!: string
  private clientSecret!: string
  private redirectUrl: string = 'vnite://auth/callback'
  private initialized: boolean = false

  // 私有构造函数，防止直接创建实例
  private constructor() {
    // 构造函数为空
  }

  /**
   * 获取单例实例（内部使用）
   */
  private static getInstance(): AuthManager {
    if (!AuthManager.instance) {
      AuthManager.instance = new AuthManager()
    }
    return AuthManager.instance
  }

  /**
   * 初始化单例配置
   */
  public static init(): void {
    const instance = AuthManager.getInstance()
    if (instance.initialized) {
      return
    }

    // 从环境变量加载配置
    try {
      // 获取必要的配置
      instance.serverUrl = import.meta.env.VITE_AUTHENTIK_SERVER_URL || ''
      instance.clientId = import.meta.env.VITE_AUTHENTIK_CLIENT_ID || ''
      instance.clientSecret = import.meta.env.VITE_AUTHENTIK_CLIENT_SECRET || ''

      // 验证必要的配置项
      if (!instance.serverUrl || !instance.clientId || !instance.clientSecret) {
        throw new Error('缺少必要的Authentik配置')
      }

      instance.initialized = true
      console.log('AuthManager 初始化成功')
    } catch (error) {
      console.error('AuthManager 初始化失败:', error)
      throw error
    }
  }

  /**
   * 检查实例是否已初始化
   */
  private static checkInitialized(): void {
    const instance = AuthManager.getInstance()
    if (!instance.initialized) {
      throw new Error('AuthManager 未正确初始化，请先调用 AuthManager.init()')
    }
  }

  /**
   * 启动注册流程
   */
  public static async startSignup(): Promise<AuthResult> {
    AuthManager.checkInitialized()
    const instance = AuthManager.getInstance()

    try {
      // 构建Authentik注册URL
      const signupUrl = new URL(`${instance.serverUrl}/if/flow/vnite-enrollment/`)
      signupUrl.searchParams.append('client_id', instance.clientId)
      signupUrl.searchParams.append('redirect_uri', instance.redirectUrl)

      // 打开默认浏览器进行注册
      shell.openExternal(signupUrl.toString())

      return { success: true }
    } catch (error) {
      console.error('启动注册流程失败:', error)
      return { success: false, error: (error as Error).message }
    }
  }

  /**
   * 启动登录流程
   */
  public static async startSignin(): Promise<AuthResult> {
    AuthManager.checkInitialized()
    const instance = AuthManager.getInstance()

    try {
      // 构建Authentik OAuth2登录URL
      const signinUrl = new URL(`${instance.serverUrl}/application/o/authorize/`)
      signinUrl.searchParams.append('client_id', instance.clientId)
      signinUrl.searchParams.append('redirect_uri', instance.redirectUrl)
      signinUrl.searchParams.append('response_type', 'code')
      signinUrl.searchParams.append('scope', 'openid profile email groups couchdb')

      // 打开默认浏览器进行登录
      shell.openExternal(signinUrl.toString())

      return { success: true }
    } catch (error) {
      console.error('启动登录流程失败:', error)
      return { success: false, error: (error as Error).message }
    }
  }

  /**
   * 重置单例（主要用于测试和开发）
   */
  public static reset(): void {
    AuthManager.instance = null
  }

  /**
   * 处理授权码 - 公开方法，由主进程调用
   */
  public static async handleAuthCode(code: string, mainWindow: BrowserWindow): Promise<void> {
    AuthManager.checkInitialized()
    const instance = AuthManager.getInstance()

    try {
      // 交换授权码获取访问令牌
      const tokenResponse = await axios.post(
        `${instance.serverUrl}/application/o/token/`,
        new URLSearchParams({
          grant_type: 'authorization_code',
          client_id: instance.clientId,
          client_secret: instance.clientSecret,
          code: code,
          redirect_uri: instance.redirectUrl
        }),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
          }
        }
      )

      const accessToken = tokenResponse.data.access_token
      const idToken = tokenResponse.data.id_token

      // 解析ID令牌获取基本用户信息
      const userInfo = jwtDecode(idToken) as AuthentikUser

      // 获取CouchDB凭据
      const couchdbCredentials = userInfo.couchdb
        ? {
            username: userInfo.couchdb.username,
            password: userInfo.couchdb.password
          }
        : null

      // 如果没有CouchDB凭据，则报错
      if (!couchdbCredentials) {
        throw new Error('无法获取CouchDB凭据，请确保Authentik已正确配置')
      }

      const userRole = AuthManager.getUserRole(userInfo)

      // 保存用户凭证
      await ConfigDBManager.setConfigLocalValue('userInfo', {
        name: userInfo.name || '',
        accessToken,
        role: userRole
      })

      // 保存CouchDB凭证
      await ConfigDBManager.setConfigLocalValue('sync.officialConfig', {
        auth: {
          username: couchdbCredentials.username,
          password: couchdbCredentials.password
        }
      })

      // 通知渲染进程认证成功
      mainWindow.webContents.send('auth-success')

      // 启动同步
      await startSync()
    } catch (error) {
      console.error('处理授权码失败:', error)
      mainWindow.webContents.send('auth-error', (error as Error).message)
    }
  }

  /**
   * 获取用户角色
   */
  private static getUserRole(userInfo: AuthentikUser): UserRole {
    // 首先从用户的groups数组中查找匹配的角色
    if (userInfo.groups && Array.isArray(userInfo.groups) && userInfo.groups.length > 0) {
      // 获取用户的所有角色并按优先级排序（管理员 > 社区版）
      if (userInfo.groups.includes('authentik-admins') || userInfo.groups.includes('admin')) {
        return UserRole.ADMIN
      } else if (userInfo.groups.includes('community')) {
        return UserRole.COMMUNITY
      }
    }

    // 默认为社区版用户
    return UserRole.COMMUNITY
  }
}

/**
 * 处理授权回调URL
 */
export function handleAuthCallback(url: string): void {
  if (!url.startsWith('vnite://auth/callback')) return

  try {
    // 解析URL并获取授权码
    const urlObj = new URL(url)
    const code = urlObj.searchParams.get('code')

    // 获取主窗口
    const mainWindow = BrowserWindow.getAllWindows()[0]

    if (code && mainWindow) {
      // 将授权码传给 AuthManager 处理
      AuthManager.handleAuthCode(code, mainWindow)
    } else {
      console.error('授权回调中未找到授权码')
    }
  } catch (error) {
    console.error('处理授权回调URL失败:', error)
  }
}
