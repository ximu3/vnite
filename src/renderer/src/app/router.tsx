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

// 创建根路由
const rootRoute = createRootRoute({
  component: RootLayout
})

// 创建主页路由（重定向到library）
const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  beforeLoad: () => {
    throw redirect({ to: '/library/home' })
  }
})

// 创建库路由
const libraryRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/library',
  component: Library
})

const libraryIndexRoute = createRoute({
  getParentRoute: () => libraryRoute,
  path: '/', // 这将匹配/library
  beforeLoad: () => {
    throw redirect({ to: '/library/home' })
  }
})

// 创建库首页路由
const libraryHomeRoute = createRoute({
  getParentRoute: () => libraryRoute,
  path: '/home',
  component: Showcase
})

// 创建收藏页路由
const libraryCollectionsRoute = createRoute({
  getParentRoute: () => libraryRoute,
  path: '/collections',
  component: CollectionPage
})

// 创建游戏详情路由
const libraryGameRoute = createRoute({
  getParentRoute: () => libraryRoute,
  path: '/games/$gameId/$groupId',
  component: function GameComponent() {
    const { gameId, groupId: _groupId } = libraryGameRoute.useParams()
    return <Game gameId={gameId} />
  }
})

// 创建收藏游戏路由
const libraryCollectionGamesRoute = createRoute({
  getParentRoute: () => libraryRoute,
  path: '/collections/$collectionId',
  component: function CollectionGamesComponent() {
    const { collectionId } = libraryCollectionGamesRoute.useParams()
    return <CollectionGames collectionId={collectionId} />
  }
})

// 创建记录路由
const recordRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/record',
  component: Record
})

// 创建配置路由
const configRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/config',
  component: Config
})

// 创建扫描器路由
const scannerRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/scanner',
  component: GameScannerManager
})

// 创建转换器路由
const transformerRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/transformer',
  component: TransformerManager
})

// 创建插件路由
const pluginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/plugin',
  component: Plugin
})

// 创建图标路由
const iconRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/icon',
  component: Icon
})

// 创建Logo路由
const logoRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/logo',
  component: Logo
})

// 创建路由树
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

// 创建路由器
export const router = createRouter({
  routeTree,
  defaultPreload: 'intent',
  scrollRestoration: true,
  getScrollRestorationKey(location) {
    // 使用location.pathname作为滚动恢复的键
    return location.pathname
  },
  history: hashHistory
})

// 为TypeScript提供类型声明
declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}
