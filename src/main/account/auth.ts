import { BrowserWindow, shell } from 'electron'
import { SDK } from 'casdoor-nodejs-sdk'
import CouchDBManager from './couchdb'
import { ConfigDBManager } from '~/database'
import { AuthResult, CasdoorUser, CouchDBCredentials, UserRole } from '@appTypes/sync'
import * as fs from 'fs'
import * as path from 'path'

export class AuthManager {
  private static instance: AuthManager | null = null
  private casdoorSdk!: SDK
  private couchdb!: CouchDBManager
  private redirectUrl: string = 'vnite://casdoor/callback'
  private serverUrl!: string
  private clientId!: string
  private clientSecret!: string
  private appName!: string
  private organizationName!: string
  private certificate!: string
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
      instance.serverUrl = import.meta.env.VITE_CASDOOR_SERVER_URL || ''
      instance.clientId = import.meta.env.VITE_CASDOOR_CLIENT_ID || ''
      instance.clientSecret = import.meta.env.VITE_CASDOOR_CLIENT_SECRET || ''
      instance.appName = import.meta.env.VITE_CASDOOR_APP_NAME || ''
      instance.organizationName = import.meta.env.VITE_CASDOOR_ORGANIZATION_NAME || ''

      // 尝试加载证书
      let certificate = import.meta.env.VITE_CASDOOR_CERTIFICATE || ''
      if (!certificate) {
        // 尝试从文件加载证书，如果环境变量中没有
        try {
          const certPath = path.join(process.cwd(), 'cert', 'casdoor-cert.pem')
          if (fs.existsSync(certPath)) {
            certificate = fs.readFileSync(certPath, 'utf8')
          }
        } catch (err) {
          console.warn('无法从文件加载证书:', err)
        }
      }
      instance.certificate = certificate

      // 验证必要的配置项
      if (
        !instance.serverUrl ||
        !instance.clientId ||
        !instance.clientSecret ||
        !instance.appName ||
        !instance.organizationName ||
        !instance.certificate
      ) {
        throw new Error('缺少必要的Casdoor配置')
      }

      // 初始化 casdoor-nodejs-sdk
      const authCfg = {
        endpoint: instance.serverUrl,
        clientId: instance.clientId,
        clientSecret: instance.clientSecret,
        certificate: instance.certificate,
        orgName: instance.organizationName,
        appName: instance.appName
      }

      // 创建 SDK 实例
      instance.casdoorSdk = new SDK(authCfg)

      // 初始化CouchDB管理器
      const couchdbConfig = {
        url: import.meta.env.VITE_COUCHDB_SERVER_URL || '',
        adminUsername: import.meta.env.VITE_COUCHDB_ADMIN_USERNAME || '',
        adminPassword: import.meta.env.VITE_COUCHDB_ADMIN_PASSWORD || ''
      }

      // 验证CouchDB配置
      if (!couchdbConfig.url || !couchdbConfig.adminUsername || !couchdbConfig.adminPassword) {
        throw new Error('缺少必要的CouchDB配置')
      }

      instance.couchdb = new CouchDBManager(couchdbConfig)

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
      // 使用 SDK 获取注册 URL
      const signupUrl = instance.casdoorSdk.getSignUpUrl(true, instance.redirectUrl)

      // 打开默认浏览器进行注册
      shell.openExternal(signupUrl)

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
      // 使用 SDK 获取登录 URL
      const signinUrl = instance.casdoorSdk.getSignInUrl(instance.redirectUrl)

      // 打开默认浏览器进行登录
      shell.openExternal(signinUrl)

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
      const tokenResponse = await instance.casdoorSdk.getAuthToken(code)
      const accessToken = tokenResponse.access_token

      // 解析 JWT 令牌获取用户信息
      const userInfo = instance.casdoorSdk.parseJwtToken(accessToken) as unknown as CasdoorUser

      const isNewUserOrNoRoles =
        !userInfo.roles || !Array.isArray(userInfo.roles) || userInfo.roles.length === 0
      if (isNewUserOrNoRoles) {
        // 为新用户设置默认角色
        await AuthManager.setUserDefaultRole(userInfo.name)

        // 重新获取用户信息
        const updatedUser = await instance.casdoorSdk.getUser(
          `${instance.organizationName}/${userInfo.name}`
        )
        if (updatedUser && updatedUser.data && updatedUser.data.data) {
          Object.assign(userInfo, updatedUser.data.data)
        }
      }

      // 处理CouchDB用户创建或获取
      const couchdbCredentials = await AuthManager.setupCouchDBUser(userInfo)

      const userRole = AuthManager.getUserRole(userInfo)

      // 保存用户凭证
      await ConfigDBManager.setConfigLocalValue('userInfo', {
        id: userInfo.id || '',
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
    } catch (error) {
      console.error('处理授权码失败:', error)
      mainWindow.webContents.send('auth-error', (error as Error).message)
    }
  }

  /**
   * 获取用户角色
   */
  private static getUserRole(userInfo: CasdoorUser): UserRole {
    // 首先从用户的roles数组中查找匹配的角色
    if (userInfo.roles && Array.isArray(userInfo.roles) && userInfo.roles.length > 0) {
      // 获取用户的所有角色并按优先级排序（管理员 > 社区版）
      const rolePriority = ['admin', 'community']

      // 找出用户拥有的最高优先级角色
      for (const priorityRole of rolePriority) {
        if (userInfo.roles.includes(priorityRole)) {
          return priorityRole as UserRole
        }
      }
    }

    // 如果是管理员，赋予admin角色
    if (userInfo.isAdmin || userInfo.isGlobalAdmin) {
      return UserRole.ADMIN
    }

    // 默认为社区版用户
    return UserRole.COMMUNITY
  }

  /**
   * 设置用户默认角色
   */
  /**
   * 设置用户默认角色
   */
  private static async setUserDefaultRole(username: string): Promise<boolean> {
    const instance = AuthManager.getInstance()
    try {
      // 1. 首先获取用户信息，检查现有角色
      const userResponse = await instance.casdoorSdk.getUser(
        `${instance.organizationName}/${username}`
      )
      const user = userResponse.data.data

      // 检查用户是否已有社区版角色
      if (user.roles && user.roles.some((role) => role.name === UserRole.COMMUNITY)) {
        console.log(`用户 ${username} 已拥有 ${UserRole.COMMUNITY} 角色`)
        return true
      }

      // 2. 获取社区版角色信息
      try {
        const roleResponse = await instance.casdoorSdk.getRole(
          `${instance.organizationName}/${UserRole.COMMUNITY}`
        )

        const role = roleResponse.data.data

        // 检查角色是否存在
        if (!role) {
          throw new Error(`找不到角色: ${UserRole.COMMUNITY}`)
        }

        // 3. 将用户添加到角色中
        role.users = role.users || []
        if (!role.users.includes(username)) {
          role.users.push(username)
        }

        // 4. 更新角色
        const updateResponse = await instance.casdoorSdk.updateRole(role)

        if (updateResponse.data.status !== 'ok') {
          throw new Error('更新角色失败')
        }

        console.log(`已为用户 ${username} 添加默认角色: ${UserRole.COMMUNITY}`)
        return true
      } catch (roleError) {
        console.error('角色操作失败:', roleError)
        return false
      }
    } catch (error) {
      console.error('设置用户默认角色失败:', error)
      return false
    }
  }

  /**
   * 设置CouchDB用户
   */
  private static async setupCouchDBUser(userInfo: CasdoorUser): Promise<CouchDBCredentials> {
    const instance = AuthManager.getInstance()
    const username = userInfo.name

    // 检查用户的自定义属性中是否已有CouchDB密码
    const couchdbPassword = userInfo.properties?.couchdbPassword

    // 如果没有密码，生成一个新的随机密码
    const password = couchdbPassword || instance.couchdb.generateRandomPassword()

    // 创建CouchDB用户
    await instance.couchdb.createUser(username, password)

    // 创建CouchDB用户数据库
    await instance.couchdb.createDatabase(username)

    // 如果是新生成的密码，保存到Casdoor用户属性中
    if (!couchdbPassword) {
      await AuthManager.saveCouchDBPasswordToCasdoor(username, password)
    }

    return { username, password }
  }

  /**
   * 保存密码到Casdoor
   */
  private static async saveCouchDBPasswordToCasdoor(
    username: string,
    password: string
  ): Promise<boolean> {
    const instance = AuthManager.getInstance()
    try {
      // 先获取用户信息
      const userResponse = await instance.casdoorSdk.getUser(
        `${instance.organizationName}/${username}`
      )
      const user = userResponse.data.data

      // 更新用户的属性
      user.properties = user.properties || {}
      user.properties.couchdbPassword = password

      // 更新用户
      const response = await instance.casdoorSdk.updateUser(user)

      if (response.data.status !== 'ok') {
        throw new Error('更新用户属性失败')
      }

      return true
    } catch (error) {
      console.error('保存CouchDB密码到Casdoor失败:', error)
      // 继续流程，因为CouchDB用户已创建成功
      return false
    }
  }
}

export function handleAuthCallback(url: string): void {
  if (!url.startsWith('vnite://casdoor/callback')) return

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
