# DLsite Provider

DLsite is a Japanese digital content marketplace specializing in adult content, doujin games, and visual novels.

## Features

- **Game Search**: Search for works by title with comprehensive results
- **Game Metadata**: Detailed work information including:
  - Work name and description
  - Release dates
  - Developers (circles/makers)
  - Genres and work types
  - Related websites and series links
- **Game Assets**:
  - Cover images
  - Sample screenshots/backgrounds
- **Game Verification**: Check if works exist in the DLsite database

## Implementation Details

### Content Access

- Automatically sets adult content access flag
- Uses appropriate locale settings for international access
- Handles Japanese, Chinese, and English content

### HTML Parsing

- Uses regex-based parsing (cheerio not available in Electron main process)
- Robust extraction of product IDs, names, and metadata
- Handles dynamic content and multiple page layouts

### Multi-language Support

- Supports Japanese, Chinese, and English interfaces
- Uses i18next for internationalized search terms
- Automatic language detection and appropriate headers

### Data Processing

- Extracts comprehensive work information
- Maps work types and genres
- Processes sample images and cover art
- Creates related site links for makers and series

## Usage

The provider supports both ID-based and name-based operations:

```typescript
// Search works
const works = await dlsiteProvider.searchGames('東方')

// Get metadata by DLsite ID
const metadata = await dlsiteProvider.getGameMetadata({ type: 'id', value: 'RJ123456' })

// Get metadata by name
const metadata = await dlsiteProvider.getGameMetadata({ type: 'name', value: '東方永夜抄' })

// Get work covers
const covers = await dlsiteProvider.getGameCovers({ type: 'id', value: 'RJ123456' })

// Get work backgrounds/screenshots
const backgrounds = await dlsiteProvider.getGameBackgrounds({ type: 'name', value: '東方永夜抄' })
```

## URL Structure

- Search: `https://www.dlsite.com/maniax/fsr/=/language/jp/keyword/{query}/`
- Work page: `https://www.dlsite.com/maniax/work/=/product_id/{id}.html`

## Content Types

Supports various DLsite content categories:

- Visual novels and games
- Adult content (with appropriate access controls)
- Doujin works and indie games
- Software and tools

## Error Handling

- Graceful handling of network errors
- Fallback to empty results for asset requests
- Comprehensive error logging
- Handles rate limiting and access restrictions
