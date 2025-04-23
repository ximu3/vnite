import { useState, useEffect, useCallback } from 'react'
import { Button } from '@ui/button'
import { Input } from '@ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@ui/dialog'
import { toast } from 'sonner'
import { useTranslation } from 'react-i18next'
import { cn } from '~/utils'

interface HotkeySettingProps {
  defaultHotkey: string
  onHotkeyChange: (newHotkey: string) => void
  inputClassName?: string
  className?: string
}

// Special Key Mapping Table
const SPECIAL_KEYS_MAP: Record<string, string> = {
  escape: 'esc',
  tab: 'tab',
  space: 'space',
  arrowup: 'up',
  arrowdown: 'down',
  arrowleft: 'left',
  arrowright: 'right',
  meta: 'win',
  windows: 'win',
  os: 'win',
  enter: 'enter',
  return: 'enter',
  delete: 'del',
  backspace: 'backspace',
  capslock: 'capslock',
  control: 'ctrl',
  ' ': 'space'
}

export function HotkeySetting({
  defaultHotkey,
  onHotkeyChange,
  inputClassName = 'font-mono',
  className
}: HotkeySettingProps): JSX.Element {
  const { t } = useTranslation()

  const [isOpen, setIsOpen] = useState(false)
  const [tempHotkey, setTempHotkey] = useState('')
  const [isRecording, setIsRecording] = useState(false)
  const [pressedKeys, setPressedKeys] = useState<string[]>([])

  // Normalize key names
  const normalizeKey = (key: string): string => {
    const lowerKey = key.toLowerCase()
    return SPECIAL_KEYS_MAP[lowerKey] || lowerKey
  }

  // Verify shortcut key format
  const validateHotkey = (hotkey: string): boolean => {
    const keys = hotkey.split('+').map((k) => k.trim())
    if (keys.length === 0) {
      toast.error(t('utils:hotkeySetting.errors.invalidHotkey'))
      return false
    }

    // Check for key duplication
    if (new Set(keys).size !== keys.length) {
      toast.error(t('utils:hotkeySetting.errors.duplicateKeys'))
      return false
    }

    return true
  }

  // Processing direct text input
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    if (!isRecording) {
      const value = e.target.value.toLowerCase()
      setTempHotkey(value)
    }
  }

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!isRecording) return

      e.preventDefault()
      e.stopPropagation()

      const key = normalizeKey(e.key)

      // Ignored if the keystroke has already been recorded
      if (pressedKeys.includes(key)) return

      // Add a new key to the end of the array
      setPressedKeys((prev) => {
        const newKeys = [...prev, key]
        // Update temporary shortcuts
        setTempHotkey(newKeys.join('+'))
        return newKeys
      })
    },
    [isRecording, pressedKeys]
  )

  const handleKeyUp = useCallback(
    (e: KeyboardEvent) => {
      if (!isRecording) return

      e.preventDefault()
      e.stopPropagation()

      const key = normalizeKey(e.key)

      // Remove released keys from the array
      setPressedKeys((prev) => {
        const newKeys = prev.filter((k) => k !== key)
        return newKeys
      })

      // Stop logging when all keys are released
      if (!e.metaKey && !e.ctrlKey && !e.altKey && !e.shiftKey) {
        setIsRecording(false)
      }
    },
    [isRecording]
  )

  useEffect(() => {
    if (isRecording) {
      window.addEventListener('keydown', handleKeyDown, true)
      window.addEventListener('keyup', handleKeyUp, true)
    }
    return (): void => {
      window.removeEventListener('keydown', handleKeyDown, true)
      window.removeEventListener('keyup', handleKeyUp, true)
    }
  }, [isRecording, handleKeyDown, handleKeyUp])

  const startRecording = (): void => {
    setIsRecording(true)
    setTempHotkey('')
    setPressedKeys([])
  }

  const handleSave = (): void => {
    if (tempHotkey && validateHotkey(tempHotkey)) {
      onHotkeyChange(tempHotkey)
      toast.success(t('utils:hotkeySetting.notifications.hotkeyUpdated'))
      setIsOpen(false)
    }
  }

  // Shortcut keys for formatting the display
  const formatHotkey = (hotkey: string): string => {
    return hotkey
      .split('+')
      .map((key) => key.charAt(0).toUpperCase() + key.slice(1))
      .join(' + ')
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <div className={cn('flex items-center space-x-4', className)}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm">
            {formatHotkey(defaultHotkey)}
          </Button>
        </DialogTrigger>
      </div>

      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{t('utils:hotkeySetting.title')}</DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="space-y-4">
            <Input
              value={isRecording ? t('utils:hotkeySetting.recording') : tempHotkey}
              onChange={handleInputChange}
              placeholder={t('utils:hotkeySetting.placeholder')}
              className={inputClassName}
            />

            <Button
              onClick={startRecording}
              variant={isRecording ? 'secondary' : 'outline'}
              className="w-full"
            >
              {isRecording
                ? t('utils:hotkeySetting.recordingButton')
                : t('utils:hotkeySetting.startRecordButton')}
            </Button>

            {isRecording && pressedKeys.length > 0 && (
              <div className="text-sm text-muted-foreground">
                {t('utils:hotkeySetting.currentKeys')}: {formatHotkey(pressedKeys.join('+'))}
              </div>
            )}

            <div className="text-xs text-muted-foreground">
              {t('utils:hotkeySetting.supportedKeys')}
            </div>
          </div>
        </div>

        <div className="flex justify-end space-x-4">
          <Button variant="ghost" onClick={() => setIsOpen(false)}>
            {t('utils:common.cancel')}
          </Button>
          <Button onClick={handleSave} disabled={!tempHotkey}>
            {t('utils:common.save')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
