import { setValue, getValue } from './common.js'
import { getDataPath } from '~/utils'
import log from 'electron-log/main.js'

/**
 * Get the value of the database
 * @param dbName The name of the database
 * @param path The path to the key.
 * @param value — The value to set.
 * @returns A promise that resolves when the operation is complete.
 */
export async function setDBValue(dbName: string, path: string[], value: any): Promise<void> {
  try {
    await setValue(await getDataPath(`${dbName}.json`), path, value)
  } catch (error) {
    log.error(`Failed to set value for ${dbName} at ${path.join('.')}`, error)
  }
}

/**
 * Get the value of the database
 * @param dbName The name of the database
 * @param path The path to the key.
 * @param defaultValue The default value to set and return if the key does not exist.
 * @returns A promise that resolves with the value of the key.
 */
export async function getDBValue(dbName: string, path: string[], defaultValue: any): Promise<any> {
  try {
    return await getValue(await getDataPath(`${dbName}.json`), path, defaultValue)
  } catch (error) {
    log.error(`Failed to get value for ${dbName} at ${path.join('.')}`, error)
  }
}
