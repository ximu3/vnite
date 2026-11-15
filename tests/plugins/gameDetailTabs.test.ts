import { strict as assert } from 'node:assert'
import { test } from 'node:test'
import { GameDetailTabs } from '../../src/main/plugins/api/gameDetailTabs'

test('registers, dispatches and removes tabs owned by a plugin', async () => {
  let changes = 0
  const registry = new GameDetailTabs(() => changes++)
  const dispose = registry.register('reviews', {
    id: 'main',
    title: 'Reviews',
    load: async ({ gameId }) => ({ message: gameId }),
    action: async (_, itemId) => `translated ${itemId}`
  })
  assert.deepEqual(registry.list(), [{ pluginId: 'reviews', id: 'main', title: 'Reviews' }])
  assert.equal(
    (await registry.load('reviews', 'main', { gameId: 'game-1', values: {} })).message,
    'game-1'
  )
  assert.equal(
    await registry.action(
      'reviews',
      'main',
      { gameId: 'game-1', values: {} },
      'review-1',
      'translate'
    ),
    'translated review-1'
  )
  assert.throws(() =>
    registry.register('reviews', { id: 'main', title: 'Duplicate', load: async () => ({}) })
  )
  registry.removePlugin('reviews')
  assert.deepEqual(registry.list(), [])
  await assert.rejects(registry.load('reviews', 'main', { gameId: 'game-1', values: {} }))
  dispose()
  assert.equal(changes, 2)
})

test('cleanup only removes its own registration', () => {
  const registry = new GameDetailTabs(() => {})
  const oldDispose = registry.register('plugin', {
    id: 'tab',
    title: 'Old',
    load: async () => ({})
  })
  registry.removePlugin('plugin')
  registry.register('plugin', { id: 'tab', title: 'New', load: async () => ({}) })
  oldDispose()
  assert.equal(registry.list()[0].title, 'New')
  assert.throws(() =>
    registry.register('plugin', { id: '../invalid', title: 'Invalid', load: async () => ({}) })
  )
})
