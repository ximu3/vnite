import React from 'react'
import { Collection } from './Collection'
import { Others } from './Others'
import { Search } from './Search'
import { useFilterStore } from '../Filter/store'
import { FilterGame } from './FilterGame'
import { isEqual } from 'lodash'

export const GameList = React.memo(function GameList({
  selectedGroup,
  query
}: {
  selectedGroup: string
  query: string
}): JSX.Element {
  const { filter } = useFilterStore()

  if (!isEqual(filter, {})) {
    return <FilterGame />
  } else if (query && query.trim() !== '') {
    return <Search query={query} />
  } else if (selectedGroup === 'collection') {
    return <Collection />
  } else {
    return <Others fieldName={selectedGroup} />
  }
})
