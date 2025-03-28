import { Collection } from './Collection'
import { Others } from './Others'
import { Search } from './Search'
import { useFilterStore } from '../Filter/store'
import { FilterGame } from './FilterGame'
import { isEqual } from 'lodash'

export function GameList({
  selectedGroup,
  query
}: {
  selectedGroup: string
  query: string
}): JSX.Element {
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

  return <Others fieldName={selectedGroup as any} />
}
