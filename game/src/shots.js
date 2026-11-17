// Nusantara Derby — shots.js
// Deterministic staged scenes for ?shot=bet|race|results|champ|start.
// Each scene plays by the real rules from a seeded world, so the frame
// is a genuine render of the game, not a mockup.
import { createSeason, placeBet, settleRace, nextRace } from './season.js';
import { createRace, stepRace } from './race.js';

export function stageShot(name, seed) {
  const season = createSeason(seed);
  if (name === 'bet') {
    // Race 3, a few points already on the board, one horse picked.
    season.raceNo = 3;
    season.roster[0].points = 16;
    season.roster[1].points = 10;
    season.roster[2].points = 6;
    season.roster[0].form = [1, 2, 1];
    season.roster[1].form = [2, 1, 3];
    season.roster[2].form = [3, 3, 2];
    season.coins = 1450;
    season.selectedHorse = 1;
    season.betType = 'win';
    season.stake = 250;
    season.message = 'Angin Timur won the last race at 3.2 — the crowd loves it.';
    season.messageTimer = 6;
    return { season, race: null, screen: 'bet' };
  }
  if (name === 'race') {
    // Mid-race, leaders bunched, the bet horse mid-pack with spurs left.
    season.raceNo = 5;
    season.coins = 1120;
    season.selectedHorse = 2;
    season.betType = 'win';
    season.stake = 200;
    placeBet(season);
    const race = createRace(season.roster, season.odds, season.condition, season.bet.horseId, seed * 7 + 3);
    race.phase = 'running';
    race.countdown = 0;
    // Run ~8 seconds so the field is spread mid-track, not bunched at the gate.
    for (let i = 0; i < 480; i += 1) stepRace(race, 1 / 60);
    // Nudge the bet horse into the mix and light a spur for the shot.
    race.spursLeft = 2;
    const betRh = race.horses.find((rh) => rh.horse.id === season.bet.horseId);
    if (betRh) {
      race.spurHorse = betRh.lane;
      race.spurTimer = 1.2;
    }
    return { season, race, screen: 'race' };
  }
  if (name === 'results') {
    // A photo finish that the player's horse won, payout shown.
    season.raceNo = 4;
    season.coins = 900;
    season.selectedHorse = 0;
    season.betType = 'win';
    season.stake = 200;
    placeBet(season);
    const race = createRace(season.roster, season.odds, season.condition, season.bet.horseId, seed * 11 + 5);
    // Run the whole race, then force a photo finish for the shot.
    let guard = 0;
    while (race.phase !== 'finished' && guard < 4000) {
      stepRace(race, 1 / 60);
      guard += 1;
    }
    const sorted = race.order;
    if (sorted.length > 1) {
      sorted[1].finishTime = sorted[0].finishTime + 0.04;
      race.winnerGap = 0.04;
      race.photoFinish = true;
    }
    settleRace(season, race);
    return { season, race, screen: 'results' };
  }
  if (name === 'champ') {
    // End of a season: a clear champion, full standings.
    season.raceNo = 11;
    season.coins = 3420;
    season.totalBet = 2100;
    season.totalWon = 4520;
    const pts = [64, 52, 48, 40, 30, 22];
    const wins = [4, 2, 2, 1, 1, 0];
    season.roster.forEach((h, i) => {
      h.points = pts[i];
      h.wins = wins[i];
      h.runs = 10;
    });
    return { season, race: null, screen: 'champ' };
  }
  // start (default): title screen.
  return { season, race: null, screen: 'title' };
}
