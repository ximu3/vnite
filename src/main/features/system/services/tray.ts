import { app, Tray, Menu, nativeImage, BrowserWindow } from 'electron'
import { GameDBManager, ConfigDBManager } from '~/core/database'
import { eventBus } from '~/core/events'
import { shell } from 'electron'
import { convertToPng } from '~/utils'
import icon from '../../../../../resources/icon.ico?asset'
import i18next from 'i18next'

export interface AppConfig {
  openAtLogin: boolean
  quitToTray: boolean
}

export class TrayManager {
  private static instance: TrayManager | null = null
  private tray: Tray | null = null
  private mainWindow: BrowserWindow | null = null
  private config: AppConfig | null = null
  private isQuitting: boolean = false

  private constructor() {
    // Private constructor to enforce singleton pattern
  }

  public static async getInstance(mainWindow?: BrowserWindow): Promise<TrayManager> {
    if (!TrayManager.instance) {
      TrayManager.instance = new TrayManager()
      if (mainWindow) {
        await TrayManager.instance.init(mainWindow)
      }
    } else if (mainWindow) {
      TrayManager.instance.mainWindow = mainWindow
    }
    return TrayManager.instance
  }

  public static async updateRecentGames(): Promise<void> {
    if (TrayManager.instance) {
      TrayManager.instance.updateTrayMenu()
    }
  }

  private async init(mainWindow: BrowserWindow): Promise<void> {
    this.mainWindow = mainWindow
    this.config = await ConfigDBManager.getConfigValue('general')

    // Listen for configuration updates
    eventBus.on('tray:config-updated', async () => {
      await this.updateConfig()
    })

    this.createTray()
    await this.setupWindowEvents()
  }

  public async updateConfig(): Promise<void> {
    this.config = await ConfigDBManager.getConfigValue('general')
    this.updateTrayMenu()
  }

  private async setupWindowEvents(): Promise<void> {
    if (!this.mainWindow) return

    this.mainWindow.on('close', (event) => {
      // Prevent closing if quitToTray is enabled
      if (!this.isQuitting && this.config?.quitToTray) {
        event.preventDefault()
        this.mainWindow?.hide()
      }
    })

    app.on('before-quit', () => {
      this.isQuitting = true
    })
  }

  private createTray(): void {
    if (this.tray) return

    this.tray = new Tray(icon)
    this.tray.setToolTip('vnite')
    this.setTrayMenu()
    this.bindTrayEvents()
  }

  private async setTrayMenu(): Promise<void> {
    if (!this.tray) return

    const recentGames = await this.getRecentGames()
    const template: Array<Electron.MenuItemConstructorOptions> = []

    if (recentGames.length > 0) {
      recentGames.forEach((game) => {
        template.push({
          label: this.truncateText(game.name, 10),
          icon: game.icon
            ? nativeImage.createFromBuffer(game.icon).resize({ width: 16, height: 16 })
            : undefined,
          click: () => {
            shell.openExternal(`vnite://rungameid/${game.id}`)
          }
        })
      })

      template.push({ type: 'separator' })
    }

    template.push(
      {
        label: i18next.t('tray:showMainWindow'),
        click: (): void => {
          this.showMainWindow()
        }
      },
      { type: 'separator' },
      {
        label: i18next.t('tray:settings'),
        submenu: [
          {
            label: i18next.t('tray:openAtLogin'),
            type: 'checkbox',
            checked: this.config?.openAtLogin,
            click: async (menuItem): Promise<void> => {
              await ConfigDBManager.setConfigValue('general.openAtLogin', menuItem.checked)
              app.setLoginItemSettings({
                openAtLogin: menuItem.checked,
                args: ['--hidden']
              })
            }
          },
          {
            label: i18next.t('tray:quitToTray'),
            type: 'checkbox',
            checked: this.config?.quitToTray,
            click: async (menuItem): Promise<void> => {
              await ConfigDBManager.setConfigValue('general.quitToTray', menuItem.checked)
              await this.updateConfig()
            }
          }
        ]
      },
      { type: 'separator' },
      {
        label: i18next.t('tray:quit'),
        click: (): void => {
          this.isQuitting = true
          app.quit()
        }
      }
    )

    const contextMenu = Menu.buildFromTemplate(template)
    this.tray.setContextMenu(contextMenu)
  }

  private truncateText(text: string, maxLength: number): string {
    if (!text) return ''
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text
  }

  private async getRecentGames(): Promise<
    Array<{ id: string; name: string; icon: Buffer | null }>
  > {
    try {
      const gameDocs = await GameDBManager.getAllGames()
      const recentGameIds = (
        await GameDBManager.sortGames({ by: 'record.lastRunDate', order: 'desc' })
      ).slice(0, 5)

      const recentGames = await Promise.all(
        recentGameIds.map(async (gameId) => {
          const game = gameDocs[gameId]
          let icon = await GameDBManager.getGameImage(gameId, 'icon')
          if (icon) {
            icon = await convertToPng(icon)
          }

          return {
            id: gameId,
            name: game?.metadata?.name || 'unknown',
            icon
          }
        })
      )

      return recentGames.filter((game) => game.name)
    } catch (error) {
      console.error('Failed to get recent games:', error)
      return []
    }
  }

  private bindTrayEvents(): void {
    if (!this.tray) return

    if (process.platform !== 'darwin') {
      this.tray.on('click', () => {
        this.showMainWindow()
      })
    }

    if (process.platform === 'darwin') {
      this.tray.on('right-click', () => {
        if (this.tray) {
          this.tray.popUpContextMenu()
        }
      })
    }
  }

  private showMainWindow(): void {
    if (!this.mainWindow) return

    if (this.mainWindow.isMinimized()) {
      this.mainWindow.restore()
    }
    if (!this.mainWindow.isVisible()) {
      this.mainWindow.show()
    }
    this.mainWindow.focus()
  }

  public updateTrayIcon(iconPath: string): void {
    if (this.tray) {
      const icon = nativeImage.createFromPath(iconPath)
      this.tray.setImage(icon)
    }
  }

  private updateTrayMenu(): void {
    this.setTrayMenu()
  }

  public destroy(): void {
    if (this.tray) {
      this.tray.destroy()
      this.tray = null
    }
  }
}

export async function setupTray(mainWindow: BrowserWindow): Promise<TrayManager> {
  return await TrayManager.getInstance(mainWindow)
}

export const updateRecentGamesInTray = TrayManager.updateRecentGames
