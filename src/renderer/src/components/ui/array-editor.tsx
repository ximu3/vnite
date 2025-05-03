import React, { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@ui/dialog'
import { Button } from '@ui/button'
import { Input } from '@ui/input'
import { Badge } from '@ui/badge'
import { Tooltip, TooltipContent, TooltipTrigger } from '@ui/tooltip'
import { X, Plus } from 'lucide-react'
import { cn } from '~/utils'
import { useTranslation } from 'react-i18next'

interface ArrayEditorProps {
  value: string[]
  onChange: (value: string[]) => void
  placeholder?: string
  tooltipText?: string
  className?: string
  isHaveTooltip?: boolean
  dialogTitle?: string
  dialogPlaceholder?: string
}

export function ArrayEditor({
  value,
  onChange,
  placeholder,
  tooltipText,
  className,
  isHaveTooltip = true,
  dialogTitle,
  dialogPlaceholder
}: ArrayEditorProps): JSX.Element {
  const { t } = useTranslation('utils')
  // State for adding elements
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [newElement, setNewElement] = useState('')

  // State for editing elements
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editingElement, setEditingElement] = useState('')
  const [editingIndex, setEditingIndex] = useState(-1)

  const handleAddElement = (): void => {
    if (newElement.trim() !== '') {
      // Check if element already exists
      if (!value.includes(newElement.trim())) {
        const newArray = [...value, newElement.trim()]
        onChange(newArray)
      }
      setNewElement('')
      setIsAddDialogOpen(false)
    }
  }

  const handleEditElement = (element: string, index: number): void => {
    setEditingElement(element)
    setEditingIndex(index)
    setIsEditDialogOpen(true)
  }

  const handleUpdateElement = (): void => {
    if (editingElement.trim() !== '') {
      // Check for duplicates (excluding the element being edited)
      const otherElements = value.filter((_, i) => i !== editingIndex)
      if (!otherElements.includes(editingElement.trim())) {
        const newArray = [...value]
        newArray[editingIndex] = editingElement.trim()
        onChange(newArray)
        setIsEditDialogOpen(false)
      }
    }
  }

  const handleRemoveElement = (index: number): void => {
    const newArray = value.filter((_, i) => i !== index)
    onChange(newArray)
  }

  const defaultPlaceholder = t('arrayEditor.clickPlusToAdd')
  const defaultDialogTitle = t('arrayEditor.addElement')
  const defaultDialogPlaceholder = t('arrayEditor.enterElement')

  const editorContent = (
    <div className={cn('w-full flex flex-row', className)}>
      <div className="flex px-3 py-1 overflow-x-auto text-sm bg-transparent border border-r-0 shadow-sm grow rounded-l-md scrollbar-base-thin border-input h-9">
        {value.length === 0 ? (
          <div className="self-center text-sm text-muted-foreground">
            {placeholder || defaultPlaceholder}
          </div>
        ) : (
          value.map((item, index) => (
            <Badge
              key={index}
              variant="secondary"
              className="px-2 py-1 text-xs m-0.5 group items-center flex flex-row"
            >
              <span
                className="text-center cursor-pointer select-none place-self-center"
                onClick={() => handleEditElement(item, index)}
              >
                {item}
              </span>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  handleRemoveElement(index)
                }}
                className="ml-2 hover:text-destructive focus:outline-none place-self-center"
              >
                <X className="w-3 h-3" />
              </button>
            </Badge>
          ))
        )}
      </div>
      <Button
        type="button"
        variant="outline"
        onClick={() => setIsAddDialogOpen(true)}
        className="p-1 rounded-l-none border-input h-9"
        aria-label={t('arrayEditor.addElement')}
      >
        <Plus className="w-4 h-4" />
      </Button>

      {/* Add element dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{dialogTitle || defaultDialogTitle}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <Input
              value={newElement}
              onChange={(e) => setNewElement(e.target.value)}
              placeholder={dialogPlaceholder || defaultDialogPlaceholder}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleAddElement()
                }
              }}
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setIsAddDialogOpen(false)}>
              {t('common.cancel')}
            </Button>
            <Button type="button" onClick={handleAddElement}>
              {t('arrayEditor.add')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit element dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t('arrayEditor.editElement')}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <Input
              value={editingElement}
              onChange={(e) => setEditingElement(e.target.value)}
              placeholder={dialogPlaceholder || defaultDialogPlaceholder}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleUpdateElement()
                }
              }}
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              {t('common.cancel')}
            </Button>
            <Button type="button" onClick={handleUpdateElement}>
              {t('arrayEditor.update')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )

  return (
    <React.Fragment>
      {isHaveTooltip ? (
        <Tooltip>
          <TooltipTrigger className={cn('p-0 max-w-none m-0 w-full')}>
            {editorContent}
          </TooltipTrigger>
          {tooltipText && (
            <TooltipContent side="right">
              <div className={cn('text-xs')}>{tooltipText}</div>
            </TooltipContent>
          )}
        </Tooltip>
      ) : (
        editorContent
      )}
    </React.Fragment>
  )
}
