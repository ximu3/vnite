# Steam Provider

A built-in scraper provider that fetches game data from [Steam](https://store.steampowered.com/), the popular digital game distribution platform.

## Features

- **Game Search**: Search games by name in the Steam store
- **Game Metadata**: Comprehensive game information including descriptions, developers, genres, and tags
- **Game Existence Check**: Verify if a game exists in the Steam store
- **Game Assets**: Backgrounds, covers, and logos directly from Steam CDN
- **Multi-language Support**: Localized content based on user language preferences
- **Store Integration**: Direct links to Steam store pages and official websites

## Supported Identifiers

- **ID**: Steam App ID (e.g., "123456")
- **Name**: Game name for search-based lookup

## API Integration

The provider uses the Steam Web API and Store API with:

- **Store API**: `https://store.steampowered.com/api/`
- **CDN**: `https://steamcdn-a.akamaihd.net/`
- **Fallback API**: `https://api.ximu.dev/steam/` for redundancy

### Language Configuration

The provider supports localized content through i18next configuration:

```json
{
  "apiLanguageCode": "english",
  "urlLanguageCode": "en",
  "acceptLanguageHeader": "en-US,en;q=0.9",
  "countryCode": "US"
}
```

## Assets

### Asset Types

- **Backgrounds**: Hero images (`library_hero.jpg`, `library_hero_2x.jpg`)
- **Covers**: Vertical covers (`library_600x900.jpg`, `library_600x900_2x.jpg`)
- **Logos**: Game logos (`logo.png`, `logo_2x.png`)

### CDN URLs

Assets are fetched from multiple CDN endpoints with fallback support:

- Primary: Steam's official CDN
- Fallback: Proxy CDN for reliability

## Metadata Features

### Game Information

- Localized and original names
- Release dates
- Detailed descriptions
- Developer and publisher information
- Genre classification
- User-defined tags from Steam store

### Related Sites

- Official game websites
- Metacritic scores and links
- Direct Steam store page links

## Error Handling

The provider includes comprehensive error handling:

- **Timeout Protection**: 5-second request timeouts
- **Fallback URLs**: Automatic failover to proxy APIs
- **Missing Data**: Graceful handling of incomplete game information
- **Rate Limiting**: Built-in request throttling

## Language Support

### Multi-language Metadata

- Fetches game data in user's preferred language
- Maintains original English names when available
- Supports all Steam-supported languages

### Store Tags

- Extracts user-generated tags from Steam store pages
- Falls back to official genre classifications
- Supports localized tag names

## Capabilities

This provider implements the following `ScraperProvider` methods:

- `searchGames(gameName)` - Search games in Steam store
- `checkGameExists(identifier)` - Check if game exists
- `getGameMetadata(identifier)` - Get comprehensive game metadata
- `getGameBackgrounds(identifier)` - Get background/hero images
- `getGameCovers(identifier)` - Get cover/poster images
- `getGameLogos(identifier)` - Get game logos

## Data Sources

### Store Search API

- Real-time search results from Steam store
- Includes pricing information
- Supports fuzzy matching

### App Details API

- Complete game metadata
- Release information
- Category and genre data
- Developer/publisher details

### Store Page Scraping

- User-generated tags
- Additional metadata not available via API
- Community-driven content

## Integration Notes

### Performance

- Parallel requests for multi-language support
- Efficient asset URL validation
- Cached language configuration

### Reliability

- Multiple API endpoints for redundancy
- Graceful degradation when services are unavailable
- Comprehensive logging for debugging

### Compatibility

- Works with all Steam game types
- Supports both free and paid games
- Compatible with Early Access titles
