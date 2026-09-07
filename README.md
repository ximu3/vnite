<div align="center">
  <img src="https://img.timero.xyz/i/2025/07/31/688b10f8bccfc.png" width="128" height="128" alt="cover">

  <h1 align="center">
    Vnite
  </h1>

  <p align="center">
    <a href="https://www.electronjs.org/" target="_blank"><img src="https://img.shields.io/badge/Electron-47848F?style=flat-square&logo=electron&logoColor=white" alt="Electron"></a>
    <a href="https://reactjs.org/" target="_blank"><img src="https://img.shields.io/badge/React-61DAFB?style=flat-square&logo=react&logoColor=black" alt="React"></a>
    <a href="https://www.gnu.org/licenses/gpl-3.0.en.html" target="_blank"><img src="https://img.shields.io/badge/License-GPL%203.0-blue.svg?style=flat-square&logo=gnu&logoColor=white" alt="GPL-3.0 License"></a>
    </br>
    <a href="https://github.com/ximu3/vnite/stargazers"><img src="https://img.shields.io/github/stars/ximu3/vnite?color=ffcb47&labelColor=black&style=flat-square&logo=github&label=Stars" /></a>
    <a href="https://github.com/ximu3/vnite/graphs/contributors"><img src="https://img.shields.io/github/contributors/ximu3/vnite?style=flat-square&logo=github&label=Contributors&labelColor=black" /></a>
    <a href="https://github.com/ximu3/vnite/releases"><img src="https://img.shields.io/github/downloads/ximu3/vnite/total?color=369eff&labelColor=black&logo=github&style=flat-square&label=Downloads" /></a>
    <a href="https://t.me/+d65-R_xRx1JlYWZh" target="_blank"><img src="https://img.shields.io/badge/Telegram-2CA5E0?style=flat-square&logo=telegram&logoColor=white&labelColor=black" /></a>
  </p>
</div>

[English](README.md) | [简体中文](README.zh-CN.md)

Vnite is a versatile game management software designed to provide a unified interface for recording, managing, and synchronizing your gaming journey.

## ✨ Features

- Modern user interface (with customizable themes)
- Plugin support (with built-in plugin marketplace)
- Real-time cloud synchronization for all game records, saves, and settings across multiple devices
- Support for multiple data sources (Steam, IGDB, Bangumi, VNDB, YMGal, DLsite, Erogamescape)
- Supports automatic game library integration, each scanner can customize folder structure and data sources
- Flexible metadata transformer, supports regex modification, replacement, merging, and exclusion of any metadata
- Detailed reporting functionality, including annual, monthly, and weekly reports to review your gaming journey
- Integration with other programs (such as one-click LE region switching, automatic Magpie scaling, emulator launching, etc.)
- One-click import from Steam library (preserving game time)
- Multiple launch methods (files, links, scripts), with high customizability and preset configurations
- Dynamic categorization (by developer, tags, etc.)
- Powerful filters with support for custom metadata fields
- Session-based timer, supporting recording for individual files or folders
- Support for launching games via system links
- Complete separation of data and program for easy backup and customization

## Development

Use Node.js 20.19+ (20.x) or 22.12+, and the pnpm version pinned in `package.json`.
See the [pnpm installation guide](https://pnpm.io/installation) for setup.
Building the Windows native module also requires the Rust MSVC toolchain and Visual Studio C++ Build Tools with the Windows SDK.

Run these commands from the repository root:

```sh
pnpm install --frozen-lockfile
pnpm build:native
pnpm dev
```

The application and `native` package share a workspace and the root `pnpm-lock.yaml`.
Use `pnpm typecheck` to check types, `pnpm build` to compile, and `pnpm build:win` to create the Windows installer.
`pnpm build` and `pnpm build:win` build the native module automatically.
Dependency patches in `patches/` are applied by pnpm during installation.

## 📸 Screenshots

<details>
<summary>Dark</summary>

![game](https://img.timero.xyz/i/2025/07/31/688b0cd59020b.png)

</details>

<details>
<summary>Light</summary>

![game](https://img.timero.xyz/i/2025/07/31/688b0d5d5511e.png)

</details>

## 💡 Planned Features

- Self-built data source
- Support for large-screen UI

## 🌏 Internationalization

The internationalization work of Vnite is hosted on [Weblate](https://hosted.weblate.org/projects/vnite/), and your participation is welcome.

<a href="https://hosted.weblate.org/engage/vnite/">
<img src="https://hosted.weblate.org/widget/vnite/multi-auto.svg" alt="translation-status" />
</a>

## ☎️ Contact Me

- [Twitter](https://x.com/ximu3_)
- [Telegram Group](https://t.me/+d65-R_xRx1JlYWZh)

## ⭐ Acknowledgements

- [VNDB API](https://api.vndb.org/kana)
- [Steam API](https://partner.steamgames.com/doc/api)
- [YMGal API](https://www.ymgal.games/developer)
- ...


## 🌐 Web Resources & Verified Articles Directory
- [PIM PATH](https://sieuthigame-viet.pages.dev/pim-path.html)
- [MERGE RUSH Z](https://zona-igr-besplatno.web.app/merge-rush-z.html)
- [X TO Y ALMOST IMPOSSIBLE](https://koreagame-hub24.netlify.app/x-to-y-almost-impossible.html)
- [ROOFTOP CHALLENGE](https://turbodrift-zone.web.app/rooftop-challenge.html)
- [GOLD MINER CLASSIC](https://juegosweb-gratis.github.io/gold-miner-classic.html)
- [SNEAKY FRIENDS](https://brainiac-puzzles.web.app/sneaky-friends.html)
- [CUBE SPEED DASH](https://arcadegames-france24.web.app/cube-speed-dash.html)
- [CLAP CLAP NIGHTMARE](https://desi-gaming-arena.pages.dev/clap-clap-nightmare.html)
- [LITTLE HERO KNIGHT](https://gemu-hiroba-japan.web.app/little-hero-knight.html)
- [FIRE AND WATER BIRDS](https://muryo-gemu-tengoku.pages.dev/fire-and-water-birds.html)
- [ULTRAHERO VS MONSTERS ROYALE BATTLE](https://turbodrift-zone.web.app/ultrahero-vs-monsters-royale-battle.html)
- [ANGRY FLAPPY](https://PixelArcadezGame.github.io/angry-flappy.html)
- [MOTO STUNTS DRIVING RACING](https://desi-gaming-arena.pages.dev/moto-stunts-driving-racing.html)
- [MONA LISA FASHION EXPERIMENTS](https://zona-igr-besplatno.web.app/mona-lisa-fashion-experiments.html)
- [PICTURE BY PIECES](https://sieuthigame-viet.pages.dev/picture-by-pieces.html)
- [BACKROOMS SKIBIDI TERRORS](https://veb-igry-moskva.web.app/backrooms-skibidi-terrors.html)
- [CLASH CROWD GAME](https://logic-puzzle-world.pages.dev/clash-crowd-game.html)
- [EGG DASH](https://luchshie-igry-rus.pages.dev/egg-dash.html)
- [JEWEL GARDEN STORY](https://muryo-geim-nara.web.app/jewel-garden-story.html)
- [FROST DEFENSE](https://jogosonline-brasil.vercel.app/frost-defense.html)
- [KNIT RESCUE](https://jogosweb-brasil.github.io/knit-rescue.html)
- [BIKING EXTREME 3D](https://PixelArcadezGame.github.io/biking-extreme-3d.html)
- [ITALIAN BRAINROT PUZZLE](https://sieuthigame-viet.pages.dev/italian-brainrot-puzzle.html)
- [HORROR ESCAPE GRANNY ROOM](https://zona-igr-besplatno.web.app/horror-escape-granny-room.html)
- [COW JAM FARM PUZZLE](https://youxiweb-china.github.io/cow-jam-farm-puzzle.html)
- [COLOR 3D BUMP IT UP](https://jogosweb-brasil24.netlify.app/color-3d-bump-it-up.html)
- [LEXY](https://nihon-webgames.netlify.app/lexy.html)
- [MEGA FALL RAGDOLL SIMULATOR](https://planetejeux-france.pages.dev/mega-fall-ragdoll-simulator.html)
- [21 CARDS](https://bharat-game-zone.web.app/21-cards.html)
- [VEGAMIX2 WILD WEST](https://youxi-h5-tiandi.pages.dev/vegamix2-wild-west.html)
- [COZY KITCHEN MERGE](https://jogosweb-brasil.github.io/cozy-kitchen-merge.html)
- [THE OFFICE ESCAPE](https://nihon-webgames.netlify.app/the-office-escape.html)
- [FASHION VALKYRIES SAGA OF STYLE](https://planetejeux-france.pages.dev/fashion-valkyries-saga-of-style.html)
- [BUILDING MODS FOR MINECRAFT](https://zona-juegos-flash.web.app/building-mods-for-minecraft.html)
- [COLOR SAND PUZZLE](https://onlinerus-portal.netlify.app/color-sand-puzzle.html)
- [2 3 4 PLAYER GAMES](https://muryo-geim-nara.web.app/2-3-4-player-games.html)
- [ITALIAN BRAINROT TUNG TUNG RACING](https://unblocked-galaxy.web.app/italian-brainrot-tung-tung-racing.html)
- [CLASSIC LABYRINTH 3D MAZE](https://action-battle-hub.pages.dev/classic-labyrinth-3d-maze.html)
- [NG FLOW LINES](https://juegosweb-desbloqueados.vercel.app/ng-flow-lines.html)
- [CARBON ROD](https://fischpedia-guide.pages.dev/calculator/carbon-rod)
- [IDLE FACTORY DOMINATION](https://unblocked-galaxy.web.app/idle-factory-domination.html)
- [FASHION WEEK 2025](https://nihongames-web.github.io/fashion-week-2025.html)
- [BATTLE ARENA](https://mundodosjogos-br.web.app/battle-arena.html)
- [FROM ZOMBIE TO GLAM A SPOOKY TRANSFORMATION](https://youxiweb-hub.netlify.app/from-zombie-to-glam-a-spooky-transformation.html)
- [SOCCER EURO CUP 2025](https://muryo-geim-nara.web.app/soccer-euro-cup-2025.html)
- [THE OFFICE ESCAPE](https://veb-igry-moskva.web.app/the-office-escape.html)
- [PANDA DASH AUTO SHOOTING](https://jingpin-youxiwang.pages.dev/panda-dash-auto-shooting.html)
- [CHARGER CITY DRIVER](https://unblocked-galaxy.web.app/charger-city-driver.html)
- [SURVIVAL MASTER 456 CHALLENGE](https://youxiweb-hub.netlify.app/survival-master-456-challenge.html)
- [HIDDEN OBJECTS ISLAND](https://jeuxflash-france.netlify.app/hidden-objects-island.html)
- [LOOPER](https://hindigame-arena.vercel.app/looper.html)
- [HELP ME TRICKY BRAIN PUZZLES](https://dautruong-game24h.web.app/help-me-tricky-brain-puzzles.html)
- [OBBY RAINBOW TOWER](https://espacejeux-paris.pages.dev/obby-rainbow-tower.html)
- [DADDY RABBIT](https://hindigames-hub.netlify.app/daddy-rabbit.html)
- [CHOCO BLOCKS](https://bharat-game-zone.web.app/choco-blocks.html)
- [MEN VS GORILLAS](https://quantum-puzzle-hub.pages.dev/men-vs-gorillas.html)
- [HAIR STACK 3D](https://jogosonline-brasil.vercel.app/hair-stack-3d.html)
- [BOLTS AND NUTS](https://koreagame-webhub.github.io/bolts-and-nuts.html)
- [BRAINROT MOB CLASH 3D](https://dautruong-game24h.web.app/brainrot-mob-clash-3d.html)
- [BUBBLE SHOOTER HAWAII](https://jeuxflash-france.netlify.app/bubble-shooter-hawaii.html)
- [FOXY ECO SORT](https://brainiac-puzzles.web.app/foxy-eco-sort.html)
- [SCREAMALS](https://portaldejogos-br.github.io/screamals.html)
- [BLOCK BLASTY SAGA](https://brain-puzzle-galaxy.netlify.app/block-blasty-saga.html)
- [PET CONNECT MATCH](https://choigamehay24h.github.io/pet-connect-match.html)
- [SHAPE SHIFT](https://logic-puzzle-world.pages.dev/shape-shift.html)
- [HIGH HEELS COLLECT RUN](https://jogosweb-brasil24.netlify.app/high-heels-collect-run.html)
- [KICK LUCKY BOXES ONLINE](https://mundodosjogos-br.web.app/kick-lucky-boxes-online.html)
- [BLOCK BLAST JEWEL PUZZLE](https://webarcade-hub.github.io/block-blast-jewel-puzzle.html)
- [QUBE 2048](https://shadow-ninja-arena.web.app/qube-2048.html)
- [STUNT RIDER](https://unblocked-galaxy.github.io/stunt-rider.html)
- [KICK AND RIDE](https://juegosweb-gratis.github.io/kick-and-ride.html)
- [GRUNGE CHIC ALT FASHION](https://kuaile-youxi-hub.web.app/grunge-chic-alt-fashion.html)
- [EAT AND GROW FISH](https://koreagame-zone.vercel.app/eat-and-grow-fish.html)
- [CRYSTAL CONNECT](https://youxi-china24.netlify.app/crystal-connect.html)
- [ROPE SORTING](https://koreagame-hub24.netlify.app/rope-sorting.html)
- [HELIX CRUSH](https://onlinerus-portal.netlify.app/helix-crush.html)
- [DYE IT RIGHT COLOR PICKER](https://action-battle-hub.pages.dev/dye-it-right-color-picker.html)
- [ROBLOX CRAFT RUN](https://youxi-china24.netlify.app/roblox-craft-run.html)
- [CRUSH IT ALL](https://tokyo-arcade-web.pages.dev/crush-it-all.html)
- [NEON GRAVITY](https://pixelarcade-speed.web.app/neon-gravity.html)
- [BLOCK BLAST 2048](https://juegosgratis-es.netlify.app/block-blast-2048.html)
- [MERGE HERO SURVIVAL TOWER DEFENSE](https://veb-igry-moskva.web.app/merge-hero-survival-tower-defense.html)
- [STUDENT AND TEACHER](https://veb-igry-moskva.web.app/student-and-teacher.html)
- [SUDOKU MASTER](https://maniadejogos-brasil.pages.dev/sudoku-master.html)
- [SNAKES](https://unblocked-action-arena.netlify.app/snakes.html)
- [UNTWIST ROAD](https://maniadejogos-brasil.pages.dev/untwist-road.html)
- [MR BULLET STEALTH NINJA KILLSTREAK](https://muryo-gemu-tengoku.pages.dev/mr-bullet-stealth-ninja-killstreak.html)
- [MAIDO](https://espacejeux-paris.pages.dev/maido.html)
- [EMOJI MERGE FUN MOJI](https://shadow-ninja-arena.web.app/emoji-merge-fun-moji.html)
- [COLOR BRAIN TEST GAMES](https://hindigames-portal.netlify.app/color-brain-test-games.html)
- [GOBATTLEIO](https://sieuthigame-viet.pages.dev/gobattleio.html)
- [ANNAS STORY DRESS UP DIY](https://unblocked-action-arena.netlify.app/annas-story-dress-up-diy.html)
- [DINOSAUR SHIFTING RUN](https://muryo-gemu-tengoku.pages.dev/dinosaur-shifting-run.html)
- [KITTEN NEVER DIES](https://mundodosjogos-br.web.app/kitten-never-dies.html)
- [CUPID UNCHAINED](https://tokyo-arcade-web.pages.dev/cupid-unchained.html)
- [BOOLU BASK](https://gamehay-online.netlify.app/boolu-bask.html)
- [TANKS](https://zona-igr-besplatno.web.app/tanks.html)
- [CHICKEN STRIKE](https://portaldejogos-br.github.io/chicken-strike.html)
- [VISUAL MEMORY DRAG DROP](https://pixelarcadezgame.web.app/visual-memory-drag-drop.html)
- [MINETAP](https://webarcade-gamehub.github.io/minetap.html)
- [MATH LAVA TOWER RACE](https://zona-juegos-flash.web.app/math-lava-tower-race.html)
- [OBBY DEAD RIVER](https://congdonggame-vietnam.web.app/obby-dead-river.html)
- [WORD JAM ASSOCIATION PUZZLE](https://jeuxflash-france.netlify.app/word-jam-association-puzzle.html)
- [GATE HEROES BATTLE](https://unblocked-galaxy.github.io/gate-heroes-battle.html)
- [GRANNY 2 ASYLUM HORROR HOUSE](https://jogosweb-brasil24.netlify.app/granny-2-asylum-horror-house.html)
- [SUPER TANK HERO](https://retro-arcade-zone.netlify.app/super-tank-hero.html)
- [BLOCOPS](https://shanghai-youxi-web.web.app/blocops.html)
- [ARROW LEGEND](https://shadow-ninja-arena.web.app/arrow-legend.html)
- [SQUID GAME ORIGINAL](https://arcadevault-games.github.io/squid-game-original.html)
- [COLOR NONOGRAM PUZZLE](https://action-strike-zone.pages.dev/color-nonogram-puzzle.html)
- [BOOM LAND LITE](https://choigamehay24h.github.io/boom-land-lite.html)
- [ZOMBIE CONQUER COUNTRIES](https://desi-gaming-arena.pages.dev/zombie-conquer-countries.html)
- [SPRUNKI GARDEN](https://unblocked-action-arena.netlify.app/sprunki-garden.html)
- [HILL CLIMB TRUCK TRANSFORM ADVENTURE](https://muryo-gemu-tengoku.pages.dev/hill-climb-truck-transform-adventure.html)
- [LIMITED DEFENSE](https://trochoimienphi24h.github.io/limited-defense.html)
- [ARROW SURVIVAL 15 SECONDS](https://shadow-ninja-arena.web.app/arrow-survival-15-seconds.html)
- [GIANT RUN 3D](https://kuaile-youxi-hub.web.app/giant-run-3d.html)
- [SPRUNKI CHARACTER MAKER OC](https://zona-juegos-flash.web.app/sprunki-character-maker-oc.html)
- [LEOPARD](https://trade-calculator-bf.pages.dev/values/leopard)
- [AIR BLOCK](https://espacejeux-paris.pages.dev/air-block.html)
- [MINERS FURY](https://juegosweb-desbloqueados.vercel.app/miners-fury.html)
- [FUNNY BALLS 2048](https://shadow-ninja-arena.web.app/funny-balls-2048.html)
- [HOTEL FEVER TYCOON](https://geim-cheon-guk24.pages.dev/hotel-fever-tycoon.html)
- [HIDDEN OBJECTS](https://unblocked-galaxy.web.app/hidden-objects.html)
- [TRICKY CASTLE](https://koreagame-hub24.netlify.app/tricky-castle.html)
- [LAVA JUMP](https://mundodosjogos-br.web.app/lava-jump.html)
- [GOAL IO](https://hindigame-arena.vercel.app/goal-io.html)
- [FLOWER COLLECTION](https://arcadevault-games.github.io/flower-collection.html)
- [BROKEN CITY COMBAT](https://koreagame-zone.vercel.app/broken-city-combat.html)
- [ROBOT TERMINATOR T REX](https://juegosgratis-es.netlify.app/robot-terminator-t-rex.html)
- [SKY ASSAULT](https://koreagame-arcade.netlify.app/sky-assault.html)
- [VEHICLE FUN RACE](https://kuaile-youxi-hub.web.app/vehicle-fun-race.html)
- [THE BEST WARRIOR](https://arcadevault-gamehub.github.io/the-best-warrior.html)
- [CLICK KITTY IDLE](https://juegosmundial-hoy.pages.dev/click-kitty-idle.html)
- [COLOR SORT IMPOSTOR EDITION](https://jogosweb-brasil24.netlify.app/color-sort-impostor-edition.html)
- [OBBY 3D SPRUNKI PARKOUR](https://gemu-hiroba-japan.web.app/obby-3d-sprunki-parkour.html)
- [ATLANTIC SKY HUNTER XTREME](https://bharat-game-zone.web.app/atlantic-sky-hunter-xtreme.html)
- [MEGA LAMBA RAMP](https://portaldejogos-br.github.io/mega-lamba-ramp.html)
- [TCG CARD CLICKER](https://hindigames-hub.netlify.app/tcg-card-clicker.html)
- [ARMY COMMANDER CRAFT](https://choigame24h-vietnam.netlify.app/army-commander-craft.html)
- [TANGLE MASTER 3D](https://turbodrift-zone.web.app/tangle-master-3d.html)
- [SURVIVAL MASTER 456 CHALLENGE](https://bharat-game-zone.web.app/survival-master-456-challenge.html)
- [VINE BOOM](https://instantsounds-daw.pages.dev/sound/vine-boom.html)
- [CUTE COLORING GAMES](https://maniadejogos-brasil.pages.dev/cute-coloring-games.html)
- [GEOMETRY FLAP](https://unblocked-galaxy.github.io/geometry-flap.html)
- [BUBBLE LETTERS](https://trochoimienphi24h.github.io/bubble-letters.html)
- [3 TILES](https://vuagamemienphi24h.pages.dev/3-tiles.html)
- [LEXY](https://vuagamemienphi24h.pages.dev/lexy.html)
- [RAGDOLL MEGA DUNK](https://gamehay-online.netlify.app/ragdoll-mega-dunk.html)
- [SANTA GO](https://action-battle-hub.pages.dev/santa-go.html)
- [IDLE MONEY FACTORY](https://shanghai-youxi-web.web.app/idle-money-factory.html)
- [POPCAT CLICKER](https://desi-gaming-arena.pages.dev/popcat-clicker.html)
- [DOTS MASTER](https://muryo-gemu-tengoku.pages.dev/dots-master.html)
- [PRACTICE ON ME](https://congdonggame-vietnam.web.app/practice-on-me.html)
- [SUV TRAFFIC RACER](https://vuagamemienphi24h.pages.dev/suv-traffic-racer.html)
- [RUMBLE](https://fruit-calculator-2026.netlify.app/calculator/rumble)
- [MAGIC SOLITAIRE](https://portaldejogos-br.github.io/magic-solitaire.html)
- [BUBBLE POP FAIRYLAND](https://vuagamemienphi24h.pages.dev/bubble-pop-fairyland.html)
- [TRIDENT ROD](https://fischcalc-app.pages.dev/calculator/trident-rod)
- [PHRASLE MASTER](https://muryo-gemu-tengoku.pages.dev/phrasle-master.html)
- [ROYAL REBELLION PUNK MAGIC](https://choigame24h-vietnam.netlify.app/royal-rebellion-punk-magic.html)
- [BED WARS](https://PixelArcadez.github.io/bed-wars.html)
- [WORM OUT BRAIN TEASER GAMES](https://youxi-h5-tiandi.pages.dev/worm-out-brain-teaser-games.html)
- [PAWS PALS DINER](https://webarcade-gamehub.github.io/paws-pals-diner.html)
- [ITALIAN BRAINROT SURVIVAL ARENA](https://logic-puzzle-world.pages.dev/italian-brainrot-survival-arena.html)
- [BATTLE ARENA RACE TO WIN](https://jogosweb-brasil.github.io/battle-arena-race-to-win.html)
- [SPRUNKI MEMORY CARD MATCH](https://onlinerus-games.netlify.app/sprunki-memory-card-match.html)
- [HEXA STACK](https://bharat-game-zone.web.app/hexa-stack.html)
- [SUSTAINABLE](https://gameflash-viet.github.io/sustainable.html)
- [EYE ART PERFECT MAKEUP ARTIST](https://arcadegames-france24.web.app/eye-art-perfect-makeup-artist.html)
- [UNSCREW WOOD PUZZLE](https://unblocked-galaxy.web.app/unscrew-wood-puzzle.html)
- [DOTS MASTER](https://espacejeux-paris.pages.dev/dots-master.html)
- [THROUGH THE WALL 3D](https://zona-juegos-flash.web.app/through-the-wall-3d.html)
- [MEMORY MATCH MAGIC](https://choigame24h-vietnam.netlify.app/memory-match-magic.html)
- [SURVIVAL ISLAND](https://luchshie-igry-rus.pages.dev/survival-island.html)
- [ZOMBIES WEAPON MERGE 4](https://koreagame-arcade.netlify.app/zombies-weapon-merge-4.html)
- [IDLE LANDMARK BUILDER](https://koreagame-arcade.netlify.app/idle-landmark-builder.html)
- [SHADOW](https://bftrade-calculator.pages.dev/calculator/shadow)
- [MARBLE SORT](https://nihon-webgames.netlify.app/marble-sort.html)
- [WINTER MAZE](https://nihon-webgames.netlify.app/winter-maze.html)
- [TOWER DEFENSE DRAGON MERGE](https://choigamehay24h.github.io/tower-defense-dragon-merge.html)
- [BUBBLE SHOOTER POP](https://turbodrift-zone.web.app/bubble-shooter-pop.html)
- [SPACE SURVIVAL RAINBOW FRIENDS MONSTER](https://pixelarcade-speed.web.app/space-survival-rainbow-friends-monster.html)
- [ARROW TAP PUZZLE](https://koreagame-zone.vercel.app/arrow-tap-puzzle.html)
- [MERGE GUN FPS SHOOTING ZOMBIE](https://kuaile-youxi-hub.web.app/merge-gun-fps-shooting-zombie.html)
- [GOODELUXE](https://jogosonline-brasil.vercel.app/goodeluxe.html)
- [JUMP TO THE MOUNTAIN FOR THE BRAINROTS](https://choigame24h-vietnam.netlify.app/jump-to-the-mountain-for-the-brainrots.html)
- [FRAGEN](https://pixelarcade-speed.web.app/fragen.html)
- [2248 BLAST](https://juegosmundial-hoy.pages.dev/2248-blast.html)
- [BLOCK BLASTER PUZZLE](https://webarcade-hub.github.io/block-blaster-puzzle.html)
- [FAMILY SQUID CHALLENGE](https://hindigames-portal.netlify.app/family-squid-challenge.html)
- [FOXY ECO SORT](https://shadow-ninja-arena.web.app/foxy-eco-sort.html)
- [HALLOWEEN STORE SORT](https://peullaesi-geim-madang.web.app/halloween-store-sort.html)
- [ALGERIAN SOLITAIRE](https://espacejeux-paris.pages.dev/algerian-solitaire.html)
- [BRAWL STARS BATTLE](https://espacejeux-paris.pages.dev/brawl-stars-battle.html)
- [ULTIMATE SPORTS CAR DRIFT](https://bharat-game-zone.web.app/ultimate-sports-car-drift.html)
- [JEWEL GARDEN STORY](https://gemu-hiroba-japan.web.app/jewel-garden-story.html)
- [SURVIVAL SWORD BATTLE](https://jogosonline-brasil.vercel.app/survival-sword-battle.html)
- [KRAKAX COM](https://youxi-h5-tiandi.pages.dev/krakax-com.html)
- [TURBO STARS](https://sieuthigame-viet.pages.dev/turbo-stars.html)
