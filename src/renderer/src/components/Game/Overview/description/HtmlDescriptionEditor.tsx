import { autocompletion } from '@codemirror/autocomplete'
import { html } from '@codemirror/lang-html'
import { foldGutter } from '@codemirror/language'
import { EditorView } from '@codemirror/view'
import { Button } from '@ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@ui/tooltip'
import CodeMirror, { type ReactCodeMirrorRef } from '@uiw/react-codemirror'
import { forwardRef, useImperativeHandle, useMemo, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { useTheme } from '~/components/ThemeProvider'
import { cn } from '~/utils'

type ToolbarAction = {
  label: string
  icon: string
  run: (view: EditorView) => void | Promise<void>
}

export interface HtmlDescriptionEditorHandle {
  focusEditorEnd: () => void
}

export const HtmlDescriptionEditor = forwardRef<
  HtmlDescriptionEditorHandle,
  {
    value: string
    onChange: (value: string) => void
  }
>(function HtmlDescriptionEditor(
  {
    value,
    onChange
  }: {
    value: string
    onChange: (value: string) => void
  },
  ref
): React.JSX.Element {
  const { t } = useTranslation('game')
  const { isDark } = useTheme()
  const editorRef = useRef<ReactCodeMirrorRef>(null)

  useImperativeHandle(
    ref,
    () => ({
      focusEditorEnd: (): void => {
        const view = editorRef.current?.view
        if (!view) return

        const end = view.state.doc.length
        view.dispatch({
          selection: { anchor: end },
          scrollIntoView: true
        })
        view.focus()
      }
    }),
    []
  )

  const extensions = useMemo(
    () => [
      html({
        matchClosingTags: false,
        selfClosingTags: true,
        autoCloseTags: true
      }),
      autocompletion({
        activateOnTyping: false
      }),
      foldGutter({
        markerDOM: (open) => {
          const marker = document.createElement('span')
          marker.className = cn(
            'inline-block size-4 rounded-sm p-0 text-muted-foreground align-[-0.125rem]',
            open ? 'icon-[mdi--chevron-down]' : 'icon-[mdi--chevron-right]'
          )
          return marker
        }
      }),
      EditorView.lineWrapping
    ],
    []
  )

  function runAction(action: ToolbarAction): void {
    const view = editorRef.current?.view
    if (!view) return

    void action.run(view)
  }

  const toolbarActions: ToolbarAction[][] = [
    [
      {
        label: t('detail.overview.description.editor.toolbar.heading1', {
          defaultValue: 'Heading 1'
        }),
        icon: 'icon-[mdi--format-header-1]',
        run: (view) => applyHeading(view, 1)
      },
      {
        label: t('detail.overview.description.editor.toolbar.heading2', {
          defaultValue: 'Heading 2'
        }),
        icon: 'icon-[mdi--format-header-2]',
        run: (view) => applyHeading(view, 2)
      },
      {
        label: t('detail.overview.description.editor.toolbar.heading3', {
          defaultValue: 'Heading 3'
        }),
        icon: 'icon-[mdi--format-header-3]',
        run: (view) => applyHeading(view, 3)
      }
    ],
    [
      {
        label: t('detail.overview.description.editor.toolbar.paragraph', {
          defaultValue: 'Paragraph'
        }),
        icon: 'icon-[mdi--format-paragraph]',
        run: insertParagraph
      },
      {
        label: t('detail.overview.description.editor.toolbar.lineBreak', {
          defaultValue: 'Line break'
        }),
        icon: 'icon-[mdi--keyboard-return]',
        run: insertLineBreak
      },
      {
        label: t('detail.overview.description.editor.toolbar.bold', {
          defaultValue: 'Bold'
        }),
        icon: 'icon-[mdi--format-bold]',
        run: (view) => wrapSelection(view, '<strong>', '</strong>')
      },
      {
        label: t('detail.overview.description.editor.toolbar.italic', {
          defaultValue: 'Italic'
        }),
        icon: 'icon-[mdi--format-italic]',
        run: (view) => wrapSelection(view, '<em>', '</em>')
      },
      {
        label: t('detail.overview.description.editor.toolbar.underline', {
          defaultValue: 'Underline'
        }),
        icon: 'icon-[mdi--format-underline]',
        run: (view) => wrapSelection(view, '<u>', '</u>')
      }
    ],
    [
      {
        label: t('detail.overview.description.editor.toolbar.image', {
          defaultValue: 'Image'
        }),
        icon: 'icon-[mdi--image-outline]',
        run: insertImage
      }
    ]
  ]

  return (
    <div className={cn('flex h-full min-h-0 flex-col gap-3')}>
      <div className={cn('flex flex-wrap items-center gap-1 rounded-md border bg-muted/20 p-1')}>
        {toolbarActions.map((group, groupIndex) => (
          <div key={groupIndex} className={cn('flex items-center gap-1')}>
            {groupIndex > 0 && (
              <div
                className={cn(
                  'mx-2 h-6 w-px rounded-full bg-border shadow-[1px_0_0_hsl(var(--background))]'
                )}
              />
            )}
            {group.map((action) => (
              <Tooltip key={action.label}>
                <TooltipTrigger asChild>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className={cn('size-8')}
                    onClick={() => runAction(action)}
                  >
                    <span className={cn(action.icon, 'size-4')} />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>{action.label}</TooltipContent>
              </Tooltip>
            ))}
          </div>
        ))}
      </div>

      <div className={cn('min-h-0 flex-1')}>
        <CodeMirror
          ref={editorRef}
          value={value}
          height="100%"
          theme={isDark ? 'dark' : 'light'}
          extensions={extensions}
          placeholder={t('detail.overview.description.editor.placeholder')}
          basicSetup={{
            autocompletion: false,
            closeBrackets: true,
            bracketMatching: true,
            highlightActiveLine: true,
            highlightSelectionMatches: true,
            searchKeymap: true,
            foldGutter: false
          }}
          onChange={onChange}
          className={cn(
            'h-full overflow-hidden rounded-md border bg-background text-sm',
            '[&_.cm-editor]:h-full',
            '[&_.cm-scroller]:font-sans [&_.cm-scroller]:leading-6',
            '[&_.cm-scroller]:scrollbar [&_.cm-scroller]:scrollbar-h-1 [&_.cm-scroller]:scrollbar-w-1 [&_.cm-scroller]:scrollbar-thumb-border [&_.cm-scroller]:scrollbar-thumb-rounded-lg [&_.cm-scroller]:scrollbar-track-transparent',
            '[&_.cm-content]:min-h-full [&_.cm-content]:px-3 [&_.cm-content]:py-3 [&_.cm-content]:font-sans',
            '[&_.cm-gutters]:border-border [&_.cm-gutters]:bg-transparent [&_.cm-gutters]:font-sans [&_.cm-gutters]:text-muted-foreground'
          )}
        />
      </div>
    </div>
  )
})

function wrapSelection(view: EditorView, prefix: string, suffix: string): void {
  const range = view.state.selection.main
  const selected = view.state.sliceDoc(range.from, range.to)
  const insert = `${prefix}${selected}${suffix}`
  const cursor = range.empty ? range.from + prefix.length : range.from + insert.length

  replaceContent(view, range.from, range.to, insert, { anchor: cursor })
}

function insertParagraph(view: EditorView): void {
  wrapSelection(view, '<p>', '</p>')
}

function applyHeading(view: EditorView, level: 1 | 2 | 3): void {
  wrapSelection(view, `<h${level}>`, `</h${level}>`)
}

function insertLineBreak(view: EditorView): void {
  const range = view.state.selection.main
  replaceContent(view, range.from, range.to, '<br />', { anchor: range.from + 6 })
}

function insertImage(view: EditorView): void {
  const range = view.state.selection.main
  const insert = '<img src="https://" alt="" />'
  const srcStart = range.from + '<img src="'.length
  const srcEnd = srcStart + 'https://'.length

  replaceContent(view, range.from, range.to, insert, {
    anchor: srcStart,
    head: srcEnd
  })
}

function replaceContent(
  view: EditorView,
  from: number,
  to: number,
  insert: string,
  selection: { anchor: number; head?: number }
): void {
  view.dispatch({
    changes: { from, to, insert },
    selection,
    scrollIntoView: true
  })
  view.focus()
}
