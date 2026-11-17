// Nusantara Derby — horses.js
// The roster, its strength model and the odds book. Odds come from stats
// and recent form only; nothing here touches real money.
import { ROSTER, SHOP_HORSES } from './config.js';
import { createRandom, shuffle } from './random.js';

export function makeHorse(def, id) {
  return {
    id,
    name: def.name,
    coat: def.coat,
    silk: def.silk,
    speed: def.speed,
    stamina: def.stamina,
    burst: def.burst,
    price: def.price ?? 0,
    form: [null, null, null], // last 3 finishes, newest last; 1 = won
    points: 0,
    wins: 0,
    runs: 0,
  };
}

export function makeRoster(seed) {
  const rng = createRandom(seed);
  const defs = shuffle(rng, ROSTER);
  return defs.map((d, i) => makeHorse(d, i));
}

export function makeShop(seed) {
  const rng = createRandom(seed ^ 0x5f0f);
  return SHOP_HORSES.map((d, i) => makeHorse(d, 100 + i));
}

export function formBonus(horse) {
  // Recent form nudges strength: a win is worth more than a place.
  let score = 0;
  let count = 0;
  for (const f of horse.form) {
    if (f === 1) { score += 3; count += 1; }
    else if (f === 2) { score += 2; count += 1; }
    else if (f === 3) { score += 1; count += 1; }
  }
  if (count === 0) return 0;
  return (score / count - 1) * 0.3;
}

export function strength(horse) {
  return horse.speed * 0.55 + horse.stamina * 0.25 + horse.burst * 0.2 + formBonus(horse);
}

export function computeOdds(roster) {
  // Implied probability from strength cubed, with a bookmaker margin,
  // clamped to a sane board. Win odds rounded to 1 decimal; Place pays
  // roughly 40% of the win margin, never below 1.2.
  const powers = roster.map((h) => Math.pow(Math.max(strength(h), 0.5), 3));
  const total = powers.reduce((a, b) => a + b, 0);
  return roster.map((h, i) => {
    const prob = powers[i] / total;
    const win = Math.min(12, Math.max(1.5, (1 / prob) * 0.85));
    const place = Math.max(1.2, 1 + (win - 1) * 0.4);
    return {
      win: Math.round(win * 10) / 10,
      place: Math.round(place * 10) / 10,
    };
  });
}

export function recordFinish(horse, position) {
  horse.form.push(position);
  if (horse.form.length > 3) horse.form.shift();
  horse.runs += 1;
  if (position === 1) horse.wins += 1;
}

export function weakestHorse(roster) {
  let worst = roster[0];
  for (const h of roster) {
    if (strength(h) < strength(worst)) worst = h;
  }
  return worst;
}
