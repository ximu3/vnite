import { vndbProvider } from './vndb'
import { steamGridDBProvider } from './steamgriddb'
import { ymgalProvider } from './ymgal'
import { steamProvider } from './steam'
import { igdbProvider } from './igdb'
import { dlsiteProvider } from './dlsite'
import { bangumiProvider } from './bangumi'
import { googleProvider } from './google'

export {
  vndbProvider,
  steamGridDBProvider,
  ymgalProvider,
  steamProvider,
  igdbProvider,
  dlsiteProvider,
  bangumiProvider,
  googleProvider
}

export const builtinProviders = [
  vndbProvider,
  steamGridDBProvider,
  ymgalProvider,
  steamProvider,
  igdbProvider,
  dlsiteProvider,
  bangumiProvider,
  googleProvider
]
