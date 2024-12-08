import { useRef } from 'react'
import html2canvas from 'html2canvas'
import { cn } from '~/utils'

export function Icon(): JSX.Element {
  const logoRef = useRef<HTMLDivElement>(null)

  const handleExportAsImage = async (): Promise<void> => {
    if (logoRef.current) {
      const canvas = await html2canvas(logoRef.current, {
        backgroundColor: null,
        allowTaint: true,
        useCORS: true,
        removeContainer: true,
        scale: 2
      })

      const dataUrl = canvas.toDataURL('image/png')
      const link = document.createElement('a')
      link.href = dataUrl
      link.download = 'logo.png'
      link.click()
    }
  }
  return (
    <div
      className={cn('h-screen w-screen flex flex-col items-center justify-center bg-transparent')}
    >
      <div
        ref={logoRef}
        className={cn(
          'flex items-center justify-center bg-gradient-to-tr from-primary to-accent rounded-[64px] w-[512px] h-[512px]'
        )}
      >
        <div className={cn('text-[470px] font-mono')}>V</div>
      </div>
      <button
        onClick={handleExportAsImage}
        className="mt-4 px-4 py-2 bg-blue-500 text-white rounded"
      >
        Export as Image
      </button>
    </div>
  )
}
