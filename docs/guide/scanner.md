# Scanner

Vnite's scanner helps users automatically import games, supporting global deduplication, regex exclusion, and unified error handling [1](https://github.com/ximu3/vnite).

![scanner1](https://img.timero.xyz/i/2025/04/18/68023670e9770.webp)

## Parameters

Each scanner can be configured with the following parameters:

- `Path`: Target path for the scanner
- `Data Source`: Metadata source used by the scanner
- `Scan Depth`: Scanning depth of the scanner, default is 1

![scanner2](https://img.timero.xyz/i/2025/04/18/6802368e74e7e.webp)

The scan depth might be confusing, but it's actually quite simple. The scan depth is the subfolder depth of your game folders under the target path. The default value of 1 means it only scans first-level subfolders, 2 means it only scans second-level subfolders, and so on.

For example:

```
Target Path
├── First-level Subfolder
│   └── Second-level Subfolder
└── First-level Subfolder
    └── Second-level Subfolder
```

In this example, when the scan depth is set to 1, the scanner will only scan `First-level Subfolder` and won't scan `Second-level Subfolder`. If the scan depth is set to 2, it will scan `Second-level Subfolder` and won't scan `First-level Subfolder`.

Here are two specific examples:

```
Target Path
├── Askiisoft
│   └── Katana Zero
└── MAGES. GAME
    ├── STEINS;GATE
    ├── CHAOS;CHILD
    └── CHAOS;HEAD
```

With this folder structure, game folders are `Second-level Subfolders` of the target path, so the scan depth should be set to 2.

```
Target Path
├── Katana Zero
├── STEINS;GATE
├── CHAOS;CHILD
└── CHAOS;HEAD
```

With this folder structure, game folders are `First-level Subfolders` of the target path, so the scan depth should be set to 1.

## Global Settings

You can adjust the `Scan Interval` and `Exclusion List` in the global scanner settings. The `Exclusion List` supports regular expressions.

![scanner3](https://img.timero.xyz/i/2025/04/18/680236ac47a2c.webp)

## Error Handling

The scanner supports secondary identification for folders with errors. Users need to provide the data source and corresponding game ID, or they can choose to ignore or add to the exclusion list [2](https://github.com/ximu3/vnite/blob/main/README.md).

![scanner4](https://img.timero.xyz/i/2025/04/18/680236c38566b.webp)

![scanner5](https://img.timero.xyz/i/2025/04/18/680236d1db70a.webp)
