import { app, Tray, Menu, nativeImage, BrowserWindow } from 'electron'
import { getDBValue, setDBValue } from '~/database'
import icon from '../../../resources/icon.png?asset'

export async function setupTray(mainWindow: BrowserWindow): Promise<TrayManager> {
  const trayManager = new TrayManager(mainWindow)
  await trayManager.init()
  return trayManager
}

export interface AppConfig {
  openAtLogin: boolean
  quitToTray: boolean
}

export class TrayManager {
  private tray: Tray | null = null
  private mainWindow: BrowserWindow
  private config: AppConfig | null = null
  private isQuitting: boolean = false

  constructor(mainWindow: BrowserWindow) {
    this.mainWindow = mainWindow
  }

  // Asynchronous initialization methods
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
    // Handling window close events
    this.mainWindow.on('close', (event) => {
      // If it is not an exit operation and minimize to tray is enabled
      if (!this.isQuitting && this.config?.quitToTray) {
        event.preventDefault()
        this.mainWindow.hide()
      }
    })

    // Listening for application exit events
    app.on('before-quit', () => {
      this.isQuitting = true
    })
  }

  private createTray(): void {
    if (this.tray) return

    this.tray = new Tray(icon)

    // Setting up tray icon alerts
    this.tray.setToolTip('vnite')

    // Creating Context Menus
    this.setTrayMenu()

    // bind an event
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
          this.isQuitting = true // Setting the exit flag
          app.quit()
        }
      }
    ])

    this.tray.setContextMenu(contextMenu)
  }

  private bindTrayEvents(): void {
    if (!this.tray) return

    // Click to show main window on Windows and Linux
    if (process.platform !== 'darwin') {
      this.tray.on('click', () => {
        this.showMainWindow()
      })
    }

    // Right-click to show menu on macOS
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

  // Update tray icon
  public updateTrayIcon(iconPath: string): void {
    if (this.tray) {
      const icon = nativeImage.createFromPath(iconPath)
      this.tray.setImage(icon)
    }
  }

  // Updated tray menu
  public updateTrayMenu(): void {
    this.setTrayMenu()
  }

  // Destruction of pallets
  public destroy(): void {
    if (this.tray) {
      this.tray.destroy()
      this.tray = null
    }
  }
}
