import { useTheme } from 'next-themes'
import { Toaster as Sonner, ToasterProps } from 'sonner'

const Toaster = ({ ...props }: ToasterProps): React.JSX.Element => {
  const { theme = 'system' } = useTheme()

  return (
    <Sonner
      theme={theme as ToasterProps['theme']}
      className="toaster group"
      style={
        {
          '--normal-bg': 'color-mix(in hsl, var(--popover) 95%, transparent)',
          '--normal-text': 'var(--popover-foreground)',
          '--normal-border': 'color-mix(in hsl, var(--border) 0%, transparent)'
        } as React.CSSProperties
      }
      {...props}
    />
  )
}

export { Toaster }
