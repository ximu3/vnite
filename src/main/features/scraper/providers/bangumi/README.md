# Bangumi Provider

Bangumi is a comprehensive ACGN (Anime, Comic, Game, Novel) subject database that provides detailed metadata for games, especially visual novels and Japanese games.

## Features

- **Game Search**: Search for games by title with comprehensive results
- **Game Metadata**: Detailed game information including:
  - Game name (Chinese and original)
  - Release dates
  - Developers and publishers
  - Genres and categories
  - Staff information with role mapping
  - Related websites
  - User tags
- **Game Assets**:
  - Cover images from Bangumi
  - Background images via VNDB integration
- **Game Verification**: Check if games exist in the Bangumi database
- **Extended Metadata**: Staff roles mapped to predefined categories

## Configuration

The Bangumi provider supports optional API authentication:

```env
VITE_BANGUMI_API_KEY=your_api_token
```

To get a Bangumi API token:

1. Visit [Bangumi Developer Console](https://bgm.tv/dev/app)
2. Create an application to get API access
3. Generate a personal access token

Note: The provider will work without authentication but may have rate limits.

## Implementation Details

### API Integration

- Uses Bangumi API v0 for subject data
- Supports both authenticated and anonymous requests
- Handles Chinese and Japanese content seamlessly

### Staff Role Mapping

Maps Bangumi staff roles to standardized categories:

- **Director**: 企画, 监督, 制作人, 原作
- **Scenario**: 剧本, 脚本, 系列构成, 剧本协力
- **Illustration**: 原画, 美工, 人物设定, 角色设计
- **Music**: 音乐, BGM, 作曲, 音效, 主题歌作曲
- **Engine**: 游戏引擎, 引擎

### Multi-language Support

- Prioritizes Chinese names when available
- Falls back to original Japanese names
- Supports both Chinese and Japanese infobox fields

### Cross-Provider Integration

- Uses VNDB provider for background images
- Leverages existing game recognition for asset fetching

## Usage

The provider supports both ID-based and name-based operations:

```typescript
// Search games
const games = await bangumiProvider.searchGames('Fate/stay night')

// Get metadata by Bangumi ID
const metadata = await bangumiProvider.getGameMetadata({ type: 'id', value: '12345' })

// Get metadata by name
const metadata = await bangumiProvider.getGameMetadata({ type: 'name', value: 'Fate/stay night' })

// Get game covers
const covers = await bangumiProvider.getGameCovers({ type: 'id', value: '12345' })

// Get game backgrounds (via VNDB)
const backgrounds = await bangumiProvider.getGameBackgrounds({
  type: 'name',
  value: 'Fate/stay night'
})
```

## URL Structure

- Search: `https://api.bgm.tv/search/subject/{query}?type=4&max_results=25`
- Subject: `https://api.bgm.tv/v0/subjects/{id}`
- Web: `https://bgm.tv/subject/{id}`

## Data Processing

### Infobox Parsing

Extracts structured data from Bangumi's infobox format:

- Developer and publisher information
- Genre classification
- Website links
- Release dates

### Staff Processing

- Deduplicates staff across multiple roles
- Groups by standardized role categories
- Provides internationalized role names

## Error Handling

- Graceful handling of API rate limits
- Fallback to empty results for missing data
- Comprehensive error logging
- Optional authentication support
