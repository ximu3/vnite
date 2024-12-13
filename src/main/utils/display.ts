import { screen } from 'electron'

interface WindowDimensions {
  width: number
  height: number
  minWidth: number
  minHeight: number
}

export function calculateWindowSize(initialRatio: number, minRatio: number): WindowDimensions {
  const primaryDisplay = screen.getPrimaryDisplay()
  const { width: screenWidth, height: screenHeight } = primaryDisplay.workAreaSize

  const calculatedWidth = Math.round(screenWidth * initialRatio)
  const calculatedHeight = Math.round(screenHeight * initialRatio)
  const minWidth = Math.round(screenWidth * minRatio)
  const minHeight = Math.round(screenHeight * minRatio)

  return {
    width: clamp(calculatedWidth, 300, screenWidth),
    height: clamp(calculatedHeight, 150, screenHeight),
    minWidth: clamp(minWidth, 300, screenWidth),
    minHeight: clamp(minHeight, 150, screenHeight)
  }
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value))
}
