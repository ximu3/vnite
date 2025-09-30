import * as native from './dist'

async function testMonitor(): Promise<void> {
  await native.initLogger(
    (err, msg) => {
      if (err) {
        console.error('err: ', err)
      }
      console.log(msg)
    },
    (err, msg) => {
      if (err) {
        console.error('err: ', err)
      }
      console.error(msg)
    }
  )

  await native.startMonitoring(
    [
      'c:\\program files\\windowsapps\\microsoft.windowscalculator_11.2502.2.0_x64__8wekyb3d8bbwe\\calculatorapp.exe'
    ],
    ['fawegewag'],
    (err: Error | null, arg: native.ProcessEvent) => {
      if (err) {
        console.error('err: ', err)
        return
      }
      console.log(
        `from node. path: ${arg.fullPath}, pid: ${arg.pid}, type: ${arg.eventType}, id: ${arg.id}`
      )
    }
  )
  setTimeout(() => {
    native.stopMonitoring()
  }, 10000)
}

function testGetProcess(): void {
  native.getAllProcess().forEach((proc) => {
    console.log(`full path: ${proc.fullPath}, pid: ${proc.pid}`)
  })
}

async function main(): Promise<void> {
  testGetProcess()
}

main()
