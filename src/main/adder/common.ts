import { setDBValue } from '~/database'
import { getGameMetadata, getGameCover } from '~/scraper'
import { generateUUID, getDataPath } from '~/utils'
import fse from 'fs-extra'

export async function addGameToDB(
  dataSource: string,
  id: string,
  screenshotUrl: string
): Promise<void> {
  const metadata = await getGameMetadata(dataSource, id)
  const coverUrl = await getGameCover(dataSource, id)
  const dbId = generateUUID()

  if (coverUrl) {
    const coverPath = await getDataPath(`games/${dbId}/cover.webp`)
    const coverResponse = await fetch(coverUrl)
    const coverBuffer = Buffer.from(await coverResponse.arrayBuffer())
    await fse.writeFile(coverPath, coverBuffer)
  }

  if (screenshotUrl) {
    const backgroundPath = await getDataPath(`games/${dbId}/background.webp`)
    const screenshotResponse = await fetch(screenshotUrl)
    const screenshotBuffer = Buffer.from(await screenshotResponse.arrayBuffer())
    await fse.writeFile(backgroundPath, screenshotBuffer)
  }

  await setDBValue(`games/${dbId}/metadata.json`, ['#all'], {
    id: dbId,
    ...metadata
  })

  await setDBValue(`games/${dbId}/record.json`, ['addDate'], new Date().toISOString())
}
