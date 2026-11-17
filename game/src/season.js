// Nusantara Derby — season.js
// The season: coins, bets, payouts, championship points, the stable shop
// and the end of the season. Every coin here is virtual play money.
import {
  START_COINS, MIN_BET, RACES_PER_SEASON, POINTS, TRACK_NAMES,
} from './config.js';
import { createRandom, pick } from './random.js';
import { makeRoster, makeShop, computeOdds, recordFinish, weakestHorse } from './horses.js';

export function createSeason(seed) {
  const rng = createRandom(seed);
  const roster = makeRoster(seed);
  return {
    seed,
    rng,
    roster,
    shop: makeShop(seed),
    shopSold: [false, false, false],
    coins: START_COINS,
    raceNo: 1,
    trackName: TRACK_NAMES[0],
    condition: 'dry',
    odds: computeOdds(roster),
    // The current bet (set on the bet screen, settled at results).
    bet: null, // { horseId, type: 'win'|'place', stake, odds }
    selectedHorse: 0,
    betType: 'win',
    stake: 100,
    lastResult: null,
    totalWon: 0,
    totalBet: 0,
    message: '',
    messageTimer: 0,
  };
}

export function rollRaceCard(season) {
  // Fresh track + condition + odds for the next race.
  const rng = season.rng;
  season.trackName = TRACK_NAMES[(season.raceNo - 1) % TRACK_NAMES.length];
  season.condition = pick(rng, ['dry', 'dry', 'dry', 'soft', 'soft', 'muddy']);
  season.odds = computeOdds(season.roster);
  season.bet = null;
  season.stake = Math.min(Math.max(season.stake, MIN_BET), Math.max(MIN_BET, season.coins));
  season.selectedHorse = 0;
}

export function stakeOdds(season) {
  const o = season.odds[season.selectedHorse];
  return season.betType === 'win' ? o.win : o.place;
}

export function potentialPayout(season) {
  return Math.round(season.stake * stakeOdds(season));
}

export function placeBet(season) {
  if (season.bet) return false;
  if (season.coins < MIN_BET) return false;
  if (season.stake < MIN_BET || season.stake > season.coins) return false;
  const horse = season.roster[season.selectedHorse];
  season.coins -= season.stake;
  season.totalBet += season.stake;
  season.bet = {
    horseId: horse.id,
    horseName: horse.name,
    type: season.betType,
    stake: season.stake,
    odds: stakeOdds(season),
  };
  return true;
}

export function betHorse(season) {
  if (!season.bet) return null;
  return season.roster.find((h) => h.id === season.bet.horseId) ?? null;
}

// Settle a finished race: points, form, payout and the season rollover.
export function settleRace(season, race) {
  const order = race.order;
  order.forEach((rh, i) => {
    recordFinish(rh.horse, i + 1);
    if (i < POINTS.length) rh.horse.points += POINTS[i];
  });
  let payout = 0;
  let won = false;
  let betPlace = 0;
  if (season.bet) {
    const rh = order.find((x) => x.horse.id === season.bet.horseId);
    betPlace = rh ? rh.place : 0;
    const hit = season.bet.type === 'win' ? betPlace === 1 : betPlace >= 1 && betPlace <= 3;
    if (hit) {
      won = true;
      payout = Math.round(season.bet.stake * season.bet.odds);
      season.coins += payout;
      season.totalWon += payout;
    }
  }
  const result = {
    order: order.map((rh) => ({
      horseId: rh.horse.id,
      name: rh.horse.name,
      coat: rh.horse.coat,
      silk: rh.horse.silk,
      place: rh.place,
      time: rh.finishTime,
    })),
    photoFinish: race.photoFinish,
    winnerGap: race.winnerGap,
    bet: season.bet,
    betPlace,
    won,
    payout,
    coins: season.coins,
    raceNo: season.raceNo,
    trackName: season.trackName,
    condition: season.condition,
  };
  season.lastResult = result;
  return result;
}

export function nextRace(season) {
  season.raceNo += 1;
  if (season.raceNo > RACES_PER_SEASON) return false;
  rollRaceCard(season);
  return true;
}

export function seasonOver(season) {
  return season.raceNo > RACES_PER_SEASON;
}

export function broke(season) {
  return season.coins < MIN_BET;
}

export function standings(season) {
  return season.roster.slice().sort((a, b) => b.points - a.points || b.wins - a.wins);
}

export function champion(season) {
  return standings(season)[0];
}

export function buyHorse(season, shopIndex) {
  if (season.shopSold[shopIndex]) return null;
  const horse = season.shop[shopIndex];
  // Never spend the player below the minimum bet — that would strand them.
  if (!horse || season.coins - horse.price < MIN_BET) return null;
  const outgoing = weakestHorse(season.roster);
  season.coins -= horse.price;
  season.shopSold[shopIndex] = true;
  const idx = season.roster.indexOf(outgoing);
  // The new horse joins with a fresh record and a new id.
  const bought = { ...horse, id: 200 + shopIndex, form: [null, null, null], points: 0, wins: 0, runs: 0 };
  season.roster[idx] = bought;
  season.odds = computeOdds(season.roster);
  season.message = `${bought.name} joined the stable! ${outgoing.name} retired.`;
  season.messageTimer = 6;
  return { bought, outgoing };
}
