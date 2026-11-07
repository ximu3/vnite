# Proposed plugin game detail tabs

This prototype lets enabled plugins register a serializable game detail tab through `api.gameDetail.registerTab`. It does not execute plugin-supplied renderer code. The host renders text, controls and HTTPS/HTTP links using its current theme. Plugin callbacks execute in the main process and receive the current game ID and control values.

```ts
api.gameDetail.registerTab({
  id: 'example',
  title: 'Example',
  async load({ gameId, values, cursor }) {
    return {
      message: `Game: ${gameId}`,
      controls: [
        {
          id: 'source',
          label: 'Source',
          value: values.source ?? 'a',
          options: [{ value: 'a', label: 'A' }]
        }
      ],
      items: [
        {
          id: 'one',
          title: 'Example',
          body: 'Content',
          actions: [{ value: 'translate', label: 'Translate' }]
        }
      ],
      nextCursor: undefined
    }
  },
  async action({ gameId }, itemId, actionId) {
    return `${gameId}: ${itemId}: ${actionId}`
  }
})
```

Tab IDs are scoped to plugin IDs. Registration returns a disposer; the host also removes registrations if activation fails or the plugin is disabled. The host calls `load` when the game or a control changes and forwards the returned `nextCursor` when loading more. Item actions return a plain-text replacement; the user can toggle back to the original. Requests and responses must be serializable.

This is a proposed API, not part of an upstream release. It needs maintainer review for API shape, localization, error handling, performance, and compatibility before publication.
