import * as mod from './dist'

async function main(): Promise<void> {
  await mod.initLogger(
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

  await mod.startMonitoring(
    [
      'c:\\program files\\windowsapps\\microsoft.windowscalculator_11.2502.2.0_x64__8wekyb3d8bbwe\\calculatorapp.exe'
    ],
    (err: Error | null, arg: mod.ProcessEvent) => {
      if (err) {
        console.error('err: ', err)
        return
      }
      console.log(`from node. path: ${arg.fullPath}, pid: ${arg.pid}, type: ${arg.eventType}`)
    }
  )
  setTimeout(() => {
    mod.stopMonitoring()
  }, 10000)
}

main()
