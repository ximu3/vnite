import { cn } from '~/utils'
import { Card, CardContent, CardHeader, CardTitle } from '@ui/card'
import { useState } from 'react'
import { useTheme } from '~/components/ThemeProvider'
import { Button } from '@ui/button'
import { Textarea } from '@ui/textarea'
import { toast } from 'sonner'
import { isValidCSS } from '~/utils'

export function Theme(): JSX.Element {
  const { theme, updateTheme } = useTheme()
  const [cssContent, setCssContent] = useState(theme || '')

  const handleSave = async (): Promise<void> => {
    const validation = isValidCSS(cssContent)
    if (!validation.isValid) {
      toast.error(validation.error || 'CSS 格式错误')
      return
    }

    updateTheme(cssContent)
    toast.success('主题已保存')
  }
  return (
    <Card className={cn('group')}>
      <CardHeader>
        <CardTitle className={cn('relative')}>
          <div className={cn('flex flex-row justify-between items-center')}>
            <div className={cn('flex items-center')}>主题</div>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className={cn('')}>
        <div className={cn('flex flex-col gap-3')}>
          <Textarea
            value={cssContent}
            onChange={(e) => setCssContent(e.target.value)}
            className={cn('w-full h-[450px] resize-none font-mono')}
          />
          <div className={cn('flex flex-row-reverse')}>
            <Button onClick={handleSave} className="mt-4">
              保存主题
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
