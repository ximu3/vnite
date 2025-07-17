# YMGal Provider

A built-in scraper provider that fetches game data from [YMGal (月幕Galgame)](https://www.ymgal.games/), a Chinese galgame database and community.

## Features

- **Game Search**: Search games by name with Chinese and original titles
- **Game Metadata**: Comprehensive game information including descriptions, tags, and staff details
- **Game Existence Check**: Verify if a game exists in the YMGal database
- **Game Assets**: Backgrounds and covers (via VNDB integration)
- **Staff Information**: Detailed staff roles with Chinese role mapping
- **Developer Information**: Organization details and Chinese names

## Supported Identifiers

- **ID**: YMGal game ID (e.g., "123456")
- **Name**: Game name for search-based lookup (supports both Chinese and original titles)

## API Integration

The provider uses the YMGal OAuth API with:

- **Base URL**: `https://www.ymgal.games`
- **API Version**: 1
- **Authentication**: OAuth 2.0 client credentials flow
- **Client ID**: `ymgal`
- **Scope**: `public`

### OAuth Token Management

The provider automatically handles OAuth token acquisition and renewal using the client credentials flow.

## Role Mapping

YMGal staff roles are mapped to predefined metadata keys:

| YMGal Role (Chinese) | Mapped Role  |
| -------------------- | ------------ |
| 脚本                 | scenario     |
| 原画                 | illustration |
| 人物设计             | illustration |
| 导演/监督            | director     |
| 音乐                 | music        |
| 歌曲                 | music        |

## Asset Integration

For game backgrounds and covers, the provider integrates with VNDB by:

1. Using the game's original name from YMGal
2. Searching VNDB for matching content
3. Returning VNDB assets as fallback

## Capabilities

This provider implements the following `ScraperProvider` methods:

- `searchGames(gameName)` - Search games by name
- `checkGameExists(identifier)` - Check if game exists
- `getGameMetadata(identifier)` - Get comprehensive game metadata
- `getGameBackgrounds(identifier)` - Get background images (via VNDB)
- `getGameCovers(identifier)` - Get cover images (via VNDB)

## Data Structure

### Game List Items

- Game ID and names (Chinese + original)
- Release dates
- Developer organization names

### Game Metadata

- Localized names (Chinese preferred)
- Release information
- Detailed descriptions
- Developer details with Chinese names
- Website links and related sites
- Tags and categories
- Staff information with role mapping

## Error Handling

The provider includes comprehensive error handling for:

- OAuth token acquisition failures
- API request failures
- Developer information lookup failures
- VNDB integration fallbacks
- Missing or incomplete data scenarios

## Chinese Language Support

The provider has native Chinese language support:

- Prioritizes Chinese names when available
- Handles Chinese staff role translations
- Supports Chinese search queries
- Provides localized developer information
