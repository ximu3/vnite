import {
  createHashHistory,
  createRootRoute,
  createRoute,
  createRouter,
  redirect,
  SearchSchemaInput
} from '@tanstack/react-router'
import { Game } from '~/components/Game'
import { Showcase } from '~/components/Showcase'
import { CollectionGames } from '~/components/Showcase/CollectionGames'
import { CollectionPage } from '~/components/Showcase/CollectionPage'
import { Config } from '~/pages/Config'
import { GameScannerManager } from '~/pages/GameScannerManager'
import { Library } from '~/pages/Library'
import { Plugin } from '~/pages/Plugin/main'
import { Record } from '~/pages/Record'
import { TransformerManager } from '~/pages/TransformerManager'
import { Icon } from '~/pages/arts/Icon'
import { Logo } from '~/pages/arts/Logo'
import { RootLayout } from '../layouts/RootLayout'

const hashHistory = createHashHistory()

const rootRoute = createRootRoute({
  component: RootLayout
})

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  beforeLoad: () => {
    throw redirect({ to: '/library/home' })
  }
})

const libraryRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/library',
  component: Library
})

const libraryIndexRoute = createRoute({
  getParentRoute: () => libraryRoute,
  path: '/',
  beforeLoad: () => {
    throw redirect({ to: '/library/home' })
  }
})

const libraryHomeRoute = createRoute({
  getParentRoute: () => libraryRoute,
  path: '/home',
  component: Showcase
})

const libraryCollectionsRoute = createRoute({
  getParentRoute: () => libraryRoute,
  path: '/collections',
  component: CollectionPage
})

const libraryGameRoute = createRoute({
  getParentRoute: () => libraryRoute,
  path: '/games/$gameId/$groupId',
  component: function GameComponent() {
    const { gameId, groupId: _groupId } = libraryGameRoute.useParams()
    return <Game gameId={gameId} />
  }
})

const libraryCollectionGamesRoute = createRoute({
  getParentRoute: () => libraryRoute,
  path: '/collections/$collectionId',
  component: function CollectionGamesComponent() {
    const { collectionId } = libraryCollectionGamesRoute.useParams()
    return <CollectionGames collectionId={collectionId} />
  }
})

const recordRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/record',
  component: Record,
  validateSearch: (search: { tab?: string; date?: string; year?: string } & SearchSchemaInput) => {
    const tab = typeof search.tab === 'string' ? search.tab : 'overview'
    const date =
      typeof search.date === 'string' && !isNaN(Date.parse(search.date))
        ? search.date
        : new Date().toISOString()
    const year =
      typeof search.year === 'string' && /^\d{4}$/.test(search.year)
        ? search.year
        : String(new Date().getFullYear())

    return { tab, date, year }
  }
})

const configRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/config',
  component: Config,
  validateSearch: (search: Record<string, unknown> & SearchSchemaInput) => {
    return {
      tab: typeof search.tab === 'string' ? search.tab : 'general'
    }
  }
})

const scannerRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/scanner',
  component: GameScannerManager
})

const transformerRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/transformer',
  component: TransformerManager
})

const pluginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/plugin',
  component: Plugin
})

const iconRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/icon',
  component: Icon
})

const logoRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/logo',
  component: Logo
})

const routeTree = rootRoute.addChildren([
  indexRoute,
  libraryRoute.addChildren([
    libraryIndexRoute,
    libraryHomeRoute,
    libraryCollectionsRoute,
    libraryGameRoute,
    libraryCollectionGamesRoute
  ]),
  recordRoute,
  configRoute,
  scannerRoute,
  transformerRoute,
  pluginRoute,
  iconRoute,
  logoRoute
])

export const router = createRouter({
  routeTree,
  defaultPreload: 'intent',
  scrollRestoration: true,
  getScrollRestorationKey(location) {
    // Use location.pathname as the scroll restoration key
    return location.pathname
  },
  history: hashHistory
})

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}
