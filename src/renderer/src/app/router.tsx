import {
  createRouter,
  createRootRoute,
  createRoute,
  redirect,
  createHashHistory
} from '@tanstack/react-router'
import { RootLayout } from '../layouts/RootLayout'
import { Library } from '~/pages/Library'
import { Record } from '~/pages/Record'
import { Config } from '~/pages/Config'
import { GameScannerManager } from '~/pages/GameScannerManager'
import { TransformerManager } from '~/pages/TransformerManager'
import { Plugin } from '~/pages/Plugin/main'
import { Icon } from '~/pages/arts/Icon'
import { Logo } from '~/pages/arts/Logo'
import { Showcase } from '~/components/Showcase'
import { CollectionPage } from '~/components/Showcase/CollectionPage'
import { Game } from '~/components/Game'
import { CollectionGames } from '~/components/Showcase/CollectionGames'

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
  component: Record
})

const configRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/config',
  component: Config
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
