// Nusantara Derby — race.js
// The race itself: each horse runs the track at a pace set by its stats,
// stamina drains (faster on soft or muddy ground), random surges and
// falters break the pack apart, and the player's spur is a limited burst.
// The simulation is deterministic for a given seed.
import {
  RACE_DISTANCE, MAX_SPURS, SPUR_BOOST, SPUR_SECONDS, SPUR_STAMINA_COST,
  TRACK_CONDITIONS,
} from './config.js';
import { createRandom, range } from './random.js';
import { strength } from './horses.js';

export function createRace(roster, odds, condition, betHorseId, seed) {
  const rng = createRandom(seed);
  const cond = TRACK_CONDITIONS[condition];
  return {
    roster,
    odds,
    condition,
    betHorseId,
    rng,
    // Countdown before the gates open.
    phase: 'countdown', // countdown | running | finished
    countdown: 3.2,
    time: 0,
    spursLeft: MAX_SPURS,
    spurHorse: -1,
    spurTimer: 0,
    photoFinish: false,
    winnerGap: 0,
    order: [],
    horses: roster.map((h, i) => ({
      horse: h,
      lane: i,
      dist: 0,
      stamina: 100,
      speed: 0,
      surge: 0, // >0 surging, <0 faltering; seconds left
      surgeTimer: range(rng, 0.4, 1.2),
      gallop: rng() * Math.PI * 2,
      finished: false,
      finishTime: 0,
      place: 0,
    })),
  };
}

function baseSpeed(horse) {
  return 52 + horse.speed * 2.4;
}

function stepHorse(race, rh, dt) {
  const cond = TRACK_CONDITIONS[race.condition];
  const h = rh.horse;
  // Stamina drains faster on bad ground and for low-stamina horses.
  const drain = cond.drain * (1.15 - h.stamina * 0.06);
  rh.stamina = Math.max(0, rh.stamina - drain * dt);
  // Tired horses slow down hard.
  const tired = rh.stamina < 25 ? 0.55 + rh.stamina / 100 : 1;
  let pace = baseSpeed(h) * tired;
  // Random surge / falter events.
  rh.surgeTimer -= dt;
  if (rh.surgeTimer <= 0) {
    const roll = race.rng();
    const surgeChance = 0.05 + h.burst * 0.008;
    if (roll < surgeChance) {
      rh.surge = range(race.rng, 0.9, 1.4);
    } else if (roll < surgeChance + 0.045) {
      rh.surge = -range(race.rng, 0.8, 1.2);
    }
    rh.surgeTimer = range(race.rng, 0.5, 1.3);
  }
  if (rh.surge > 0) {
    pace *= 1.22;
    rh.surge -= dt;
  } else if (rh.surge < 0) {
    pace *= 0.82;
    rh.surge += dt;
  }
  // The player's spur: a burst of speed for the bet horse.
  if (race.spurHorse === rh.lane && race.spurTimer > 0) {
    pace *= 1 + SPUR_BOOST;
    race.spurTimer -= dt;
    if (race.spurTimer <= 0) race.spurHorse = -1;
  }
  // Small per-frame wobble so the pack never runs in lockstep.
  pace *= 1 + (race.rng() - 0.5) * 0.04;
  rh.speed = pace;
  rh.dist += pace * dt;
  rh.gallop += dt * (7 + pace * 0.06);
  if (rh.dist >= RACE_DISTANCE && !rh.finished) {
    rh.finished = true;
    rh.finishTime = race.time;
    rh.dist = RACE_DISTANCE;
  }
}

export function spur(race) {
  if (race.phase !== 'running' || race.spursLeft <= 0) return false;
  const rh = race.horses.find((x) => x.horse.id === race.betHorseId);
  if (!rh || rh.finished) return false;
  race.spursLeft -= 1;
  race.spurHorse = rh.lane;
  race.spurTimer = SPUR_SECONDS;
  rh.stamina = Math.max(0, rh.stamina - SPUR_STAMINA_COST);
  return true;
}

export function stepRace(race, dt) {
  if (race.phase === 'countdown') {
    race.countdown -= dt;
    if (race.countdown <= 0) race.phase = 'running';
    return;
  }
  if (race.phase !== 'running') return;
  race.time += dt;
  for (const rh of race.horses) {
    if (!rh.finished) stepHorse(race, rh, dt);
  }
  // Live order by distance, then by finish time.
  race.order = race.horses
    .slice()
    .sort((a, b) => (b.dist - a.dist) || (a.finishTime - b.finishTime));
  if (race.horses.every((rh) => rh.finished)) {
    race.phase = 'finished';
    const sorted = race.horses.slice().sort((a, b) => a.finishTime - b.finishTime);
    sorted.forEach((rh, i) => { rh.place = i + 1; });
    race.order = sorted;
    race.winnerGap = sorted.length > 1
      ? (sorted[1].finishTime - sorted[0].finishTime)
      : 0;
    // A photo finish when the top two cross within a nose of each other.
    race.photoFinish = race.winnerGap < 0.12;
  }
}

export function liveOrder(race) {
  return race.order.length ? race.order : race.horses.slice().sort((a, b) => b.dist - a.dist);
}

export function leaderProgress(race) {
  const best = Math.max(...race.horses.map((rh) => rh.dist));
  return best / RACE_DISTANCE;
}

export function strengthOf(horse) {
  return strength(horse);
}
