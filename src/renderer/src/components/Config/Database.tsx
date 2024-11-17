import { cn } from '~/utils'
import { Card, CardContent, CardHeader, CardTitle } from '@ui/card'
import { Button } from '@ui/button'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger
} from '@ui/alert-dialog'
import { ipcInvoke } from '~/utils'
import { toast } from 'sonner'

export function Database(): JSX.Element {
  const backup = async (): Promise<void> => {
    toast.promise(
      async () => {
        const targetPath: string = await ipcInvoke('select-path-dialog', ['openDirectory'])
        if (!targetPath) return
        await ipcInvoke('backup-database', targetPath)
      },
      {
        loading: '正在备份数据库...',
        success: '数据库备份成功',
        error: '数据库备份失败'
      }
    )
  }
  const restore = async (): Promise<void> => {
    toast.promise(
      async () => {
        const sourcePath: string = await ipcInvoke('select-path-dialog', ['openFile'])
        if (!sourcePath) return
        await ipcInvoke('restore-database', sourcePath)
      },
      {
        loading: '正在导入数据库...',
        success: '数据库导入成功',
        error: '数据库导入失败'
      }
    )
  }
  return (
    <Card className={cn('group')}>
      <CardHeader>
        <CardTitle className={cn('relative')}>
          <div className={cn('flex flex-row justify-between items-center')}>
            <div className={cn('flex items-center')}>数据库</div>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className={cn('')}>
        <div className={cn('flex flex-col gap-5 w-full')}>
          <div className={cn('flex flex-row gap-5 items-center')}>
            <Button
              variant={'outline'}
              onClick={async () => {
                await ipcInvoke('open-database-path-in-explorer')
              }}
            >
              打开数据库文件夹
            </Button>
          </div>
          <div className={cn('flex flex-row gap-5 items-center')}>
            <Button onClick={backup}>备份数据库</Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button>导入数据库</Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>确定要导入数据库吗？</AlertDialogTitle>
                  <AlertDialogDescription>
                    导入数据库将覆盖当前数据库，此操作不可逆！操作结束后应用将自动重启。
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>取消</AlertDialogCancel>
                  <AlertDialogAction onClick={restore}>确定</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
