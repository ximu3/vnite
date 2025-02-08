import koffi from 'koffi'

// Loading user32.dll
const user32 = koffi.load('user32.dll')

// Defining the Windows API Interface
const keybd_event = user32.func(
  'void keybd_event(uint8 bVk, uint8 bScan, uint32 dwFlags, size_t dwExtraInfo)'
)

// Virtual keycode constants
const VK_CODES = {
  // modifier key
  win: 0x5b, // VK_LWIN
  ctrl: 0x11, // VK_CONTROL
  alt: 0x12, // VK_ALT
  shift: 0x10, // VK_SHIFT

  // special key
  esc: 0x1b, // VK_ESCAPE
  return: 0x0d, // VK_RETURN
  del: 0x2e, // VK_DELETE
  up: 0x26, // VK_UP
  down: 0x28, // VK_DOWN
  left: 0x25, // VK_LEFT
  right: 0x27, // VK_RIGHT
  space: 0x20, // VK_SPACE
  tab: 0x09, // VK_TAB
  backspace: 0x08, // VK_BACK

  // Numeric keys (0-9)
  ...Object.fromEntries([...Array(10)].map((_, i) => [i.toString(), 0x30 + i])),

  // Alphabetic keys (A-Z)
  ...Object.fromEntries(
    [...Array(26)].map((_, i) => [
      String.fromCharCode(97 + i), // a-z
      0x41 + i // VK_A through VK_Z
    ])
  )
} as const

// Key event flag
const KEYEVENTF_KEYUP = 0x0002

export function simulateHotkey(hotkey: string): void {
  try {
    const keys = hotkey.split('+').map((k) => k.trim().toLowerCase())

    // Verify that all key names are valid
    const invalidKey = keys.find((key) => !(key in VK_CODES))
    if (invalidKey) {
      throw new Error(`无效的键名: ${invalidKey}`)
    }

    // Get virtual keycodes for all keys
    const vkCodes = keys.map((key) => VK_CODES[key as keyof typeof VK_CODES])

    // Press all keys in sequence
    vkCodes.forEach((vkCode) => {
      keybd_event(vkCode, 0, 0, 0)
    })

    // Release all keys in reverse order
    vkCodes.reverse().forEach((vkCode) => {
      keybd_event(vkCode, 0, KEYEVENTF_KEYUP, 0)
    })

    console.log('模拟按键:', {
      keys,
      originalHotkey: hotkey
    })
  } catch (error) {
    console.error('模拟按键失败:', {
      error,
      hotkey,
      stack: error instanceof Error ? error.stack : undefined
    })
    throw error
  }
}

export function toggleKey(key: string, isDown: boolean): void {
  try {
    if (!(key.toLowerCase() in VK_CODES)) {
      throw new Error(`无效的键名: ${key}`)
    }
    const vkCode = VK_CODES[key.toLowerCase() as keyof typeof VK_CODES]
    keybd_event(vkCode, 0, isDown ? 0 : KEYEVENTF_KEYUP, 0)
  } catch (error) {
    console.error('切换按键状态失败:', error)
    throw error
  }
}
