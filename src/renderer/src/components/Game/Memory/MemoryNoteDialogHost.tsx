import type { gameDoc } from '@appTypes/models'
import { useEffect } from 'react'
import { NoteDialog } from './NoteDialog'
import { useMemoryStore } from './store'

type MemoryList = gameDoc['memory']['memoryList']

export function MemoryNoteDialogHost({
  memoryList,
  saveNote
}: {
  memoryList: MemoryList
  saveNote: (memoryId: string, note: string) => Promise<void>
}): React.JSX.Element | null {
  const noteDialog = useMemoryStore((state) => state.noteDialog)
  const closeNoteDialog = useMemoryStore((state) => state.closeNoteDialog)

  useEffect(() => {
    return (): void => {
      closeNoteDialog()
    }
  }, [closeNoteDialog])

  const memory = noteDialog.open ? memoryList[noteDialog.memoryId] : null

  useEffect(() => {
    if (noteDialog.open && !memory) {
      closeNoteDialog()
    }
  }, [closeNoteDialog, memory, noteDialog])

  if (!noteDialog.open || !memory) return null

  return (
    <NoteDialog
      key={`memory-note-${noteDialog.memoryId}-${noteDialog.initialMode}`}
      setIsOpen={(open) => {
        if (!open) {
          closeNoteDialog()
        }
      }}
      note={memory.note ?? ''}
      saveNote={(note) => saveNote(noteDialog.memoryId, note)}
      initialMode={noteDialog.initialMode}
    />
  )
}
