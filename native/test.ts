import * as native from './dist'

async function testMonitor(): Promise<void> {
  await native.startMonitoring(
    [
      'c:\\program files\\windowsapps\\microsoft.windowscalculator_11.2502.2.0_x64__8wekyb3d8bbwe\\calculatorapp.exe',
      'C:\\Program Files\\WindowsApps\\Microsoft.WindowsNotepad_11.2507.26.0_x64__8wekyb3d8bbwe\\Notepad\\Notepad.exe'
    ],
    ['id1', 'id2'],
    (err: Error | null, arg: native.ProcessEvent) => {
      if (err) {
        console.error('err: ', err)
        return
      }
      console.log(
        `from node. id: ${arg.id}, path: ${arg.fullPath}, pid: ${arg.pid}, type: ${arg.eventType}`
      )
    }
  )
  setTimeout(() => {
    native.stopMonitoring()
  }, 20000)
}

function testGetProcess(): void {
  native.getAllProcess().forEach((proc) => {
    console.log(`full path: ${proc.fullPath}, pid: ${proc.pid}`)
  })
}

async function testLogger(): Promise<void> {
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
  setTimeout(() => {
    native.stopLogger()
  }, 3000)
}

async function main(): Promise<void> {
  testMonitor()
}

main()
