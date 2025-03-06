import * as crypto from 'crypto'
import axios from 'axios'

interface CouchDBResponse {
  ok: boolean
  id?: string
  rev?: string
  error?: string
  reason?: string
  exists?: boolean
}

interface DatabaseInfo {
  dbName: string
  url: string
  exists?: boolean
  ok?: boolean
}

export class CouchDBManager {
  private url: string = ''
  private adminUsername: string = ''
  private adminPassword: string = ''
  private authHeader: string = ''

  // 单例实例
  private static instance: CouchDBManager | null = null

  // 私有构造函数
  private constructor() {
    // 禁止外部实例化
  }

  // 获取实例的静态方法
  public static getInstance(): CouchDBManager {
    if (!CouchDBManager.instance) {
      CouchDBManager.instance = new CouchDBManager()
    }
    return CouchDBManager.instance
  }

  // 静态初始化方法
  public static init(): void {
    const instance = this.getInstance()

    instance.url = import.meta.env.VITE_COUCHDB_SERVER_URL || ''
    instance.adminUsername = import.meta.env.VITE_COUCHDB_ADMIN_USERNAME || ''
    instance.adminPassword = import.meta.env.VITE_COUCHDB_ADMIN_PASSWORD || ''

    if (!instance.url || !instance.adminUsername || !instance.adminPassword) {
      throw new Error('CouchDB 配置信息不完整')
    }

    // 创建Basic Authentication头
    instance.authHeader = `Basic ${Buffer.from(`${instance.adminUsername}:${instance.adminPassword}`).toString('base64')}`
  }

  /**
   * 确保系统数据库存在
   */
  public static async ensureSystemDatabases(): Promise<void> {
    const instance = this.getInstance()
    const systemDbs = ['_users']

    for (const dbName of systemDbs) {
      try {
        // 检查数据库是否存在
        const checkResponse = await axios.get(`${instance.url}/${dbName}`, {
          headers: {
            Authorization: instance.authHeader,
            Accept: 'application/json'
          },
          validateStatus: null
        })

        if (checkResponse.status === 404) {
          // 如果数据库不存在，则创建它
          const createResponse = await axios.put(
            `${instance.url}/${dbName}`,
            {},
            {
              headers: {
                Authorization: instance.authHeader,
                Accept: 'application/json'
              }
            }
          )

          if (createResponse.status !== 201) {
            throw new Error(`创建系统数据库 ${dbName} 失败: ${JSON.stringify(createResponse.data)}`)
          }

          console.log(`系统数据库 ${dbName} 创建成功`)
        } else if (checkResponse.status !== 200) {
          throw new Error(`检查系统数据库 ${dbName} 失败: ${JSON.stringify(checkResponse.data)}`)
        } else {
          console.log(`系统数据库 ${dbName} 已存在`)
        }
      } catch (error) {
        console.error(`检查系统数据库 ${dbName} 失败:`, error)
        throw error
      }
    }
  }

  /**
   * 创建 CouchDB 用户
   */
  public static async createUser(username: string, password: string): Promise<CouchDBResponse> {
    const instance = this.getInstance()
    try {
      // 确保系统数据库存在
      await this.ensureSystemDatabases()

      const userId = `org.couchdb.user:${username}`

      const checkResponse = await axios.get(
        `${instance.url}/_users/${encodeURIComponent(userId)}`,
        {
          headers: {
            Authorization: instance.authHeader,
            Accept: 'application/json'
          },
          validateStatus: null
        }
      )

      if (checkResponse.status === 200) {
        console.log(`CouchDB用户 ${username} 已存在`)
        return { ok: true, id: userId, exists: true }
      }

      // 创建用户文档
      const userDoc = {
        _id: userId,
        name: username,
        password: password,
        roles: ['user'],
        type: 'user'
      }

      // 插入用户文档到 _users 数据库
      const response = await axios.put(
        `${instance.url}/_users/${encodeURIComponent(userId)}`,
        userDoc,
        {
          headers: {
            Authorization: instance.authHeader,
            'Content-Type': 'application/json',
            Accept: 'application/json'
          }
        }
      )

      console.log(`CouchDB用户 ${username} 创建成功`)

      return {
        ok: true,
        id: response.data.id,
        rev: response.data.rev
      }
    } catch (error) {
      console.error('创建CouchDB用户失败:', error)
      throw error
    }
  }

  /**
   * 为用户创建三个数据库：config、game、game-collection
   */
  public static async createDatabase(username: string): Promise<{
    config: DatabaseInfo
    game: DatabaseInfo
    gameCollection: DatabaseInfo
  }> {
    const instance = this.getInstance()
    // 需要创建的三个数据库类型
    const dbTypes = ['config', 'game', 'game-collection']
    const results: any = {}

    try {
      // 为每种类型的数据库执行创建操作
      for (const dbType of dbTypes) {
        // 创建安全的数据库名称，加上数据库类型后缀
        const dbName = this.getUserDBName(username) + `-${dbType}`
        const dbUrl = `${instance.url}/${dbName}`
        const resultKey = dbType === 'game-collection' ? 'gameCollection' : dbType

        // 检查数据库是否存在
        const checkResponse = await axios.get(dbUrl, {
          headers: {
            Authorization: instance.authHeader,
            Accept: 'application/json'
          },
          validateStatus: null
        })

        if (checkResponse.status === 200) {
          console.log(`数据库 ${dbName} 已存在`)
          results[resultKey] = {
            dbName,
            url: dbUrl,
            exists: true
          }
          continue // 继续处理下一个数据库
        }

        // 创建数据库
        await axios.put(
          dbUrl,
          {},
          {
            headers: {
              Authorization: instance.authHeader,
              Accept: 'application/json'
            }
          }
        )

        // 设置数据库安全选项
        const securityDoc = {
          admins: {
            names: [instance.adminUsername],
            roles: ['_admin']
          },
          members: {
            names: [username],
            roles: []
          }
        }

        // 设置数据库访问权限
        await axios.put(`${dbUrl}/_security`, securityDoc, {
          headers: {
            Authorization: instance.authHeader,
            'Content-Type': 'application/json',
            Accept: 'application/json'
          }
        })

        console.log(`为用户 ${username} 创建数据库 ${dbName} 成功`)
        results[resultKey] = {
          dbName,
          url: dbUrl,
          ok: true
        }
      }

      return {
        config: results.config,
        game: results.game,
        gameCollection: results.gameCollection
      }
    } catch (error) {
      console.error('创建用户数据库失败:', error)
      throw error
    }
  }

  /**
   * 生成随机密码
   */
  public static generateRandomPassword(length: number = 24): string {
    return crypto
      .randomBytes(Math.ceil(length / 2))
      .toString('hex')
      .slice(0, length)
  }

  /**
   * 创建安全的数据库名称
   */
  public static getUserDBName(username: string): string {
    return `vnite-userdb-${username.toLowerCase().replace(/[^a-z0-9]/g, '-')}`
  }

  /**
   * 获取用户的同步配置
   */
  public static getUserSyncConfig(
    username: string,
    password: string
  ): {
    remoteDbUrl: string
    credentials: { username: string; password: string }
  } {
    const instance = this.getInstance()
    const dbName = this.getUserDBName(username)
    return {
      remoteDbUrl: `${instance.url}/${dbName}`,
      credentials: { username, password }
    }
  }
}

export default CouchDBManager
