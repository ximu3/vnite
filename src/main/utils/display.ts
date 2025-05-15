import { screen } from 'electron'

interface WindowDimensions {
  width: number
  height: number
  minWidth: number
  minHeight: number
}

export function calculateWindowSize(
  initialRatio: number,
  minRatio: number,
  aspectRatio: number = 16 / 9 // Default aspect ratio is 16:9
): WindowDimensions {
  const primaryDisplay = screen.getPrimaryDisplay()
  const { width: screenWidth, height: screenHeight } = primaryDisplay.workAreaSize

  // Calculate the initial window height based on screen height
  const calculatedHeight = Math.round(screenHeight * initialRatio)
  // Calculate width based on height and aspect ratio
  const calculatedWidth = Math.round(calculatedHeight * aspectRatio)

  // Calculate minimum window height based on screen height
  const minHeight = Math.round(screenHeight * minRatio)
  // Calculate minimum width based on minimum height and aspect ratio
  const minWidth = Math.round(minHeight * aspectRatio)

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
