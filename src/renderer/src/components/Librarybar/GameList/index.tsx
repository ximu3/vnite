import React from 'react'
import { Collection } from './Collection'
import { Others } from './Others'
import { Search } from './Search'

export const GameList = React.memo(function GameList({
  selectedGroup,
  query
}: {
  selectedGroup: string
  query: string
}): JSX.Element {
  if (query && query.trim() !== '') {
    return <Search query={query} />
  } else if (selectedGroup === 'collection') {
    return <Collection />
  } else {
    return <Others fieldName={selectedGroup} />
  }
})
