import { useTheme } from 'next-themes'
import { Toaster as Sonner, ToasterProps } from 'sonner'

const Toaster = ({ ...props }: ToasterProps): React.JSX.Element => {
  const { theme = 'system' } = useTheme()

  return (
    <Sonner
      theme={theme as ToasterProps['theme']}
      // closeButton
      toastOptions={{
        classNames: {
          toast: 'backdrop-filter !backdrop-blur-md'
        }
      }}
      className="toaster group backdrop-filter backdrop-blur-[var(--glass-blur)]"
      style={
        {
          '--normal-bg': 'color-mix(in hsl, var(--popover) 95%, transparent)',
          '--normal-text': 'var(--popover-foreground)',
          '--normal-border': 'var(--border)'
        } as React.CSSProperties
      }
      {...props}
    />
  )
}

export { Toaster }
