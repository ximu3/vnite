# IGDB Provider

IGDB (Internet Game Database) is a comprehensive game metadata provider that offers detailed information about games across all platforms.

## Features

- **Game Search**: Search for games by name with comprehensive results
- **Game Metadata**: Detailed game information including:
  - Game name and summary
  - Release dates
  - Developers and publishers
  - Genres and themes
  - Related websites
- **Game Assets**:
  - Cover images
  - Screenshots/backgrounds
- **Game Verification**: Check if games exist in the IGDB database

## Configuration

The IGDB provider requires API credentials:

```env
VITE_IGDB_API_ID=your_client_id
VITE_IGDB_API_KEY=your_client_secret
```

To get IGDB API credentials:

1. Visit [IGDB API Documentation](https://api-docs.igdb.com)
2. Register for a Twitch Developer account
3. Create an application to get Client ID and Client Secret

## Implementation Details

### Authentication

- Uses OAuth 2.0 Client Credentials flow
- Automatic token management with refresh
- Tokens are refreshed 5 minutes before expiration

### API Endpoints

- `games` - Game search and metadata
- `screenshots` - Game screenshots
- `covers` - Game cover images

### Data Processing

- Converts UNIX timestamps to formatted dates
- Maps website categories to readable labels
- Filters companies by role (developer/publisher)
- Handles both ID-based and name-based lookups

## Usage

The provider supports both ID-based and name-based operations:

```typescript
// Search games
const games = await igdbProvider.searchGames('Cyberpunk 2077')

// Get metadata by ID
const metadata = await igdbProvider.getGameMetadata({ type: 'id', value: '1877' })

// Get metadata by name
const metadata = await igdbProvider.getGameMetadata({ type: 'name', value: 'Cyberpunk 2077' })

// Get game covers
const covers = await igdbProvider.getGameCovers({ type: 'id', value: '1877' })

// Get game backgrounds
const backgrounds = await igdbProvider.getGameBackgrounds({ type: 'name', value: 'Cyberpunk 2077' })
```

## Error Handling

- Graceful handling of network errors
- Fallback to empty results for asset requests
- Comprehensive error logging
- Token refresh on authentication errors
