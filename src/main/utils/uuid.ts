import { v4 as uuidv4 } from 'uuid'

/**
 * Generates a UUID
 * @returns {string} - A UUID
 */
export const generateUUID = (): string => {
  return uuidv4()
}
