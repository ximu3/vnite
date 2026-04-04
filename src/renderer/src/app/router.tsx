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
import { getBusinessDateKey, getConfiguredDayBoundaryHour } from '~/stores/game/dayBoundaryUtils'
import { TransformerManager } from '~/pages/TransformerManager'
import { Icon } from '~/pages/arts/Icon'
import { Logo } from '~/pages/arts/Logo'
import { RootLayout } from '../layouts/RootLayout'

const hashHistory = createHashHistory()
const ABSOLUTE_ISO_DATE_REGEX =
  /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?(?:Z|[+-]\d{2}:\d{2})$/

/**
 * Validate and normalize `/record?date=` as absolute ISO datetime.
 *
 * Record search contract:
 * - `date` is the real query timestamp (no business-day boundary alignment in router).
 * - `date` input must include explicit timezone (`Z` or `±HH:mm`) and is canonicalized to UTC ISO.
 * - `year` is a business-year label (boundary-aware at yearly granularity).
 *   Router derives it from `date` only when `year` is missing.
 */
function normalizeRecordDateSearchValue(
  value: unknown,
  dayBoundaryHour: number
): { date: string; businessYear: string } | undefined {
  if (typeof value !== 'string' || !ABSOLUTE_ISO_DATE_REGEX.test(value)) {
    return undefined
  }

  const parsed = new Date(value)
  if (isNaN(parsed.getTime())) return undefined

  const businessDateKey = getBusinessDateKey(parsed, dayBoundaryHour)
  if (!/^\d{4}-\d{2}-\d{2}$/.test(businessDateKey)) {
    return undefined
  }

  return {
    date: parsed.toISOString(),
    businessYear: businessDateKey.slice(0, 4)
  }
}

function getRecordDefaultDateAndYear(dayBoundaryHour: number): { date: string; year: string } {
  const now = new Date()
  const businessDateKey = getBusinessDateKey(now, dayBoundaryHour)
  const businessYear = /^\d{4}-\d{2}-\d{2}$/.test(businessDateKey)
    ? businessDateKey.slice(0, 4)
    : String(now.getFullYear())

  return {
    date: now.toISOString(),
    year: businessYear
  }
}

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
    const dayBoundaryHour = getConfiguredDayBoundaryHour()
    const tab = typeof search.tab === 'string' ? search.tab : 'overview'
    const validatedDate = normalizeRecordDateSearchValue(search.date, dayBoundaryHour)
    const validatedYear =
      typeof search.year === 'string' && /^\d{4}$/.test(search.year) ? search.year : undefined

    if (validatedDate) {
      return {
        tab,
        date: validatedDate.date,
        year: validatedYear ?? validatedDate.businessYear
      }
    }

    const defaultDateAndYear = getRecordDefaultDateAndYear(dayBoundaryHour)
    const year = validatedYear ?? defaultDateAndYear.year

    return { tab, date: defaultDateAndYear.date, year }
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
