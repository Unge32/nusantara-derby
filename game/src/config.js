// Nusantara Derby — config.js
// One place for every number and data table: canvas size, race rules,
// horse names, tracks, shop horses, colours. All betting is play money
// (virtual coins only) — no real money, no crypto, no wallet, no payout.
export const VIEW_W = 1280;
export const VIEW_H = 720;

export const START_COINS = 1000;
export const MIN_BET = 50;
export const STAKE_STEP = 50;
export const RACES_PER_SEASON = 10;
export const RACE_DISTANCE = 1200; // metres of track
export const MAX_SPURS = 3;
export const SPUR_BOOST = 0.32; // +32% speed while spurring
export const SPUR_SECONDS = 1.5;
export const SPUR_STAMINA_COST = 6;

export const POINTS = [10, 6, 4]; // 1st, 2nd, 3rd

export const TRACK_CONDITIONS = {
  dry: { name: 'Dry', drain: 2.2, note: 'Fast track — stamina lasts' },
  soft: { name: 'Soft', drain: 2.6, note: 'Slower ground — stamina drains faster' },
  muddy: { name: 'Muddy', drain: 3.0, note: 'Heavy going — stamina drains much faster' },
};

export const TRACK_NAMES = [
  'Gelora Senayan', 'Pantai Parangtritis', 'Lembah Dieng', 'Danau Toba',
  'Sawah Ubud', 'Kawah Ijen', 'Bukit Bromo', 'Pantai Kuta',
  'Hutan Kalimantan', 'Puncak Jaya',
];

// Six-horse starting roster. Stats are 1..10. coat = horse colour,
// silk = jockey colour, form = last 3 finishes (1 = won, null = unraced).
export const ROSTER = [
  { name: 'Kilau Senja', coat: '#8a5a2b', silk: '#e63946', speed: 8, stamina: 7, burst: 6 },
  { name: 'Angin Timur', coat: '#3d3d3d', silk: '#2a9d8f', speed: 9, stamina: 6, burst: 7 },
  { name: 'Bara Api', coat: '#a83226', silk: '#f4a261', speed: 7, stamina: 8, burst: 8 },
  { name: 'Pelangi', coat: '#d9d9d9', silk: '#7b2fbe', speed: 8, stamina: 8, burst: 5 },
  { name: 'Guntur', coat: '#5b3a1e', silk: '#f1c40f', speed: 9, stamina: 5, burst: 9 },
  { name: 'Srikandi', coat: '#c98a4b', silk: '#118ab2', speed: 6, stamina: 9, burst: 6 },
];

// Horses that can be bought between races. Buying one replaces the
// lowest-rated horse in the roster.
export const SHOP_HORSES = [
  { name: 'Bayu Samudra', coat: '#2b2d42', silk: '#06d6a0', speed: 9, stamina: 8, burst: 8, price: 800 },
  { name: 'Cahaya Fajar', coat: '#e8c468', silk: '#ef476f', speed: 10, stamina: 7, burst: 8, price: 1500 },
  { name: 'Naga Kecil', coat: '#1d3557', silk: '#ffd166', speed: 10, stamina: 9, burst: 9, price: 2600 },
];

export const FORM_LABELS = { 1: 'W', 2: 'P', 3: 'S' };

export const COLORS = {
  skyTop: '#2b1055',
  skyMid: '#7597de',
  skyLow: '#ff9a5a',
  grass: '#4c9a2a',
  grassDark: '#3d7d22',
  dirt: '#b98a4e',
  dirtDark: '#a67c3d',
  laneLine: 'rgba(255,255,255,0.55)',
  panel: '#1d2b53',
  panelEdge: '#4a5d8f',
  gold: '#ffd166',
  cream: '#fff3d6',
  ink: '#14213d',
  red: '#ef476f',
  green: '#06d6a0',
  blue: '#118ab2',
};
