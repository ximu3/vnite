# VNDB Scraper Provider

This is a built-in scraper provider for [VNDB (The Visual Novel Database)](https://vndb.org), which provides comprehensive metadata for visual novels.

## Features

- **Game Search**: Search for visual novels by name
- **Metadata Retrieval**: Get detailed game information including:
  - Title (with language-specific titles)
  - Release date
  - Description (formatted from BBCode)
  - Developers
  - Tags (with spoiler filtering)
  - External links
  - Staff information (directors, scenario writers, artists, musicians)
- **Image Assets**:
  - Cover images
  - Screenshot backgrounds
- **Game Verification**: Check if a game exists in the database

## Configuration

The provider respects the following configuration options:

- `game.scraper.vndb.tagSpoilerLevel`: Controls tag spoiler filtering
  - `0`: No spoiler tags
  - `1`: Minor spoiler tags allowed
  - `2`: All spoiler tags allowed

## API Endpoints

The provider uses VNDB's Kana API with fallback to alternative endpoints:

- Primary: `https://api.vndb.org/kana/vn`
- Fallback: `https://api.ximu.dev/vndb/kana/vn`

Image assets also have fallback URLs for better reliability.

## Data Processing

### Staff Data

The provider maps VNDB staff roles to predefined metadata keys:

- `director` → Director
- `scenario` → Scenario
- `chardesign`, `art` → Illustration
- `music`, `songs` → Music

### Description Formatting

BBCode tags in descriptions are converted to HTML:

- `[url=link]text[/url]` → HTML links
- `[b]text[/b]` → Bold text
- `[spoiler]text[/spoiler]` → Collapsible details

### Language Support

The provider supports multiple languages and will attempt to return titles in the user's preferred language when available.

## Error Handling

The provider includes comprehensive error handling:

- Network timeouts (5 seconds)
- Endpoint fallbacks
- Image URL validation
- Graceful degradation when data is unavailable

## Usage

The VNDB provider is automatically registered at application startup and can be used through the scraper manager with the ID `'vndb'`.
