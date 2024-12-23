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

export function Search({ className }: { className?: string }): JSX.Element {
  const { dataSource, setDataSource, name, setName, id, setId, setGameList } = useGameAdderStore()
  const navigate = useNavigate()

  const [inputName, setInputName] = React.useState(name)
  React.useEffect(() => {
    inputName !== name && setInputName(name)
  }, [name])
  const [inputId, setInputId] = React.useState(id)
  React.useEffect(() => {
    inputId !== id && setInputId(id)
  }, [id])

  const gameNameInput = React.useRef<HTMLInputElement>(null)
  const gameIdInput = React.useRef<HTMLInputElement>(null)
  React.useEffect(() => {
    setTimeout(() => gameNameInput.current?.focus())
  }, [])

  async function searchGames(): Promise<void> {
    if (!inputName) {
      toast.warning('请输入游戏名称')
      return
    }
    toast.promise(
      (async (): Promise<GameList> => {
        const result = (await ipcInvoke('search-games', dataSource, inputName)) as GameList
        if (result.length === 0) {
          throw new Error('未找到游戏')
        }
        setGameList(result)
        setName(inputName)
        navigate('/games')
        return result
      })(),
      {
        loading: '搜索游戏中...',
        success: (data) => `找到 ${data.length} 个游戏`,
        error: (err) => `搜索失败: ${err.message}`
      }
    )
  }

  async function recognizeGame(): Promise<void> {
    if (!inputId) {
      toast.warning('请输入游戏ID')
      return
    }
    toast.promise(
      (async (): Promise<void> => {
        const result = await ipcInvoke('check-game-exists', dataSource, inputId)
        if (!result) {
          throw new Error('无效ID')
        }
        setId(inputId)
        navigate('/screenshots')
      })(),
      {
        loading: '识别游戏中...',
        success: '识别游戏成功',
        error: (err) => `识别游戏失败: ${err.message}`
      }
    )
  }

  return (
    <div className={cn('w-[36vw] h-auto', '3xl:w-[30vw]', className)}>
      <div className={cn('flex flex-col w-full h-full gap-3 p-3 justify-center')}>
        <div className={cn('flex flex-row gap-3 items-center justify-start')}>
          <div>数据来源</div>
          <div className={cn('w-[130px]')}>
            <Select onValueChange={setDataSource} value={dataSource}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectLabel>数据来源</SelectLabel>
                  <SelectItem value="steam">Steam</SelectItem>
                  <SelectItem value="vndb">VNDB</SelectItem>
                  <SelectItem value="bangumi">Bangumi</SelectItem>
                  <SelectItem value="igdb">IGDB</SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className={cn('flex flex-row gap-3 items-center justify-start')}>
          <div className={cn('flex-shrink-0')}>游戏名称</div>
          <Input
            ref={gameNameInput}
            value={inputName}
            onChange={(e) => setInputName(e.target.value)}
            placeholder="请输入游戏名称"
            onKeyDown={(e) => {
              if (e.key === 'Enter') searchGames()
              if (e.key === 'ArrowUp' || e.key === 'ArrowDown') gameIdInput.current?.focus()
            }}
          />
          <Button onClick={searchGames}>搜索</Button>
        </div>

        <div className={cn('flex flex-row gap-3 items-center justify-start')}>
          <div className={cn('flex-shrink-0 mr-4')}>游戏ID</div>
          <Input
            ref={gameIdInput}
            value={inputId}
            onChange={(e) => setInputId(e.target.value)}
            placeholder="请输入游戏ID"
            onKeyDown={(e) => {
              if (e.key === 'Enter') recognizeGame()
              if (e.key === 'ArrowUp' || e.key === 'ArrowDown') gameNameInput.current?.focus()
            }}
          />
          <Button onClick={recognizeGame}>识别</Button>
        </div>
      </div>
    </div>
  )
}
