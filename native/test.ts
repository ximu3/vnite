import * as native from './dist'

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

async function testHook(): Promise<void> {
  await native.installForegroundHook((err: Error | null, arg: number) => {
    if (err) {
      console.error('err: ', err)
      return
    }
    console.log(`from node. pid: ${arg}`)
  })
  setTimeout(async () => {
    console.log('stop')
    await native.uninstallForegroundHook()
  }, 10000)
}

async function main(): Promise<void> {
  testHook()
}

main()
