import { markdown, markdownLanguage } from '@codemirror/lang-markdown'
import { foldGutter, syntaxTree } from '@codemirror/language'
import { languages } from '@codemirror/language-data'
import { type Range } from '@codemirror/state'
import {
  Decoration,
  EditorView,
  ViewPlugin,
  type DecorationSet,
  type ViewUpdate
} from '@codemirror/view'
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
  run: (view: EditorView) => void
}

export interface MarkdownEditorHandle {
  focusEditorEnd: () => void
}

/**
 * Provides visible editor-side styling for Markdown inline formatting markers.
 *
 * The plugin highlights only syntax markers such as `**`, `*`, and `~~`. Formatted content itself
 * is left visually neutral so the editor remains close to raw Markdown while still making
 * formatting boundaries easier to scan.
 */
class MarkdownInlineFormattingPlugin {
  decorations: DecorationSet

  constructor(view: EditorView) {
    this.decorations = buildMarkdownInlineDecorations(view)
  }

  update(update: ViewUpdate): void {
    if (update.docChanged || update.viewportChanged) {
      this.decorations = buildMarkdownInlineDecorations(update.view)
    }
  }
}

const FORMATTING_MARK_DECORATION = Decoration.mark({ class: 'text-primary font-semibold' })
function buildMarkdownInlineDecorations(view: EditorView): DecorationSet {
  const ranges: Range<Decoration>[] = []

  syntaxTree(view.state).iterate({
    enter: (node) => {
      if (node.name === 'EmphasisMark' || node.name === 'StrikethroughMark') {
        ranges.push(FORMATTING_MARK_DECORATION.range(node.from, node.to))
      }
    }
  })

  return ranges.length ? Decoration.set(ranges, true) : Decoration.none
}

const markdownInlineFormatting = ViewPlugin.fromClass(MarkdownInlineFormattingPlugin, {
  decorations: (plugin) => plugin.decorations
})

export const MarkdownEditor = forwardRef<
  MarkdownEditorHandle,
  {
    value: string
    onChange: (value: string) => void
  }
>(function MarkdownEditor(
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
      markdown({
        base: markdownLanguage,
        codeLanguages: languages,
        addKeymap: true,
        completeHTMLTags: true,
        pasteURLAsLink: true
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
      markdownInlineFormatting,
      EditorView.lineWrapping
    ],
    []
  )

  function runAction(action: ToolbarAction): void {
    const view = editorRef.current?.view
    if (!view) return

    action.run(view)
  }

  const toolbarActions: ToolbarAction[][] = [
    [
      {
        label: t('detail.memory.editor.toolbar.heading1', { defaultValue: 'Heading 1' }),
        icon: 'icon-[mdi--format-header-1]',
        run: (view) => applyHeading(view, 1)
      },
      {
        label: t('detail.memory.editor.toolbar.heading2', { defaultValue: 'Heading 2' }),
        icon: 'icon-[mdi--format-header-2]',
        run: (view) => applyHeading(view, 2)
      },
      {
        label: t('detail.memory.editor.toolbar.heading3', { defaultValue: 'Heading 3' }),
        icon: 'icon-[mdi--format-header-3]',
        run: (view) => applyHeading(view, 3)
      },
      {
        label: t('detail.memory.editor.toolbar.heading4', { defaultValue: 'Heading 4' }),
        icon: 'icon-[mdi--format-header-4]',
        run: (view) => applyHeading(view, 4)
      }
    ],
    [
      {
        label: t('detail.memory.editor.toolbar.bold', { defaultValue: 'Bold' }),
        icon: 'icon-[mdi--format-bold]',
        run: (view) => wrapSelection(view, '**', '**')
      },
      {
        label: t('detail.memory.editor.toolbar.italic', { defaultValue: 'Italic' }),
        icon: 'icon-[mdi--format-italic]',
        run: (view) => wrapSelection(view, '*', '*')
      },
      {
        label: t('detail.memory.editor.toolbar.underline', { defaultValue: 'Underline' }),
        icon: 'icon-[mdi--format-underline]',
        run: (view) => wrapSelection(view, '<u>', '</u>')
      },
      {
        label: t('detail.memory.editor.toolbar.strikethrough', { defaultValue: 'Strikethrough' }),
        icon: 'icon-[mdi--format-strikethrough]',
        run: (view) => wrapSelection(view, '~~', '~~')
      },
      {
        label: t('detail.memory.editor.toolbar.inlineCode', { defaultValue: 'Inline code' }),
        icon: 'icon-[mdi--code-tags]',
        run: (view) => wrapSelection(view, '`', '`')
      },
      {
        label: t('detail.memory.editor.toolbar.link', { defaultValue: 'Link' }),
        icon: 'icon-[mdi--link-variant]',
        run: insertLink
      }
    ],
    [
      {
        label: t('detail.memory.editor.toolbar.quote', { defaultValue: 'Quote' }),
        icon: 'icon-[mdi--format-quote-close]',
        run: (view) => prefixSelectedLines(view, '> ')
      },
      {
        label: t('detail.memory.editor.toolbar.bulletedList', { defaultValue: 'Bulleted list' }),
        icon: 'icon-[mdi--format-list-bulleted]',
        run: (view) => prefixSelectedLines(view, '- ', stripListPrefix)
      },
      {
        label: t('detail.memory.editor.toolbar.numberedList', { defaultValue: 'Numbered list' }),
        icon: 'icon-[mdi--format-list-numbered]',
        run: (view) => prefixSelectedLines(view, (index) => `${index + 1}. `, stripListPrefix)
      },
      {
        label: t('detail.memory.editor.toolbar.taskList', { defaultValue: 'Task list' }),
        icon: 'icon-[mdi--checkbox-marked-outline]',
        run: (view) => prefixSelectedLines(view, '- [ ] ', stripListPrefix)
      },
      {
        label: t('detail.memory.editor.toolbar.codeBlock', { defaultValue: 'Code block' }),
        icon: 'icon-[mdi--code-braces]',
        run: insertCodeBlock
      },
      {
        label: t('detail.memory.editor.toolbar.horizontalRule', {
          defaultValue: 'Horizontal rule'
        }),
        icon: 'icon-[mdi--minus]',
        run: insertHorizontalRule
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
          placeholder={t('detail.memory.editor.placeholder', {
            defaultValue: 'Write with Markdown...'
          })}
          basicSetup={{
            autocompletion: true,
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

/**
 * Wraps the selected text, or the nearest inferred text segment, with inline Markdown markers.
 *
 * When the selection is empty, the command first tries to infer a nearby segment using whitespace
 * and punctuation boundaries. If no segment can be inferred, it inserts an empty pair of markers
 * and places the cursor between them so the user can continue typing naturally.
 *
 * @param view - The active CodeMirror editor view.
 * @param prefix - The marker inserted before the target text.
 * @param suffix - The marker inserted after the target text.
 */
function wrapSelection(view: EditorView, prefix: string, suffix: string): void {
  const selection = getSelectionOrNearbySegment(view)
  const selected = view.state.sliceDoc(selection.from, selection.to)
  const body = selected || ''
  const insert = `${prefix}${body}${suffix}`
  const cursor = body ? selection.from + insert.length : selection.from + prefix.length

  view.dispatch({
    changes: { from: selection.from, to: selection.to, insert },
    selection: { anchor: cursor },
    scrollIntoView: true
  })
  view.focus()
}

/**
 * Prefixes every line touched by the current selection with a Markdown block marker.
 *
 * Empty selections operate on the current cursor line. Non-empty selections operate on every
 * line intersected by the selection, excluding the trailing line when the selection ends exactly
 * at the beginning of that line. An optional `stripPrefix` callback can normalize existing list,
 * quote, or heading markers before the new prefix is applied.
 *
 * @param view - The active CodeMirror editor view.
 * @param prefix - A static prefix or a factory that receives the zero-based selected line index.
 * @param stripPrefix - Optional callback used to remove an existing compatible line prefix.
 */
function prefixSelectedLines(
  view: EditorView,
  prefix: string | ((index: number) => string),
  stripPrefix?: (line: string) => string
): void {
  const range = view.state.selection.main
  const doc = view.state.doc
  const startLine = doc.lineAt(range.from)
  const endPosition = range.empty ? range.to : Math.max(range.from, range.to - 1)
  const endLine = doc.lineAt(endPosition)
  const selectedText = doc.sliceString(startLine.from, endLine.to)
  const nextText = selectedText
    .split('\n')
    .map((line, index) => {
      const nextPrefix = typeof prefix === 'function' ? prefix(index) : prefix
      const body = stripPrefix ? stripPrefix(line) : line.replace(/^>\s?/, '')
      return `${nextPrefix}${body}`
    })
    .join('\n')

  view.dispatch({
    changes: { from: startLine.from, to: endLine.to, insert: nextText },
    selection: { anchor: startLine.from + nextText.length },
    scrollIntoView: true
  })
  view.focus()
}

/**
 * Converts the selected lines, or the current cursor line, into a Markdown heading.
 *
 * Existing Markdown heading markers are removed before the requested level is applied so repeated
 * use changes the heading level instead of stacking `#` characters.
 *
 * @param view - The active CodeMirror editor view.
 * @param level - The target heading level supported by the toolbar.
 */
function applyHeading(view: EditorView, level: 1 | 2 | 3 | 4): void {
  prefixSelectedLines(view, `${'#'.repeat(level)} `, (line) => line.replace(/^#{1,6}\s+/, ''))
}

/**
 * Removes a supported Markdown list or task-list prefix from a single line.
 *
 * Leading indentation is preserved so nested list items keep their relative structure when the
 * toolbar changes between unordered, ordered, and task-list styles.
 *
 * @param line - The source line to normalize before applying a new list prefix.
 * @returns The line with its existing list marker removed.
 */
function stripListPrefix(line: string): string {
  return line.replace(/^(\s*)(?:[-*+]\s+\[[ xX]\]\s+|[-*+]\s+|\d+\.\s+)/, '$1')
}

/**
 * Inserts a fenced Markdown code block around the selected text.
 *
 * When no text is selected, an empty fenced block is inserted and the cursor is placed inside the
 * block body so the user can start typing immediately.
 *
 * @param view - The active CodeMirror editor view.
 */
function insertCodeBlock(view: EditorView): void {
  const range = view.state.selection.main
  const selected = view.state.sliceDoc(range.from, range.to)
  const body = selected || ''
  const insert = `\n\`\`\`\n${body}\n\`\`\`\n`
  const cursor = range.from + 5 + body.length

  view.dispatch({
    changes: { from: range.from, to: range.to, insert },
    selection: { anchor: cursor },
    scrollIntoView: true
  })
  view.focus()
}

/**
 * Inserts a Markdown link using the current selection or the nearest text segment as link text.
 *
 * Unlike most inline formatting tools, the inserted `url` placeholder remains selected after the
 * command runs so the next typed text replaces the placeholder directly.
 *
 * @param view - The active CodeMirror editor view.
 */
function insertLink(view: EditorView): void {
  const selection = getSelectionOrNearbySegment(view)
  const selected = view.state.sliceDoc(selection.from, selection.to) || 'link text'
  const insert = `[${selected}](url)`
  const selectionFrom = selection.from + selected.length + 3

  view.dispatch({
    changes: { from: selection.from, to: selection.to, insert },
    selection: { anchor: selectionFrom, head: selectionFrom + 3 },
    scrollIntoView: true
  })
  view.focus()
}

/**
 * Inserts a Markdown horizontal rule at the current selection range.
 *
 * The command adds surrounding blank lines only when needed, keeping the rule separated from
 * adjacent paragraph content without adding extra spacing at existing line boundaries.
 *
 * @param view - The active CodeMirror editor view.
 */
function insertHorizontalRule(view: EditorView): void {
  const range = view.state.selection.main
  const before = range.from > 0 ? view.state.sliceDoc(range.from - 1, range.from) : '\n'
  const after =
    range.to < view.state.doc.length ? view.state.sliceDoc(range.to, range.to + 1) : '\n'
  const prefix = before === '\n' ? '' : '\n\n'
  const suffix = after === '\n' ? '\n' : '\n\n'
  const insert = `${prefix}---${suffix}`
  const cursor = range.from + insert.length

  view.dispatch({
    changes: { from: range.from, to: range.to, insert },
    selection: { anchor: cursor },
    scrollIntoView: true
  })
  view.focus()
}

/**
 * Resolves the text range that an inline formatting command should operate on.
 *
 * Non-empty selections are returned unchanged. Empty selections attempt to expand to the nearest
 * text segment on the current line, using whitespace and punctuation as segment delimiters. If no
 * segment is found, the original empty cursor range is returned so callers can insert placeholder
 * markup at the cursor.
 *
 * @param view - The active CodeMirror editor view.
 * @returns The selected or inferred formatting range.
 */
function getSelectionOrNearbySegment(view: EditorView): { from: number; to: number } {
  const range = view.state.selection.main
  if (!range.empty) {
    return { from: range.from, to: range.to }
  }

  return findNearbySegment(view, range.from) ?? { from: range.from, to: range.to }
}

/**
 * Finds the nearest contiguous text segment on the same line as the cursor position.
 *
 * The returned segment expands from the closest non-delimiter character until it reaches
 * whitespace, ASCII punctuation, or common CJK punctuation. Search does not cross line
 * boundaries, which keeps inline formatting commands scoped to the visible text around the cursor.
 *
 * @param view - The active CodeMirror editor view.
 * @param position - The document offset from which the nearby segment search starts.
 * @returns The document range for the nearby segment, or `null` when the line has no segment.
 */
function findNearbySegment(
  view: EditorView,
  position: number
): { from: number; to: number } | null {
  const line = view.state.doc.lineAt(position)
  const text = line.text
  const offset = position - line.from
  const index = findNearestSegmentIndex(text, offset)

  if (index === -1) return null

  let start = index
  let end = index + 1

  while (start > 0 && !isSegmentDelimiter(text[start - 1])) {
    start -= 1
  }

  while (end < text.length && !isSegmentDelimiter(text[end])) {
    end += 1
  }

  if (start === end) return null

  return {
    from: line.from + start,
    to: line.from + end
  }
}

/**
 * Locates the nearest non-delimiter character around a line-local offset.
 *
 * Characters immediately before and after the cursor are preferred first to match common editing
 * behavior at word boundaries. If the cursor is on whitespace or punctuation, the search expands
 * outward to the right and left until a text segment is found.
 *
 * @param text - The current line text.
 * @param offset - The zero-based cursor offset within the line.
 * @returns The line-local index of the nearest segment character, or `-1` when none exists.
 */
function findNearestSegmentIndex(text: string, offset: number): number {
  if (offset > 0 && !isSegmentDelimiter(text[offset - 1])) {
    return offset - 1
  }

  if (offset < text.length && !isSegmentDelimiter(text[offset])) {
    return offset
  }

  let left = offset - 1
  let right = offset

  while (left >= 0 || right < text.length) {
    if (right < text.length && !isSegmentDelimiter(text[right])) {
      return right
    }

    if (left >= 0 && !isSegmentDelimiter(text[left])) {
      return left
    }

    left -= 1
    right += 1
  }

  return -1
}

const SEGMENT_DELIMITER_PATTERN =
  /[\s!"#$%&'()*+,\-./:;<=>?@[\\\]^_`{|}~，。！？；：、（）［］【】｛｝《》〈〉「」『』“”‘’…·—～￥]/u
/**
 * Determines whether a character should split automatically inferred text segments.
 *
 * Undefined values are treated as delimiters so callers can safely check positions outside the
 * current line bounds. The delimiter set intentionally includes whitespace, ASCII punctuation, and
 * common CJK punctuation used in Chinese and Japanese prose.
 *
 * @param char - The character to test.
 * @returns `true` when the character should separate formatting segments.
 */
function isSegmentDelimiter(char: string | undefined): boolean {
  return !char || SEGMENT_DELIMITER_PATTERN.test(char)
}
