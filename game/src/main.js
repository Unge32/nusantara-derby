// Nusantara Derby — main.js
// Boot and the one loop: input is read every frame, the race advances in
// fixed 1/60 s steps, and the renderer paints the current screen. The game
// moves between title, bet, race, results, championship and game over.
//
// ?seed=N fixes the season. ?shot=bet|race|results|champ|start (with
// &seed=N) stages that scene instead of running the loop, paints it twice
// and sets window.__shotReady for a screenshot.
//
// window.__game exposes the live state for tests, plus a small debug API
// (setCoins, setTimeScale) used only by the automated playtest.
import { VIEW_W, VIEW_H, MIN_BET, STAKE_STEP, RACES_PER_SEASON } from './config.js';
import { createSeason, rollRaceCard, placeBet, settleRace, nextRace, broke, buyHorse, potentialPayout } from './season.js';
import { createRace, stepRace, spur } from './race.js';
import { createRenderer } from './render.js';
import { createInput, takePressed, takeClick } from './input.js';
import { sfx, unlockAudio, toggleMute } from './audio.js';
import { stageShot } from './shots.js';

const STEP = 1 / 60;
const MAX_FRAME = 0.25;

const params = new URLSearchParams(window.location.search);
const shot = params.get('shot');
const seedParam = Number.parseInt(params.get('seed') ?? '', 10);
const seed = Number.isInteger(seedParam) ? seedParam : Math.floor(Math.random() * 4294967296);

const canvas = document.getElementById('game');
const status = document.getElementById('status');
const renderer = createRenderer(canvas);
const input = createInput(canvas);

const state = {
  screen: 'title',
  season: createSeason(seed),
  race: null,
  time: 0,
  timeScale: 1,
  paused: false,
  muted: false,
  raceSeed: seed,
};
state.season.message = '';
window.__game = state;
window.__game.debug = {
  setCoins(n) { state.season.coins = n; },
  setTimeScale(n) { state.timeScale = n; },
  setRaceNo(n) { state.season.raceNo = n; },
};

function announce(msg) {
  status.textContent = msg;
}

function startSeason() {
  state.season = createSeason(Math.floor(Math.random() * 4294967296));
  rollRaceCard(state.season);
  state.screen = 'bet';
  announce('Season started. Pick a horse and place your bet.');
}

function beginRace() {
  const season = state.season;
  if (!placeBet(season)) return;
  sfx.bell();
  const raceSeed = season.seed * 31 + season.raceNo * 7919;
  state.race = createRace(season.roster, season.odds, season.condition, season.bet.horseId, raceSeed);
  state.screen = 'race';
  announce(`Race ${season.raceNo} at ${season.trackName}. Your bet: ${season.bet.horseName}.`);
}

function finishRace() {
  const season = state.season;
  const result = settleRace(season, state.race);
  state.screen = 'results';
  if (result.won) {
    sfx.win();
    sfx.cheer();
    announce(`You won ${result.payout} coins on ${result.bet.horseName}!`);
  } else {
    sfx.lose();
    announce(`Race over. ${result.order[0].name} won.`);
  }
}

function advanceAfterResults() {
  const season = state.season;
  if (season.raceNo >= RACES_PER_SEASON) {
    state.screen = 'champ';
    sfx.win();
    return;
  }
  if (broke(season)) {
    state.screen = 'gameover';
    return;
  }
  nextRace(season);
  state.screen = 'bet';
}

function handleClick(click) {
  if (!click) return;
  unlockAudio();
  const btn = state.ui.buttons.find(
    (b) => !b.disabled && click.x >= b.x && click.x <= b.x + b.w && click.y >= b.y && click.y <= b.y + b.h,
  );
  if (btn) {
    handleAction(btn.id);
    return;
  }
  // Tapping the bet horse during a race spurs it.
  if (state.screen === 'race' && state.race && state.race.phase === 'running') {
    const rh = state.race.horses.find((x) => x.horse.id === state.race.betHorseId);
    if (rh) {
      const hx = 70 + (rh.dist / 1200) * 1100;
      const hy = 220 + rh.lane * 70 + 41;
      if (Math.abs(click.x - hx) < 70 && Math.abs(click.y - hy) < 50) {
        if (spur(state.race)) sfx.spur();
      }
    }
  }
}

function handleAction(id) {
  const season = state.season;
  sfx.click();
  if (id === 'start' || id === 'play-again' || id === 'restart') {
    startSeason();
    return;
  }
  if (id === 'resume') {
    state.paused = false;
    return;
  }
  if (id.startsWith('pick-')) {
    season.selectedHorse = Number(id.slice(5));
    return;
  }
  if (id === 'type-win') { season.betType = 'win'; return; }
  if (id === 'type-place') { season.betType = 'place'; return; }
  if (id === 'stake-down') {
    season.stake = Math.max(MIN_BET, season.stake - STAKE_STEP);
    return;
  }
  if (id === 'stake-up') {
    season.stake = Math.min(season.coins, season.stake + STAKE_STEP);
    return;
  }
  if (id.startsWith('chip-')) {
    const amt = Number(id.slice(5));
    if (amt <= season.coins) season.stake = amt;
    return;
  }
  if (id === 'place-bet') {
    beginRace();
    return;
  }
  if (id.startsWith('buy-')) {
    const idx = Number(id.slice(4));
    const res = buyHorse(season, idx);
    if (res) sfx.coin();
    return;
  }
  if (id === 'spur') {
    if (state.race && spur(state.race)) sfx.spur();
    return;
  }
  if (id === 'next-race') {
    advanceAfterResults();
  }
}

function handleKeys(pressed) {
  const season = state.season;
  // Global keys are handled first and never swallow the rest of the batch:
  // two keys landing in one frame must both take effect.
  if (pressed.has('KeyM')) state.muted = toggleMute();
  if (pressed.has('Escape')) {
    if (state.screen === 'race' || state.screen === 'bet') state.paused = !state.paused;
  }
  if (pressed.has('KeyP')) {
    // P pauses a race, but on the bet screen it picks the Place bet type.
    if (state.screen === 'race') state.paused = !state.paused;
    else if (state.screen === 'bet') season.betType = 'place';
  }
  if (state.paused) return;
  if (pressed.has('Space')) {
    if (state.screen === 'title') { startSeason(); return; }
    if (state.screen === 'race' && state.race && spur(state.race)) sfx.spur();
    return;
  }
  if (pressed.has('Enter')) {
    if (state.screen === 'title') startSeason();
    else if (state.screen === 'bet') beginRace();
    else if (state.screen === 'results') advanceAfterResults();
    else if (state.screen === 'champ' || state.screen === 'gameover') startSeason();
    return;
  }
  if (state.screen === 'bet') {
    for (let i = 1; i <= 6; i += 1) {
      if (pressed.has(`Digit${i}`)) season.selectedHorse = i - 1;
    }
    if (pressed.has('KeyW')) season.betType = 'win';
    if (pressed.has('Minus') || pressed.has('NumpadSubtract')) {
      season.stake = Math.max(MIN_BET, season.stake - STAKE_STEP);
    }
    if (pressed.has('Equal') || pressed.has('NumpadAdd')) {
      season.stake = Math.min(season.coins, season.stake + STAKE_STEP);
    }
    if (pressed.has('ArrowUp')) season.selectedHorse = (season.selectedHorse + 5) % 6;
    if (pressed.has('ArrowDown')) season.selectedHorse = (season.selectedHorse + 1) % 6;
  }
}

function runShot(name) {
  const staged = stageShot(name, seed);
  state.season = staged.season;
  state.race = staged.race;
  state.screen = staged.screen;
  let painted = 0;
  function paint() {
    state.ui = { buttons: [], hover: { x: -1, y: -1 } };
    renderer.draw(state, state.ui);
    painted += 1;
    if (painted < 2) requestAnimationFrame(paint);
    else window.__shotReady = true;
  }
  requestAnimationFrame(paint);
}

function runGame() {
  rollRaceCard(state.season);
  // The button list lives on this one object: the renderer clears and
  // refills it every draw, and clicks resolve against last frame's list.
  state.ui = { buttons: [], hover: { x: -1, y: -1 } };
  let accumulator = 0;
  let last = performance.now();
  let hoofTimer = 0;

  function frame(now) {
    requestAnimationFrame(frame);
    const dt = Math.min((now - last) / 1000, MAX_FRAME);
    last = now;
    state.time += dt;
    state.ui.hover.x = input.pointer.x;
    state.ui.hover.y = input.pointer.y;

    const pressed = takePressed(input);
    handleKeys(pressed);
    handleClick(takeClick(input));

    if (!state.paused && state.screen === 'race' && state.race) {
      const scaled = dt * state.timeScale;
      accumulator += scaled;
      while (accumulator >= STEP) {
        stepRace(state.race, STEP);
        accumulator -= STEP;
      }
      if (state.race.phase === 'running') {
        hoofTimer -= dt;
        if (hoofTimer <= 0) {
          sfx.hoof();
          hoofTimer = 0.42;
        }
      }
      if (state.race.phase === 'finished') finishRace();
    }
    if (state.season.messageTimer > 0) state.season.messageTimer -= dt;

    renderer.draw(state, state.ui);
  }

  announce('Nusantara Derby. Press Space or click to start.');
  requestAnimationFrame(frame);
}

if (shot) runShot(shot);
else runGame();
