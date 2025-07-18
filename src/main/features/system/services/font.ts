import { getFonts } from 'font-list'

export async function getSystemFonts(): Promise<string[]> {
  try {
    return await getFonts({ disableQuoting: true })
  } catch (error) {
    console.error('获取系统字体失败:', error)
    return []
  }
}
