# Quick Start

## Supported Platforms

Currently, Vnite only supports Windows platform. In the future, it may support mobile platforms such as Android and iOS for remote streaming of games on Windows. Stay tuned.

## Download and Install

Vnite is hosted on Github, and all version updates are published in the form of releases. You can get the latest installation package here.

- https://github.com/ximu3/vnite/releases

## Adding Games

Vnite currently supports three ways to add games.

1. Using scraper - Add single game (Requirement: Can be recognized by scraper)
2. Using scraper - Batch add (Requirements: Can be recognized by scraper, game exists locally)
3. Without using scraper (Requirement: Game exists locally)

### Add Single Game

Single addition supports fuzzy search and precise scraping. The language support and accuracy of fuzzy search are determined by the data source. Precise scraping requires the `Game ID` from the `corresponding data source`.

![gameSingleAdder1](https://img.timero.xyz/i/2025/04/02/67ecf19c18a3c.webp)

![gameSingleAdder2](https://img.timero.xyz/i/2025/04/02/67ecf1b1b35d8.webp)

![gameSingleAdder3](https://img.timero.xyz/i/2025/04/02/67ecf1c222240.webp)

### Batch Add

Select a library folder, and Vnite will read all first-level subfolder names as the original game names. Users can modify and attach the `Game ID` from the `corresponding data source` to improve scraping accuracy. Each game's scraping process is independent, and users can adjust and retry for games that fail to scrape.

> [!TIP]
> When batch adding, users cannot select background images; the first one is used by default.

![gameBatchAdder](https://img.timero.xyz/i/2025/04/02/67ecf1ec53201.webp)

### Custom Add

Simply select the executable file path to complete the addition. You can customize metadata or re-scrape later.
