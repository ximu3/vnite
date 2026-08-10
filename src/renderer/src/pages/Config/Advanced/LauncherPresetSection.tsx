import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'

import type { LauncherPreset, LauncherPresetMonitorMode } from '@appTypes/models'
import { LAUNCHER_PRESET_VARIABLES } from '@appTypes/models'
import { ArrayTextarea } from '@ui/array-textarea'
import { Button } from '@ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@ui/card'
import { Input } from '@ui/input'
import { ScrollArea } from '@ui/scroll-area'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@ui/select'
import { ipcManager } from '~/app/ipc'
import { useConfigLocalState } from '~/hooks'
import { useConfigLocalStore } from '~/stores'
import { cn } from '~/utils'

function getUniquePresetName(baseName: string, presets: LauncherPreset[]): string {
  const existingNames = new Set(presets.map((preset) => preset.name.trim().toLocaleLowerCase()))
  if (!existingNames.has(baseName.trim().toLocaleLowerCase())) return baseName

  let suffix = 2
  while (existingNames.has(`${baseName} ${suffix}`.toLocaleLowerCase())) suffix++
  return `${baseName} ${suffix}`
}

function PresetField({
  label,
  className,
  children
}: {
  label: string
  className?: string
  children: React.ReactNode
}): React.JSX.Element {
  return (
    <div className={cn('flex min-w-0 flex-col gap-1.5', className)}>
      <label className="text-xs font-medium text-muted-foreground">{label}</label>
      {children}
    </div>
  )
}

export function LauncherPresetSection(): React.JSX.Element {
  const { t } = useTranslation('config')
  const [presets, setPresets, savePresets, setPresetsAndSave] = useConfigLocalState(
    'game.launcher.presets',
    true
  )
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const selectedPreset = presets.find((preset) => preset.id === selectedId)

  function updateSelectedPreset(
    updater: (preset: LauncherPreset) => LauncherPreset,
    saveImmediately = false
  ): void {
    if (!selectedPreset) return
    const nextPresets = presets.map((preset) =>
      preset.id === selectedPreset.id ? updater(preset) : preset
    )
    if (saveImmediately) void setPresetsAndSave(nextPresets)
    else setPresets(nextPresets)
  }

  async function handleAdd(): Promise<void> {
    const id = await ipcManager.invoke('utils:generate-uuid')
    const name = getUniquePresetName(t('advanced.launcherPresets.newPreset'), presets)
    const nextPreset: LauncherPreset = {
      id,
      name,
      mode: 'file',
      path: LAUNCHER_PRESET_VARIABLES.gamePath,
      monitorMode: 'folder',
      monitorPath: LAUNCHER_PRESET_VARIABLES.gameDirectory
    }
    await setPresetsAndSave([...presets, nextPreset])
    setSelectedId(id)
  }

  async function handleDuplicate(): Promise<void> {
    if (!selectedPreset) return

    const id = await ipcManager.invoke('utils:generate-uuid')
    const name = getUniquePresetName(selectedPreset.name, presets)
    const nextPreset = { ...selectedPreset, id, name }
    await setPresetsAndSave([...presets, nextPreset])
    setSelectedId(id)
  }

  async function handleDelete(presetId: string): Promise<void> {
    const nextPresets = presets.filter((preset) => preset.id !== presetId)
    await setPresetsAndSave(nextPresets)
    if (selectedId === presetId) setSelectedId(null)
  }

  async function handleNameBlur(): Promise<void> {
    if (!selectedPreset) return
    const normalizedName = selectedPreset.name.trim().toLocaleLowerCase()
    const duplicated = presets.some(
      (preset) =>
        preset.id !== selectedPreset.id && preset.name.trim().toLocaleLowerCase() === normalizedName
    )
    if (!normalizedName || duplicated) {
      const storedPresets = useConfigLocalStore
        .getState()
        .getConfigLocalValue('game.launcher.presets')
      setPresets(storedPresets)
      toast.error(
        t(
          duplicated
            ? 'advanced.launcherPresets.validation.duplicate-name'
            : 'advanced.launcherPresets.validation.name-required'
        )
      )
      return
    }
    await savePresets()
  }

  function handleModeChange(mode: LauncherPreset['mode']): void {
    updateSelectedPreset((preset) => {
      const common = {
        id: preset.id,
        name: preset.name,
        monitorMode: preset.monitorMode,
        monitorPath: preset.monitorPath
      }
      if (mode === 'file') {
        return { ...common, mode, path: LAUNCHER_PRESET_VARIABLES.gamePath }
      }
      if (mode === 'url') {
        return { ...common, mode, url: '', browserPath: '' }
      }
      return {
        ...common,
        mode,
        workingDirectory: LAUNCHER_PRESET_VARIABLES.gameDirectory,
        command: [`"${LAUNCHER_PRESET_VARIABLES.gamePath}"`]
      }
    }, true)
  }

  async function copyVariable(variable: string): Promise<void> {
    await navigator.clipboard.writeText(variable)
    toast.success(t('advanced.launcherPresets.notifications.variableCopied'))
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('advanced.launcherPresets.title')}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="mb-4 flex flex-wrap items-center gap-2 rounded-lg border px-3 py-2.5">
          <span className="text-sm text-muted-foreground">
            {t('advanced.launcherPresets.variables')}:
          </span>
          {Object.values(LAUNCHER_PRESET_VARIABLES).map((variable) => (
            <Button
              key={variable}
              type="button"
              variant="ghost"
              size="sm"
              className="h-7 rounded-md px-2.5 font-mono text-xs hover:bg-accent"
              onClick={() => void copyVariable(variable)}
            >
              {variable}
            </Button>
          ))}
        </div>

        <div className="grid h-[30rem] grid-cols-[250px_minmax(0,1fr)] overflow-hidden rounded-xl border shadow-sm">
          <div className="flex min-h-0 flex-col border-r">
            <div className="border-b p-2.5">
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-center border-dashed "
                onClick={handleAdd}
              >
                <span className="icon-[mdi--plus] h-4 w-4"></span>
                {t('advanced.launcherPresets.newPreset')}
              </Button>
            </div>
            <ScrollArea className="min-h-0 flex-1">
              <div className="space-y-1 p-2.5 select-none">
                {presets.length > 0 ? (
                  presets.map((preset) => (
                    <button
                      key={preset.id}
                      type="button"
                      className={cn(
                        'flex w-full items-center rounded-lg px-3 py-2 text-left text-sm transition-colors hover:bg-accent/50',
                        selectedId === preset.id &&
                          'bg-accent/70 text-accent-foreground shadow-sm ring-1 ring-border/50'
                      )}
                      onClick={() => setSelectedId(preset.id)}
                    >
                      <span className="min-w-0 flex-1 truncate">
                        {preset.name || t('advanced.launcherPresets.unnamedPreset')}
                      </span>
                    </button>
                  ))
                ) : (
                  <div className="px-2 py-3 text-xs text-muted-foreground">
                    {t('advanced.launcherPresets.empty')}
                  </div>
                )}
              </div>
            </ScrollArea>
          </div>

          <div className="scrollbar-base min-w-0 overflow-y-auto p-6">
            {selectedPreset ? (
              <div className="mx-auto grid max-w-5xl grid-cols-1 gap-5 xl:grid-cols-[180px_minmax(0,1fr)]">
                <header className="col-span-full flex items-center gap-3 border-b pb-5">
                  <Input
                    value={selectedPreset.name}
                    className="flex-1 font-medium"
                    onChange={(event) => {
                      const name = event.target.value
                      updateSelectedPreset((preset) => ({ ...preset, name }))
                    }}
                    onBlur={() => void handleNameBlur()}
                  />
                  <Button type="button" variant="outline" onClick={handleDuplicate}>
                    <span className="icon-[mdi--content-copy] size-4"></span>
                    {t('advanced.launcherPresets.duplicate')}
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="hover:bg-destructive/10 hover:text-destructive"
                    onClick={() => void handleDelete(selectedPreset.id)}
                  >
                    <span className="icon-[mdi--delete-outline] size-5"></span>
                  </Button>
                </header>

                <PresetField label={t('advanced.launcherPresets.launchMode')}>
                  <Select
                    value={selectedPreset.mode}
                    onValueChange={(value) => handleModeChange(value as LauncherPreset['mode'])}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="file">
                        {t('advanced.launcherPresets.mode.file')}
                      </SelectItem>
                      <SelectItem value="url">{t('advanced.launcherPresets.mode.url')}</SelectItem>
                      <SelectItem value="script">
                        {t('advanced.launcherPresets.mode.script')}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </PresetField>

                {selectedPreset.mode === 'file' && (
                  <PresetField label={t('advanced.launcherPresets.filePath')}>
                    <Input
                      value={selectedPreset.path}
                      onChange={(event) =>
                        updateSelectedPreset((preset) =>
                          preset.mode === 'file' ? { ...preset, path: event.target.value } : preset
                        )
                      }
                      onBlur={savePresets}
                    />
                  </PresetField>
                )}

                {selectedPreset.mode === 'url' && (
                  <div className="space-y-4">
                    <PresetField label={t('advanced.launcherPresets.url')}>
                      <Input
                        value={selectedPreset.url}
                        onChange={(event) => {
                          const url = event.target.value
                          updateSelectedPreset((preset) =>
                            preset.mode === 'url' ? { ...preset, url } : preset
                          )
                        }}
                        onBlur={savePresets}
                      />
                    </PresetField>
                    <PresetField label={t('advanced.launcherPresets.browserPath')}>
                      <Input
                        value={selectedPreset.browserPath}
                        onChange={(event) =>
                          updateSelectedPreset((preset) =>
                            preset.mode === 'url'
                              ? { ...preset, browserPath: event.target.value }
                              : preset
                          )
                        }
                        onBlur={savePresets}
                      />
                    </PresetField>
                  </div>
                )}

                {selectedPreset.mode === 'script' && (
                  <div className="space-y-4">
                    <PresetField label={t('advanced.launcherPresets.workingDirectory')}>
                      <Input
                        value={selectedPreset.workingDirectory}
                        onChange={(event) =>
                          updateSelectedPreset((preset) =>
                            preset.mode === 'script'
                              ? { ...preset, workingDirectory: event.target.value }
                              : preset
                          )
                        }
                        onBlur={savePresets}
                      />
                    </PresetField>
                    <PresetField label={t('advanced.launcherPresets.command')}>
                      <ArrayTextarea
                        value={selectedPreset.command}
                        onChange={(command) =>
                          updateSelectedPreset((preset) =>
                            preset.mode === 'script' ? { ...preset, command } : preset
                          )
                        }
                        onBlur={savePresets}
                        className="min-h-24"
                      />
                    </PresetField>
                  </div>
                )}

                <PresetField label={t('advanced.launcherPresets.monitorMode')}>
                  <Select
                    value={selectedPreset.monitorMode}
                    onValueChange={(value) =>
                      updateSelectedPreset(
                        (preset) => ({
                          ...preset,
                          monitorMode: value as LauncherPresetMonitorMode
                        }),
                        true
                      )
                    }
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="folder">
                        {t('advanced.launcherPresets.monitor.folder')}
                      </SelectItem>
                      <SelectItem value="file">
                        {t('advanced.launcherPresets.monitor.file')}
                      </SelectItem>
                      <SelectItem value="process">
                        {t('advanced.launcherPresets.monitor.process')}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </PresetField>
                <PresetField
                  label={
                    selectedPreset.monitorMode === 'process'
                      ? t('advanced.launcherPresets.processName')
                      : t('advanced.launcherPresets.monitorPath')
                  }
                >
                  <Input
                    value={selectedPreset.monitorPath}
                    onChange={(event) =>
                      updateSelectedPreset((preset) => ({
                        ...preset,
                        monitorPath: event.target.value
                      }))
                    }
                    onBlur={savePresets}
                  />
                </PresetField>
              </div>
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                {t('advanced.launcherPresets.selectPreset')}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
