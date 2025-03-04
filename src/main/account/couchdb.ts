import axios, { AxiosError, AxiosResponse } from 'axios'
import * as crypto from 'crypto'
import { CouchDBConfig } from '@appTypes/sync'

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

class CouchDBManager {
  private url: string
  private adminUsername: string
  private adminPassword: string

  constructor(config: CouchDBConfig) {
    this.url = config.url
    this.adminUsername = config.adminUsername
    this.adminPassword = config.adminPassword
  }

  public async createUser(username: string, password: string): Promise<CouchDBResponse> {
    const url = `${this.url}/_users/org.couchdb.user:${encodeURIComponent(username)}`

    const userDoc = {
      name: username,
      password: password,
      roles: ['user'],
      type: 'user'
    }

    try {
      const response: AxiosResponse<CouchDBResponse> = await axios.put(url, userDoc, {
        auth: {
          username: this.adminUsername,
          password: this.adminPassword
        },
        headers: {
          'Content-Type': 'application/json'
        }
      })

      return response.data
    } catch (error) {
      const axiosError = error as AxiosError
      // 如果用户已存在 (409 Conflict)，这不是错误
      if (axiosError.response && axiosError.response.status === 409) {
        console.log(`CouchDB用户 ${username} 已存在`)
        return { ok: true, id: `org.couchdb.user:${username}`, exists: true }
      }

      console.error('创建CouchDB用户失败:', axiosError.response?.data || axiosError.message)
      throw error
    }
  }

  public async createDatabase(username: string): Promise<DatabaseInfo> {
    // 创建安全的数据库名称
    const dbName = this.getUserDBName(username)
    const url = `${this.url}/${dbName}`

    try {
      // 创建数据库
      const createResponse: AxiosResponse<CouchDBResponse> = await axios.put(
        url,
        {},
        {
          auth: {
            username: this.adminUsername,
            password: this.adminPassword
          }
        }
      )

      // 设置数据库安全选项
      const securityUrl = `${url}/_security`
      await axios.put(
        securityUrl,
        {
          admins: {
            names: [this.adminUsername],
            roles: ['_admin']
          },
          members: {
            names: [username],
            roles: []
          }
        },
        {
          auth: {
            username: this.adminUsername,
            password: this.adminPassword
          },
          headers: {
            'Content-Type': 'application/json'
          }
        }
      )

      return {
        ok: createResponse.data.ok,
        dbName,
        url
      }
    } catch (error) {
      const axiosError = error as AxiosError
      // 如果数据库已存在 (412 Precondition Failed)，这不是错误
      if (axiosError.response && axiosError.response.status === 412) {
        console.log(`数据库 ${dbName} 已存在`)
        return { dbName, url, exists: true }
      }

      console.error('创建用户数据库失败:', axiosError.response?.data || axiosError.message)
      throw error
    }
  }

  public generateRandomPassword(length: number = 24): string {
    return crypto
      .randomBytes(Math.ceil(length / 2))
      .toString('hex')
      .slice(0, length)
  }

  public getUserDBName(username: string): string {
    // 创建安全的数据库名，替换不允许的字符
    return `vnite-userdb-${username.toLowerCase().replace(/[^a-z0-9]/g, '-')}`
  }
}

export default CouchDBManager
