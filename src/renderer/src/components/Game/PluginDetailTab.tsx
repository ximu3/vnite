import { useEffect, useRef, useState } from 'react'
import type { PluginDetailTabInfo, PluginDetailView } from '@appTypes/plugin/gameDetail'
import { ipcManager } from '~/app/ipc'
import { useTranslation } from 'react-i18next'

export function PluginDetailTab({
  gameId,
  tab
}: {
  gameId: string
  tab: PluginDetailTabInfo
}): React.JSX.Element {
  const { t } = useTranslation('plugin')
  const [values, setValues] = useState<Record<string, string>>({})
  const [view, setView] = useState<PluginDetailView>({})
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [expanded, setExpanded] = useState<Record<string, boolean>>({})
  const [actionText, setActionText] = useState<Record<string, { actionId: string; text: string }>>(
    {}
  )
  const [actionBusy, setActionBusy] = useState<Record<string, boolean>>({})
  const sequence = useRef(0)

  useEffect(() => {
    const current = ++sequence.current
    setBusy(true)
    setError('')
    setView({})
    setExpanded({})
    setActionText({})
    setActionBusy({})
    ipcManager
      .invoke('plugin:load-detail-tab', tab.pluginId, tab.id, { gameId, values })
      .then((result) => {
        if (sequence.current === current) setView(result)
      })
      .catch((e) => {
        if (sequence.current === current) setError(String(e))
      })
      .finally(() => {
        if (sequence.current === current) setBusy(false)
      })
    return () => {
      if (sequence.current === current) sequence.current++
    }
  }, [gameId, tab.pluginId, tab.id, values])

  const more = async (): Promise<void> => {
    if (!view.nextCursor) return
    const current = sequence.current
    setBusy(true)
    setError('')
    try {
      const result = await ipcManager.invoke('plugin:load-detail-tab', tab.pluginId, tab.id, {
        gameId,
        values,
        cursor: view.nextCursor
      })
      if (sequence.current === current)
        setView((old) => ({ ...result, items: [...(old.items || []), ...(result.items || [])] }))
    } catch (e) {
      if (sequence.current === current) setError(String(e))
    } finally {
      if (sequence.current === current) setBusy(false)
    }
  }

  const action = async (itemId: string, actionId: string): Promise<void> => {
    const current = sequence.current
    if (actionText[itemId]?.actionId === actionId) {
      setActionText((old) => {
        const copy = { ...old }
        delete copy[itemId]
        return copy
      })
      return
    }
    setActionBusy((old) => ({ ...old, [itemId]: true }))
    try {
      const result = await ipcManager.invoke(
        'plugin:detail-tab-action',
        tab.pluginId,
        tab.id,
        { gameId, values },
        itemId,
        actionId
      )
      if (sequence.current === current)
        setActionText((old) => ({ ...old, [itemId]: { actionId, text: result } }))
    } catch (e) {
      if (sequence.current === current) setError(String(e))
    } finally {
      if (sequence.current === current) setActionBusy((old) => ({ ...old, [itemId]: false }))
    }
  }

  const safeLink = view.link && /^https?:\/\//i.test(view.link.url) ? view.link : undefined
  return (
    <section className="pt-2 text-foreground">
      {(view.controls || []).map((control) => (
        <div key={control.id} className="mb-3 flex flex-wrap items-center gap-2 text-sm">
          <span>{control.label}</span>
          {control.options.map((option) => (
            <button
              key={option.value}
              className={`rounded px-3 py-1 ${control.value === option.value ? 'bg-primary text-primary-foreground' : 'bg-muted/50 hover:bg-accent'}`}
              onClick={() => setValues((old) => ({ ...old, [control.id]: option.value }))}
            >
              {option.label}
            </button>
          ))}
        </div>
      ))}
      {safeLink && (
        <a
          href={safeLink.url}
          target="_blank"
          rel="noreferrer"
          className="text-xs text-primary hover:underline"
        >
          {safeLink.label}
        </a>
      )}
      {view.message && <p className="mt-2 text-sm text-muted-foreground">{view.message}</p>}
      {busy && <p className="mt-2 text-sm text-muted-foreground">{t('detailTab.loading')}</p>}
      {error && <p className="mt-2 text-sm text-destructive">{error}</p>}
      <div className="mt-3 divide-y divide-border">
        {(view.items || []).map((item) => {
          const body = actionText[item.id]?.text ?? item.body
          const long = body.length > 300 || body.split('\n').length > 6
          return (
            <article key={item.id} className="py-4">
              <div className="flex gap-2 text-sm">
                <strong>{item.title}</strong>
                {item.badge && <span className="text-primary">{item.badge}</span>}
                <span className="ml-auto text-muted-foreground">{item.subtitle}</span>
              </div>
              <p
                className={`mt-2 whitespace-pre-wrap break-words text-sm ${long && !expanded[item.id] ? 'line-clamp-6' : ''}`}
              >
                {body}
              </p>
              {long && (
                <button
                  className="mr-4 mt-2 text-xs text-primary"
                  onClick={() => setExpanded((old) => ({ ...old, [item.id]: !old[item.id] }))}
                >
                  {expanded[item.id] ? t('detailTab.collapse') : t('detailTab.expand')}
                </button>
              )}
              {(item.actions || []).map((a) => (
                <button
                  key={a.value}
                  disabled={actionBusy[item.id]}
                  className="mr-4 mt-2 text-xs text-primary disabled:opacity-50"
                  onClick={() => void action(item.id, a.value)}
                >
                  {actionBusy[item.id]
                    ? t('detailTab.loading')
                    : actionText[item.id]?.actionId === a.value
                      ? t('detailTab.original')
                      : a.label}
                </button>
              ))}
            </article>
          )
        })}
      </div>
      {view.nextCursor && (
        <button
          disabled={busy}
          className="mt-3 rounded bg-muted px-4 py-2 text-sm"
          onClick={() => void more()}
        >
          {t('detailTab.loadMore')}
        </button>
      )}
    </section>
  )
}
