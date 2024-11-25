import { app, Tray, Menu, nativeImage, BrowserWindow } from 'electron'
import { getDBValue, setDBValue } from '~/database'
import icon from '../../../resources/icon.png?asset'

export async function setupTray(mainWindow: BrowserWindow): Promise<TrayManager> {
  const trayManager = new TrayManager(mainWindow)
  await trayManager.init() // 初始化
  return trayManager
}

export interface AppConfig {
  openAtLogin: boolean
  quitToTray: boolean // 添加最小化到托盘的配置项

  // ... 其他配置
}

export class TrayManager {
  private tray: Tray | null = null
  private mainWindow: BrowserWindow
  private config: AppConfig | null = null

  constructor(mainWindow: BrowserWindow) {
    this.mainWindow = mainWindow
  }

  // 异步初始化方法
  public async init(): Promise<void> {
    this.config = await getDBValue('config.json', ['general'], {
      openAtLogin: false,
      quitToTray: false
    })

    this.createTray()
    await this.setupWindowEvents()
  }

  public async updateConfig(): Promise<void> {
    this.config = await getDBValue('config.json', ['general'], {
      openAtLogin: false,
      quitToTray: false
    })
    this.updateTrayMenu()
  }

  private async setupWindowEvents(): Promise<void> {
    // 处理窗口关闭事件
    this.mainWindow.on('close', (event) => {
      if (this.config?.quitToTray) {
        event.preventDefault()
        this.mainWindow.hide()
      }
    })
  }

  private createTray(): void {
    if (this.tray) return

    this.tray = new Tray(icon)

    // 设置托盘图标提示
    this.tray.setToolTip('vnite')

    // 创建上下文菜单
    this.setTrayMenu()

    // 绑定事件
    this.bindTrayEvents()
  }

  private setTrayMenu(): void {
    if (!this.tray) return

    const contextMenu = Menu.buildFromTemplate([
      {
        label: '显示主窗口',
        click: (): void => {
          this.showMainWindow()
        }
      },
      {
        label: '设置',
        submenu: [
          {
            label: '开机启动',
            type: 'checkbox',
            checked: this.config?.openAtLogin,
            click: async (menuItem): Promise<void> => {
              await setDBValue('config.json', ['general', 'openAtLogin'], menuItem.checked)
              app.setLoginItemSettings({
                openAtLogin: menuItem.checked
              })
            }
          },
          {
            label: '关闭时最小化到托盘',
            type: 'checkbox',
            checked: this.config?.quitToTray,
            click: async (menuItem): Promise<void> => {
              await setDBValue('config.json', ['general', 'quitToTray'], menuItem.checked)
              await this.updateConfig()
            }
          }
        ]
      },
      { type: 'separator' },
      {
        label: '退出',
        click: (): void => {
          app.quit()
        }
      }
    ])

    this.tray.setContextMenu(contextMenu)
  }

  private bindTrayEvents(): void {
    if (!this.tray) return

    // Windows 和 Linux 下单击显示主窗口
    if (process.platform !== 'darwin') {
      this.tray.on('click', () => {
        this.showMainWindow()
      })
    }

    // macOS 下右键点击显示菜单
    if (process.platform === 'darwin') {
      this.tray.on('right-click', () => {
        if (this.tray) {
          this.tray.popUpContextMenu()
        }
      })
    }
  }

  private showMainWindow(): void {
    if (this.mainWindow.isMinimized()) {
      this.mainWindow.restore()
    }
    if (!this.mainWindow.isVisible()) {
      this.mainWindow.show()
    }
    this.mainWindow.focus()
  }

  // 更新托盘图标
  public updateTrayIcon(iconPath: string): void {
    if (this.tray) {
      const icon = nativeImage.createFromPath(iconPath)
      this.tray.setImage(icon)
    }
  }

  // 更新托盘菜单
  public updateTrayMenu(): void {
    this.setTrayMenu()
  }

  // 销毁托盘
  public destroy(): void {
    if (this.tray) {
      this.tray.destroy()
      this.tray = null
    }
  }
}
