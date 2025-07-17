import { isEqual } from 'lodash'
import { useFilterStore } from '../Filter/store'
import { Collection } from './Collection'
import { PlayStatusGames } from './PlayStatusGames'
import { FilterGame } from './FilterGame'
import { Others } from './Others'
import { Search } from './Search'

export function GameList({
  selectedGroup,
  query
}: {
  selectedGroup: string
  query: string
}): React.JSX.Element {
  const { filter } = useFilterStore()

  if (!isEqual(filter, {})) {
    return <FilterGame />
  }
  if (query && query.trim() !== '') {
    return <Search query={query} />
  }
  if (selectedGroup === 'collection') {
    return <Collection />
  }
  if (selectedGroup === 'record.playStatus') {
    return <PlayStatusGames />
  }

  return <Others fieldName={selectedGroup as any} />
}
