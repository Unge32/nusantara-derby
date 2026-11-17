[![make.fun · best-game-01](https://make.fun/badge/best-game-01.svg)](https://make.fun/bounty/best-game-01?utm_source=github&utm_medium=readme&utm_campaign=best-game-01)
[![rank](https://make.fun/badge/best-game-01/Unge32/nusantara-derby/rank.svg)](https://make.fun/bounty/best-game-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=best-game-01)
[![reward](https://make.fun/badge/best-game-01/Unge32/nusantara-derby/reward.svg)](https://make.fun/bounty/best-game-01?utm_source=github&utm_medium=readme&utm_campaign=best-game-01)

Entry for [make.fun's "Make the best game" bounty](https://make.fun/bounty/best-game-01) ($1,000 in USDC).

# Nusantara Derby

An Indonesian horse-racing festival game: study the race card, bet
**play coins** on one of six horses, then spur your horse down the
stretch and take the 10-race championship.

Six original horses — Kilau Senja, Angin Timur, Bara Api, Pelangi,
Guntur, Srikandi — each with Speed, Stamina and Burst stats, recent
form and odds computed from both. Every race runs on a different
Indonesian track (Gelora Senayan, Danau Toba, Bukit Bromo…) under a
different ground condition: Dry, Soft or Muddy, and the ground changes
how fast stamina drains. During the race you can spur your bet horse
(Spacebar or tap it) for a burst of speed — three spurs per race, and
each one costs stamina, so timing matters. Win bets pay full odds;
Place bets pay reduced odds when your horse finishes top 3. Between
races you can spend winnings in the stable shop on faster horses, and
after race 10 the championship standings crown a champion.

**All betting uses virtual coins only — no real money, no crypto, no
wallet, no payout.** You start a season with 1,000 coins; if you fall
below the 50-coin minimum bet, the season is over.

## How to play

Serve the `game/` folder with any static server (for example
`node serve.ts`, then open http://localhost:8080), or open
`game/index.html` directly from a local file server.

- **Bet screen:** click a horse row (or press 1–6) to pick it. W/P
  switches Win/Place. −/+ or the chips set your stake (minimum 50).
  Click PLACE BET & START RACE (or press Enter).
- **Race:** watch your horse. Press **Space** or tap/click your horse
  to spur it — 3 spurs per race. P pauses.
- **Results:** see the finishing order, photo-finish calls and your
  payout, then Next Race. After race 10, the championship screen
  shows the final standings.

Sound is synthesized in the browser (starting bell, hoofbeats, crowd,
fanfare) — no audio files. All art is drawn in code; every name,
horse and track is original.
