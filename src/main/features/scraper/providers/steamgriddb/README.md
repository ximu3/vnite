# SteamGridDB Provider

A built-in scraper provider that fetches game assets (covers, backgrounds, logos, and icons) from [SteamGridDB](https://www.steamgriddb.com/).

## Features

- **Game Covers**: High-quality game covers and grid images
- **Game Backgrounds**: Hero images and backgrounds
- **Game Logos**: Game logos and branding assets
- **Game Icons**: Application icons

## Configuration

The provider requires a SteamGridDB API key. Set the `STEAMGRIDDB_API_KEY` environment variable:

```bash
STEAMGRIDDB_API_KEY=your_api_key_here
```

You can obtain an API key from [SteamGridDB](https://www.steamgriddb.com/profile/preferences/api).

## Supported Identifiers

- **ID**: Steam application ID (e.g., "123456")
- **Name**: Game name for search-based lookup

## API Endpoints

The provider uses multiple API endpoints for redundancy:

- Primary: `https://www.steamgriddb.com/api/v2`
- Fallback: `https://api.ximu.dev/steamgriddb/api`

## Image CDN

Images are served through multiple CDNs:

- Primary: `https://cdn2.steamgriddb.com`
- Fallback: `https://api.ximu.dev/steamgriddb/img`

## Steam Integration

The provider also attempts to fetch images from Steam when available, providing these as the first results in the asset arrays.

## Error Handling

The provider includes comprehensive error handling:

- API endpoint failover
- Image URL validation
- CDN fallback mechanisms
- Request timeout protection (5 seconds)

## Capabilities

This provider implements the following `ScraperProvider` methods:

- `getGameCovers(identifier)` - Returns array of cover/grid URLs
- `getGameBackgrounds(identifier)` - Returns array of background/hero URLs
- `getGameLogos(identifier)` - Returns array of logo URLs
- `getGameIcons(identifier)` - Returns array of icon URLs

Note: This provider does not support game search or metadata retrieval - it's purely for asset fetching.
