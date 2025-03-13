import { cn } from '~/utils'
import { Button } from '@ui/button'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue
} from '@ui/select'
import { Input } from '@ui/input'
import { toast } from 'sonner'
import { GameList, useGameAdderStore } from './store'
import { ipcInvoke } from '~/utils'
import { useNavigate } from 'react-router-dom'
import React from 'react'
import { useTranslation } from 'react-i18next'

export function Search({ className }: { className?: string }): JSX.Element {
  const { t } = useTranslation('adder')
  const { dataSource, setDataSource, name, setName, dataSourceId, setDataSourceId, setGameList } =
    useGameAdderStore()
  const navigate = useNavigate()

  const [inputName, setInputName] = React.useState(name)
  React.useEffect(() => {
    if (inputName !== name) {
      setInputName(name)
    }
  }, [name])
  const [inputId, setInputId] = React.useState(dataSourceId)
  React.useEffect(() => {
    if (inputId !== dataSourceId) {
      setInputId(dataSourceId)
    }
  }, [dataSourceId])

  const gameNameInput = React.useRef<HTMLInputElement>(null)
  const gameIdInput = React.useRef<HTMLInputElement>(null)
  React.useEffect(() => {
    setTimeout(() => gameNameInput.current?.focus())
  }, [])

  async function searchGames(): Promise<void> {
    if (!inputName) {
      toast.warning(t('gameAdder.search.notifications.enterName'))
      return
    }
    toast.promise(
      (async (): Promise<GameList> => {
        const result = (await ipcInvoke('search-games', dataSource, inputName)) as GameList
        if (result.length === 0) {
          throw new Error(t('gameAdder.search.notifications.notFound'))
        }
        setGameList(result)
        setName(inputName)
        navigate('/games')
        return result
      })(),
      {
        loading: t('gameAdder.search.notifications.searching'),
        success: (data) => t('gameAdder.search.notifications.found', { count: data.length }),
        error: (err) => t('gameAdder.search.notifications.searchError', { message: err.message })
      }
    )
  }

  async function recognizeGame(): Promise<void> {
    if (!inputId) {
      toast.warning(t('gameAdder.search.notifications.enterId'))
      return
    }
    toast.promise(
      (async (): Promise<void> => {
        const result = await ipcInvoke('check-game-exists', dataSource, inputId)
        if (!result) {
          throw new Error(t('gameAdder.search.notifications.invalidId'))
        }
        setDataSourceId(inputId)
        navigate('/screenshots')
      })(),
      {
        loading: t('gameAdder.search.notifications.recognizing'),
        success: t('gameAdder.search.notifications.recognized'),
        error: (err) => t('gameAdder.search.notifications.recognizeError', { message: err.message })
      }
    )
  }

  return (
    <div className={cn('w-[36vw] h-auto', '3xl:w-[30vw]', className)}>
      <div className={cn('grid grid-cols-[auto_1fr] gap-x-5 gap-y-2 text-sm items-center')}>
        {/* 数据源选择 */}
        <div className={cn('whitespace-nowrap select-none')}>
          {t('gameAdder.search.dataSource')}
        </div>
        <div>
          <Select onValueChange={setDataSource} value={dataSource}>
            <SelectTrigger className={cn('w-[130px]')}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectLabel>{t('gameAdder.search.dataSources.label')}</SelectLabel>
                <SelectItem value="steam">{t('gameAdder.search.dataSources.steam')}</SelectItem>
                <SelectItem value="vndb">{t('gameAdder.search.dataSources.vndb')}</SelectItem>
                <SelectItem value="bangumi">{t('gameAdder.search.dataSources.bangumi')}</SelectItem>
                <SelectItem value="igdb">{t('gameAdder.search.dataSources.igdb')}</SelectItem>
                <SelectItem value="ymgal">{t('gameAdder.search.dataSources.ymgal')}</SelectItem>
                <SelectItem value="dlsite">{t('gameAdder.search.dataSources.dlsite')}</SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>

        {/* 游戏名称输入 */}
        <div className={cn('whitespace-nowrap select-none')}>{t('gameAdder.search.gameName')}</div>
        <div className={cn('flex flex-row gap-3')}>
          <Input
            className={cn('flex-1')}
            ref={gameNameInput}
            value={inputName}
            onChange={(e) => setInputName(e.target.value)}
            placeholder={t('gameAdder.search.gameNamePlaceholder')}
            onKeyDown={(e) => {
              if (e.key === 'Enter') searchGames()
              if (e.key === 'ArrowUp' || e.key === 'ArrowDown') gameIdInput.current?.focus()
            }}
          />
          <Button onClick={searchGames}>{t('gameAdder.search.searchButton')}</Button>
        </div>

        {/* 游戏ID输入 */}
        <div className={cn('whitespace-nowrap select-none')}>{t('gameAdder.search.gameId')}</div>
        <div className={cn('flex flex-row gap-3')}>
          <Input
            className={cn('flex-1')}
            ref={gameIdInput}
            value={inputId}
            onChange={(e) => setInputId(e.target.value)}
            placeholder={t('gameAdder.search.gameIdPlaceholder')}
            onKeyDown={(e) => {
              if (e.key === 'Enter') recognizeGame()
              if (e.key === 'ArrowUp' || e.key === 'ArrowDown') gameNameInput.current?.focus()
            }}
          />
          <Button onClick={recognizeGame}>{t('gameAdder.search.recognizeButton')}</Button>
        </div>
      </div>
    </div>
  )
}
