// Nusantara Derby — render.js (part 1)
// Every pixel the player sees: title, bet card, race track, results,
// championship and game over. Buttons are registered into `ui.buttons`
// each frame so the main loop can resolve clicks by id.
import { VIEW_W, VIEW_H, COLORS, TRACK_CONDITIONS, RACES_PER_SEASON, MIN_BET, RACE_DISTANCE } from './config.js';
import { liveOrder, leaderProgress } from './race.js';

export function createRenderer(canvas) {
  const ctx = canvas.getContext('2d');
  let fx = { race: null, dust: [], clouds: [] };
  for (let i = 0; i < 7; i += 1) {
    fx.clouds.push({ x: (i * 197) % VIEW_W, y: 30 + (i * 37) % 90, s: 0.6 + ((i * 13) % 10) / 14, v: 4 + (i % 3) * 3 });
  }

  function rr(x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  function text(str, x, y, size, color, weight = 'bold', align = 'left') {
    ctx.fillStyle = color;
    ctx.font = `${weight} ${size}px system-ui, -apple-system, sans-serif`;
    ctx.textAlign = align;
    ctx.textBaseline = 'middle';
    ctx.fillText(str, x, y);
  }

  function button(ui, id, x, y, w, h, label, opts = {}) {
    const hovered = ui.hover.x >= x && ui.hover.x <= x + w && ui.hover.y >= y && ui.hover.y <= y + h;
    const disabled = opts.disabled === true;
    ui.buttons.push({ x, y, w, h, id, disabled });
    ctx.fillStyle = disabled ? '#5a6478' : hovered ? (opts.hot ?? '#ffd166') : (opts.bg ?? '#2a9d8f');
    rr(x, y, w, h, 10);
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = hovered && !disabled ? '#fff3d6' : 'rgba(0,0,0,0.35)';
    ctx.stroke();
    text(label, x + w / 2, y + h / 2 + 1, opts.size ?? 20, disabled ? '#c9ced6' : (opts.fg ?? '#14213d'), 'bold', 'center');
    return hovered && !disabled;
  }

  function statBar(x, y, w, value, color) {
    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    rr(x, y, w, 10, 5);
    ctx.fill();
    ctx.fillStyle = color;
    rr(x, y, Math.max(10, (w * value) / 10), 10, 5);
    ctx.fill();
  }

  function coinsChip(x, y, coins, align = 'left') {
    ctx.fillStyle = '#14213d';
    rr(x - 8, y - 16, 150, 32, 16);
    ctx.fill();
    ctx.fillStyle = COLORS.gold;
    ctx.beginPath();
    ctx.arc(x + 8, y, 9, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#7a5c00';
    ctx.font = 'bold 13px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('¢', x + 8, y + 1);
    text(`${coins} coins`, x + 26, y, 16, '#fff3d6', 'bold', align);
  }

  function header(ui, season, rightText) {
    ctx.fillStyle = '#14213d';
    ctx.fillRect(0, 0, VIEW_W, 56);
    ctx.fillStyle = COLORS.gold;
    ctx.fillRect(0, 56, VIEW_W, 3);
    text('NUSANTARA DERBY', 24, 29, 24, COLORS.gold, 'bold');
    text(`Race ${Math.min(season.raceNo, RACES_PER_SEASON)}/${RACES_PER_SEASON}  •  ${season.trackName}  •  ${TRACK_CONDITIONS[season.condition].name}`, 300, 30, 16, '#fff3d6');
    if (rightText) text(rightText, VIEW_W - 190, 30, 16, '#fff3d6', 'bold', 'right');
    coinsChip(VIEW_W - 170, 29, season.coins);
  }

  // ---- TITLE ----
  function drawTitle(ui, state) {
    const g = ctx.createLinearGradient(0, 0, 0, VIEW_H);
    g.addColorStop(0, COLORS.skyTop);
    g.addColorStop(0.55, '#7b2fbe');
    g.addColorStop(1, '#ff9a5a');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, VIEW_W, VIEW_H);
    // Sun.
    ctx.fillStyle = '#ffd166';
    ctx.beginPath();
    ctx.arc(1060, 130, 62, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,209,102,0.25)';
    ctx.beginPath();
    ctx.arc(1060, 130, 92, 0, Math.PI * 2);
    ctx.fill();
    // Ground + silhouettes of horses on the horizon.
    ctx.fillStyle = '#1d2b53';
    ctx.fillRect(0, 520, VIEW_W, 200);
    ctx.fillStyle = '#2a3a6b';
    for (let i = 0; i < 5; i += 1) {
      const x = 120 + i * 240;
      drawHorse(x, 540, 1.15, { coat: '#101736', silk: '#101736' }, 0.6 + i, i + 1, true);
    }
    text('NUSANTARA', 640, 150, 84, COLORS.gold, 'bold', 'center');
    text('DERBY', 640, 240, 84, '#fff3d6', 'bold', 'center');
    text('Horse racing festival  •  Bet play coins  •  Win the championship', 640, 310, 22, '#fff3d6', 'normal', 'center');
    // How to play box.
    ctx.fillStyle = 'rgba(20,33,61,0.85)';
    rr(340, 350, 600, 150, 14);
    ctx.fill();
    text('HOW TO PLAY', 640, 378, 18, COLORS.gold, 'bold', 'center');
    text('1. Pick a horse from the race card — check speed, stamina, form and odds.', 640, 408, 16, '#fff3d6', 'normal', 'center');
    text('2. Choose Win (1st place) or Place (top 3), set your stake, place the bet.', 640, 434, 16, '#fff3d6', 'normal', 'center');
    text('3. During the race, press SPACE or tap your horse to spur it (3 spurs).', 640, 460, 16, '#fff3d6', 'normal', 'center');
    text('4. Survive 10 races — the horse with the most points is champion.', 640, 486, 16, '#fff3d6', 'normal', 'center');
    button(ui, 'start', 490, 530, 300, 58, 'START SEASON', { size: 24, bg: COLORS.gold });
    text('Play money only — virtual coins, no real money, no crypto.', 640, 622, 15, 'rgba(255,243,214,0.8)', 'normal', 'center');
    text('Best with sound on.  Keys: 1-6 pick a horse, W/P bet type, +/- stake, Enter confirm.', 640, 648, 14, 'rgba(255,243,214,0.6)', 'normal', 'center');
  }

  // ---- HORSE ----
  // A stylised galloping horse, drawn facing right. `phase` drives the legs.
  function drawHorse(x, y, scale, horse, phase, number, silhouette = false) {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(scale, scale);
    const coat = silhouette ? '#101736' : horse.coat;
    const dark = shade(coat, -28);
    const light = shade(coat, 26);
    // Ground shadow.
    ctx.fillStyle = 'rgba(0,0,0,0.25)';
    ctx.beginPath();
    ctx.ellipse(0, 26, 38, 6, 0, 0, Math.PI * 2);
    ctx.fill();
    // Legs (gallop cycle).
    const legSwing = [0, Math.PI, Math.PI * 0.5, Math.PI * 1.5];
    ctx.strokeStyle = dark;
    ctx.lineWidth = 6;
    ctx.lineCap = 'round';
    for (let i = 0; i < 4; i += 1) {
      const lx = -24 + i * 16;
      const sw = Math.sin(phase * 2 + legSwing[i]) * 14;
      const lift = Math.max(0, Math.cos(phase * 2 + legSwing[i])) * 10;
      ctx.beginPath();
      ctx.moveTo(lx, 8);
      ctx.lineTo(lx + sw, 26 - lift);
      ctx.stroke();
    }
    // Tail (flows behind, animated).
    ctx.strokeStyle = dark;
    ctx.lineWidth = 7;
    ctx.beginPath();
    ctx.moveTo(-34, -6);
    ctx.quadraticCurveTo(-52, 2 + Math.sin(phase * 2) * 4, -56, 16 + Math.sin(phase * 2 + 1) * 5);
    ctx.stroke();
    // Body.
    ctx.fillStyle = coat;
    ctx.beginPath();
    ctx.ellipse(0, -2, 36, 17, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = light;
    ctx.beginPath();
    ctx.ellipse(2, 3, 28, 10, 0, 0, Math.PI * 2);
    ctx.fill();
    // Neck + head.
    ctx.fillStyle = coat;
    ctx.beginPath();
    ctx.ellipse(28, -18, 11, 16, 0.6, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(42, -30, 13, 8, 0.35, 0, Math.PI * 2);
    ctx.fill();
    // Ear.
    ctx.beginPath();
    ctx.moveTo(34, -36);
    ctx.lineTo(38, -46);
    ctx.lineTo(42, -36);
    ctx.closePath();
    ctx.fill();
    // Mane.
    ctx.strokeStyle = dark;
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(20, -30);
    ctx.quadraticCurveTo(28, -22, 30, -8);
    ctx.stroke();
    // Eye.
    if (!silhouette) {
      ctx.fillStyle = '#141414';
      ctx.beginPath();
      ctx.arc(45, -31, 2.2, 0, Math.PI * 2);
      ctx.fill();
    }
    if (!silhouette) {
      // Saddle cloth with number.
      ctx.fillStyle = horse.silk;
      rr(-14, -16, 30, 18, 5);
      ctx.fill();
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 13px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(String(number), 1, -6);
      // Jockey: torso, helmet, arm.
      ctx.fillStyle = horse.silk;
      ctx.beginPath();
      ctx.ellipse(2, -30, 8, 12, 0.15, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = shade(horse.silk, -40);
      ctx.beginPath();
      ctx.arc(6, -42, 6.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#e8b98a';
      ctx.beginPath();
      ctx.arc(7, -40, 4.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#e8b98a';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(8, -30);
      ctx.lineTo(24, -22);
      ctx.stroke();
    }
    ctx.restore();
  }

  function shade(hex, amt) {
    const n = parseInt(hex.slice(1), 16);
    const r = Math.max(0, Math.min(255, (n >> 16) + amt));
    const g = Math.max(0, Math.min(255, ((n >> 8) & 255) + amt));
    const b = Math.max(0, Math.min(255, (n & 255) + amt));
    return `rgb(${r},${g},${b})`;
  }

  // ---- BET SCREEN ----
  function drawBet(ui, state) {
    const season = state.season;
    const g = ctx.createLinearGradient(0, 0, 0, VIEW_H);
    g.addColorStop(0, '#1d2b53');
    g.addColorStop(1, '#0f1b33');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, VIEW_W, VIEW_H);
    header(ui, season, `Track: ${TRACK_CONDITIONS[season.condition].note}`);
    // Race card (left).
    ctx.fillStyle = 'rgba(255,243,214,0.06)';
    rr(24, 72, 740, 480, 12);
    ctx.fill();
    text('RACE CARD', 44, 96, 18, COLORS.gold);
    text('Click a row to pick your horse  •  1-6 keys work too', 44, 120, 13, 'rgba(255,243,214,0.7)', 'normal');
    const rowY = 134;
    const rowH = 66;
    season.roster.forEach((horse, i) => {
      const y = rowY + i * rowH;
      const selected = season.selectedHorse === i;
      const o = season.odds[i];
      if (selected) {
        ctx.fillStyle = 'rgba(255,209,102,0.16)';
        rr(32, y, 724, rowH - 6, 10);
        ctx.fill();
        ctx.strokeStyle = COLORS.gold;
        ctx.lineWidth = 2;
        rr(32, y, 724, rowH - 6, 10);
        ctx.stroke();
      } else if (ui.hover.x >= 32 && ui.hover.x <= 756 && ui.hover.y >= y && ui.hover.y <= y + rowH - 6) {
        ctx.fillStyle = 'rgba(255,255,255,0.06)';
        rr(32, y, 724, rowH - 6, 10);
        ctx.fill();
      }
      ui.buttons.push({ x: 32, y, w: 724, h: rowH - 6, id: `pick-${i}` });
      // Number + colour swatch.
      ctx.fillStyle = horse.silk;
      ctx.beginPath();
      ctx.arc(58, y + 30, 16, 0, Math.PI * 2);
      ctx.fill();
      text(String(i + 1), 58, y + 31, 16, '#fff', 'bold', 'center');
      // Name + form.
      text(horse.name, 84, y + 20, 19, selected ? COLORS.gold : '#fff3d6');
      const formStr = horse.form.map((f) => (f ? ['W', 'P', 'S'][f - 1] : '-')).join(' ');
      text(`Form ${formStr}   •   ${horse.wins}W / ${horse.runs} runs   •   ${horse.points} pts`, 84, y + 44, 13, 'rgba(255,243,214,0.75)', 'normal');
      // Stat bars.
      const bx = 330;
      text('SPD', bx, y + 16, 11, '#fff3d6');
      statBar(bx + 34, y + 11, 90, horse.speed, '#ef476f');
      text('STA', bx, y + 32, 11, '#fff3d6');
      statBar(bx + 34, y + 27, 90, horse.stamina, '#06d6a0');
      text('BUR', bx, y + 48, 11, '#fff3d6');
      statBar(bx + 34, y + 43, 90, horse.burst, '#ffd166');
      // Odds.
      text('WIN', 500, y + 16, 11, '#fff3d6', 'bold', 'center');
      text(o.win.toFixed(1), 500, y + 38, 22, '#fff', 'bold', 'center');
      text('PLACE', 590, y + 16, 11, '#fff3d6', 'bold', 'center');
      text(o.place.toFixed(1), 590, y + 38, 22, '#fff', 'bold', 'center');
      if (selected) text('YOUR PICK', 740, y + 30, 13, COLORS.gold, 'bold', 'right');
    });
    // Shop (right top).
    ctx.fillStyle = 'rgba(255,243,214,0.06)';
    rr(788, 72, 468, 218, 12);
    ctx.fill();
    text('STABLE SHOP — buy a faster horse', 808, 96, 16, COLORS.gold);
    text('Replaces your weakest horse. Between races only.', 808, 118, 12, 'rgba(255,243,214,0.7)', 'normal');
    season.shop.forEach((horse, i) => {
      const y = 132 + i * 52;
      const sold = season.shopSold[i];
      const afford = season.coins - horse.price >= MIN_BET;
      ctx.fillStyle = horse.silk;
      ctx.beginPath();
      ctx.arc(812, y + 18, 11, 0, Math.PI * 2);
      ctx.fill();
      text(horse.name, 832, y + 12, 15, sold ? '#8a93a8' : '#fff3d6');
      text(`SPD ${horse.speed}  STA ${horse.stamina}  BUR ${horse.burst}`, 832, y + 32, 12, 'rgba(255,243,214,0.7)', 'normal');
      if (sold) {
        text('SOLD', 1180, y + 18, 14, '#8a93a8', 'bold', 'center');
      } else {
        button(ui, `buy-${i}`, 1100, y + 2, 128, 32, `${horse.price} coins`, { size: 14, bg: afford ? COLORS.gold : '#5a6478', disabled: !afford });
      }
    });
    // Bet panel (right bottom).
    ctx.fillStyle = 'rgba(255,243,214,0.06)';
    rr(788, 306, 468, 246, 12);
    ctx.fill();
    text('YOUR BET', 808, 330, 16, COLORS.gold);
    const pick = season.roster[season.selectedHorse];
    text(`Horse: ${pick.name}`, 808, 358, 17, '#fff3d6');
    // Type toggle.
    button(ui, 'type-win', 808, 374, 110, 36, 'WIN', { size: 16, bg: season.betType === 'win' ? COLORS.gold : '#3a4a6b', fg: season.betType === 'win' ? '#14213d' : '#fff3d6' });
    button(ui, 'type-place', 928, 374, 110, 36, 'PLACE', { size: 16, bg: season.betType === 'place' ? COLORS.gold : '#3a4a6b', fg: season.betType === 'place' ? '#14213d' : '#fff3d6' });
    text(season.betType === 'win' ? 'Pays if 1st' : 'Pays if top 3', 1050, 392, 13, 'rgba(255,243,214,0.75)', 'normal');
    // Stake.
    text('Stake', 808, 438, 15, '#fff3d6');
    button(ui, 'stake-down', 808, 452, 44, 36, '−', { size: 20, bg: '#3a4a6b', fg: '#fff3d6', disabled: season.stake <= MIN_BET });
    text(`${season.stake}`, 880, 470, 22, '#fff', 'bold', 'center');
    button(ui, 'stake-up', 916, 452, 44, 36, '+', { size: 20, bg: '#3a4a6b', fg: '#fff3d6', disabled: season.stake >= season.coins });
    [50, 100, 250, 500].forEach((amt, i) => {
      button(ui, `chip-${amt}`, 972 + i * 68, 452, 60, 36, String(amt), { size: 14, bg: season.stake === amt ? COLORS.gold : '#3a4a6b', fg: season.stake === amt ? '#14213d' : '#fff3d6', disabled: amt > season.coins });
    });
    const oddsNow = season.odds[season.selectedHorse][season.betType];
    text(`Odds ${oddsNow.toFixed(1)}  →  pays ${Math.round(season.stake * oddsNow)} if it hits`, 808, 508, 15, COLORS.gold);
    button(ui, 'place-bet', 808, 516, 428, 40, 'PLACE BET & START RACE', { size: 18, bg: COLORS.gold, disabled: season.coins < MIN_BET });
    // Bottom strip: standings + message.
    ctx.fillStyle = '#14213d';
    ctx.fillRect(0, 576, VIEW_W, 144);
    ctx.fillStyle = COLORS.gold;
    ctx.fillRect(0, 576, VIEW_W, 3);
    const top = season.roster.slice().sort((a, b) => b.points - a.points).slice(0, 3);
    text('CHAMPIONSHIP', 24, 606, 15, COLORS.gold);
    top.forEach((h, i) => {
      text(`${i + 1}. ${h.name} — ${h.points} pts`, 24, 634 + i * 22, 15, '#fff3d6', 'normal');
    });
    text('Track condition affects stamina: Muddy ground tires horses fast.', 24, 700, 13, 'rgba(255,243,214,0.7)', 'normal');
    if (season.message && season.messageTimer > 0) {
      text(season.message, 640, 620, 17, COLORS.gold, 'bold', 'center');
    }
    text('Keys: 1-6 horse • W win • P place • +/- stake • Enter place bet', 640, 700, 13, 'rgba(255,243,214,0.7)', 'normal', 'center');
  }

  // ---- RACE ----
  function drawRace(ui, state) {
    const race = state.race;
    const season = state.season;
    const t = state.time;
    // Sky.
    const g = ctx.createLinearGradient(0, 0, 0, 220);
    g.addColorStop(0, COLORS.skyTop);
    g.addColorStop(0.6, COLORS.skyMid);
    g.addColorStop(1, COLORS.skyLow);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, VIEW_W, 220);
    // Sun (kept clear of the live-order panel on the right).
    ctx.fillStyle = '#ffd166';
    ctx.beginPath();
    ctx.arc(720, 60, 34, 0, Math.PI * 2);
    ctx.fill();
    // Clouds drift.
    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    for (const c of fx.clouds) {
      const cx = ((c.x + t * c.v) % (VIEW_W + 160)) - 80;
      ctx.beginPath();
      ctx.ellipse(cx, c.y, 42 * c.s, 14 * c.s, 0, 0, Math.PI * 2);
      ctx.ellipse(cx + 26 * c.s, c.y + 4, 30 * c.s, 11 * c.s, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    // Mountains.
    ctx.fillStyle = '#5b4a8a';
    ctx.beginPath();
    ctx.moveTo(0, 220);
    ctx.lineTo(140, 130);
    ctx.lineTo(300, 220);
    ctx.lineTo(470, 110);
    ctx.lineTo(660, 220);
    ctx.lineTo(860, 140);
    ctx.lineTo(1040, 220);
    ctx.lineTo(1280, 150);
    ctx.lineTo(1280, 220);
    ctx.closePath();
    ctx.fill();
    // Grandstand with crowd.
    ctx.fillStyle = '#2a3a6b';
    ctx.fillRect(880, 96, 400, 124);
    for (let r = 0; r < 4; r += 1) {
      for (let c = 0; c < 22; c += 1) {
        const bounce = race.phase === 'running' && ((r * 22 + c + Math.floor(t * 3)) % 7 === 0) ? -3 : 0;
        ctx.fillStyle = ['#ef476f', '#ffd166', '#06d6a0', '#118ab2', '#fff3d6'][(r * 22 + c) % 5];
        ctx.fillRect(892 + c * 17, 108 + r * 26 + bounce, 8, 8);
      }
    }
    // Trees on the left.
    ctx.fillStyle = '#2d6a2e';
    for (let i = 0; i < 6; i += 1) {
      const tx = 30 + i * 62;
      ctx.beginPath();
      ctx.moveTo(tx, 220);
      ctx.lineTo(tx + 22, 150 - (i % 2) * 18);
      ctx.lineTo(tx + 44, 220);
      ctx.closePath();
      ctx.fill();
    }
    // Track.
    const trackTop = 220;
    const trackBottom = 640;
    const laneH = (trackBottom - trackTop) / 6;
    ctx.fillStyle = COLORS.grass;
    ctx.fillRect(0, trackTop - 14, VIEW_W, 14);
    ctx.fillRect(0, trackBottom, VIEW_W, VIEW_H - trackBottom);
    ctx.fillStyle = COLORS.dirt;
    ctx.fillRect(0, trackTop, VIEW_W, trackBottom - trackTop);
    // Lane lines.
    ctx.strokeStyle = COLORS.laneLine;
    ctx.lineWidth = 2;
    ctx.setLineDash([14, 10]);
    for (let i = 1; i < 6; i += 1) {
      const y = trackTop + i * laneH;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(VIEW_W, y);
      ctx.stroke();
    }
    ctx.setLineDash([]);
    // Lane numbers on the left.
    for (let i = 0; i < 6; i += 1) {
      const y = trackTop + i * laneH + laneH / 2;
      ctx.fillStyle = 'rgba(20,33,61,0.6)';
      ctx.beginPath();
      ctx.arc(26, y, 13, 0, Math.PI * 2);
      ctx.fill();
      text(String(i + 1), 26, y + 1, 14, '#fff', 'bold', 'center');
    }
    // Finish line (checkered post).
    const fx0 = 1180;
    ctx.fillStyle = '#fff';
    ctx.fillRect(fx0 - 4, trackTop, 8, trackBottom - trackTop);
    for (let r = 0; r < 14; r += 1) {
      for (let c = 0; c < 2; c += 1) {
        if ((r + c) % 2 === 0) {
          ctx.fillStyle = '#14213d';
          ctx.fillRect(fx0 - 12 + c * 8, trackTop + r * 30, 8, 30);
        }
      }
    }
    // Dust particles behind running horses (deterministic LCG, so staged
    // screenshots are byte-identical across runs).
    if (fx.race !== race) {
      fx.race = race;
      fx.dust = [];
      let s = 1234567;
      fx.dustRand = () => (s = (s * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff;
    }
    if (race.phase === 'running') {
      for (const rh of race.horses) {
        if (rh.finished) continue;
        if (fx.dustRand() < 0.35) {
          fx.dust.push({ x: raceX(rh.dist) - 30, y: laneY(rh.lane) + 18, life: 0.7, max: 0.7, r: 3 + fx.dustRand() * 4 });
        }
      }
    }
    fx.dust = fx.dust.filter((d) => (d.life -= 0.016) > 0);
    for (const d of fx.dust) {
      ctx.fillStyle = `rgba(210,180,140,${(d.life / d.max) * 0.5})`;
      ctx.beginPath();
      ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2);
      ctx.fill();
    }
    // Horses (drawn back to front so leaders overlap).
    const sorted = race.horses.slice().sort((a, b) => a.dist - b.dist);
    for (const rh of sorted) {
      const x = raceX(rh.dist);
      const y = laneY(rh.lane);
      const isBet = rh.horse.id === race.betHorseId;
      if (isBet && race.phase === 'running') {
        // Gold ring under the bet horse.
        ctx.strokeStyle = COLORS.gold;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.ellipse(x, y + 28, 46, 10, 0, 0, Math.PI * 2);
        ctx.stroke();
      }
      drawHorse(x, y, 0.95, rh.horse, rh.gallop, rh.lane + 1);
      // Place badge above the horse's head (clear of the lane above).
      const place = liveOrder(race).indexOf(rh) + 1;
      ctx.fillStyle = isBet ? COLORS.gold : 'rgba(20,33,61,0.85)';
      ctx.beginPath();
      ctx.arc(x + 50, y - 36, 12, 0, Math.PI * 2);
      ctx.fill();
      text(String(place), x + 50, y - 35, 13, isBet ? '#14213d' : '#fff', 'bold', 'center');
      // Spur flash.
      if (race.spurHorse === rh.lane && race.spurTimer > 0) {
        ctx.strokeStyle = 'rgba(255,209,102,0.9)';
        ctx.lineWidth = 3;
        for (let k = 0; k < 3; k += 1) {
          const a = t * 12 + k * 2.1;
          ctx.beginPath();
          ctx.moveTo(x + Math.cos(a) * 52, y - 10 + Math.sin(a) * 30);
          ctx.lineTo(x + Math.cos(a) * 62, y - 10 + Math.sin(a) * 38);
          ctx.stroke();
        }
      }
    }
    // Top HUD bar.
    ctx.fillStyle = 'rgba(20,33,61,0.92)';
    ctx.fillRect(0, 0, VIEW_W, 48);
    text(`${season.trackName}  •  ${TRACK_CONDITIONS[season.condition].name}  •  Race ${season.raceNo}/${RACES_PER_SEASON}`, 20, 25, 16, '#fff3d6');
    const bet = season.bet;
    if (bet) text(`Your bet: ${bet.horseName} — ${bet.type.toUpperCase()} ${bet.stake} @ ${bet.odds.toFixed(1)}`, 640, 25, 16, COLORS.gold, 'bold', 'center');
    coinsChip(VIEW_W - 170, 25, season.coins);
    // Progress bar (opaque backing so clouds never show through).
    const prog = leaderProgress(race);
    ctx.fillStyle = '#14213d';
    rr(20, 56, 500, 12, 6);
    ctx.fill();
    ctx.fillStyle = COLORS.gold;
    rr(20, 56, Math.max(12, 500 * prog), 12, 6);
    ctx.fill();
    ctx.fillStyle = '#14213d';
    rr(528, 52, 130, 20, 10);
    ctx.fill();
    text(`${Math.round(prog * 100)}%  •  ${race.time.toFixed(1)}s`, 593, 63, 13, '#fff3d6', 'normal', 'center');
    // Live order strip (top right).
    const order = liveOrder(race);
    ctx.fillStyle = 'rgba(20,33,61,0.85)';
    rr(1010, 56, 250, 24 + order.length * 20, 10);
    ctx.fill();
    text('LIVE ORDER', 1022, 70, 12, COLORS.gold, 'bold');
    order.forEach((rh, i) => {
      const y = 86 + i * 20;
      ctx.fillStyle = rh.horse.silk;
      ctx.beginPath();
      ctx.arc(1026, y, 6, 0, Math.PI * 2);
      ctx.fill();
      text(`${i + 1}. ${rh.horse.name}`, 1040, y, 13, rh.horse.id === race.betHorseId ? COLORS.gold : '#fff3d6', 'bold');
    });
    // Spur button (bottom right) + countdown.
    if (race.phase === 'running') {
      button(ui, 'spur', 1050, 650, 210, 48, `SPUR (${race.spursLeft})  [SPACE]`, { size: 17, bg: race.spursLeft > 0 ? COLORS.gold : '#5a6478', disabled: race.spursLeft <= 0 });
      text('Tap your horse or press SPACE for a burst of speed.', 640, 678, 14, '#fff3d6', 'normal', 'center');
    }
    if (race.phase === 'countdown') {
      const n = Math.ceil(race.countdown);
      ctx.fillStyle = 'rgba(20,33,61,0.55)';
      ctx.fillRect(0, 0, VIEW_W, VIEW_H);
      text(n > 0 ? String(n) : 'GO!', 640, 360, 120, COLORS.gold, 'bold', 'center');
      text('Get ready…', 640, 460, 22, '#fff3d6', 'normal', 'center');
    }
    function raceX(dist) {
      return 70 + (dist / RACE_DISTANCE) * 1100;
    }
    function laneY(lane) {
      return trackTop + lane * laneH + laneH / 2 + 6;
    }
  }

  // ---- RESULTS ----
  function drawResults(ui, state) {
    const result = state.season.lastResult;
    const season = state.season;
    const g = ctx.createLinearGradient(0, 0, 0, VIEW_H);
    g.addColorStop(0, '#1d2b53');
    g.addColorStop(1, '#0f1b33');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, VIEW_W, VIEW_H);
    header(ui, season, `Race ${result.raceNo} finished`);
    text(`RESULTS — ${result.trackName}`, 640, 100, 30, COLORS.gold, 'bold', 'center');
    if (result.photoFinish) {
      ctx.fillStyle = '#ef476f';
      rr(440, 122, 400, 40, 20);
      ctx.fill();
      text(`PHOTO FINISH!  Gap ${result.winnerGap.toFixed(3)}s`, 640, 143, 20, '#fff', 'bold', 'center');
    }
    // Finishing order.
    ctx.fillStyle = 'rgba(255,243,214,0.06)';
    rr(180, 178, 560, 330, 12);
    ctx.fill();
    result.order.forEach((r, i) => {
      const y = 200 + i * 52;
      ctx.fillStyle = r.silk;
      ctx.beginPath();
      ctx.arc(214, y + 14, 12, 0, Math.PI * 2);
      ctx.fill();
      text(String(r.place), 214, y + 15, 14, '#fff', 'bold', 'center');
      const isBet = season.bet && r.horseId === season.bet.horseId;
      text(`${r.place}. ${r.name}`, 240, y + 14, 18, isBet ? COLORS.gold : '#fff3d6');
      text(`${r.time.toFixed(2)}s`, 700, y + 14, 16, '#fff3d6', 'bold', 'right');
      if (i === 0) text('★ WINNER', 540, y + 14, 14, COLORS.gold, 'bold', 'center');
    });
    // Bet outcome.
    ctx.fillStyle = 'rgba(255,243,214,0.06)';
    rr(770, 178, 330, 330, 12);
    ctx.fill();
    text('YOUR BET', 790, 202, 16, COLORS.gold);
    if (season.bet) {
      const b = season.bet;
      text(`${b.horseName}`, 790, 232, 18, '#fff3d6');
      text(`${b.type.toUpperCase()} ${b.stake} coins @ ${b.odds.toFixed(1)}`, 790, 260, 15, 'rgba(255,243,214,0.8)', 'normal');
      text(`Finished ${result.betPlace}${result.betPlace === 1 ? 'st' : result.betPlace === 2 ? 'nd' : result.betPlace === 3 ? 'rd' : 'th'}`, 790, 288, 15, 'rgba(255,243,214,0.8)', 'normal');
      if (result.won) {
        text('YOU WON!', 790, 330, 26, COLORS.green, 'bold');
        text(`+${result.payout} coins`, 790, 366, 22, COLORS.green, 'bold');
      } else {
        text('No luck this time', 790, 330, 22, '#ef476f', 'bold');
        text(`-${b.stake} coins`, 790, 366, 20, '#ef476f', 'bold');
      }
      text(`Balance: ${season.coins} coins`, 790, 404, 17, '#fff3d6', 'bold');
      text(`Championship points: ${season.roster.find((h) => h.id === b.horseId)?.points ?? 0}`, 790, 434, 15, 'rgba(255,243,214,0.8)', 'normal');
    }
    const more = season.raceNo < RACES_PER_SEASON;
    button(ui, 'next-race', 490, 540, 300, 54, more ? 'NEXT RACE  →' : 'CHAMPIONSHIP  →', { size: 20, bg: COLORS.gold });
    if (more) text(`Race ${season.raceNo + 1} of ${RACES_PER_SEASON} is next`, 640, 622, 15, 'rgba(255,243,214,0.75)', 'normal', 'center');
  }

  // ---- CHAMPIONSHIP ----
  function drawChamp(ui, state) {
    const season = state.season;
    const board = season.roster.slice().sort((a, b) => b.points - a.points || b.wins - a.wins);
    const champ = board[0];
    const g = ctx.createLinearGradient(0, 0, 0, VIEW_H);
    g.addColorStop(0, '#3d2b00');
    g.addColorStop(1, '#1d2b53');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, VIEW_W, VIEW_H);
    text('SEASON CHAMPION', 640, 80, 26, COLORS.gold, 'bold', 'center');
    text('🏆', 640, 150, 56, '#fff', 'bold', 'center');
    text(champ.name, 640, 210, 44, '#fff3d6', 'bold', 'center');
    text(`${champ.points} points  •  ${champ.wins} wins in ${champ.runs} races`, 640, 256, 18, COLORS.gold, 'bold', 'center');
    ctx.fillStyle = 'rgba(255,243,214,0.06)';
    rr(340, 290, 600, 250, 12);
    ctx.fill();
    board.forEach((h, i) => {
      const y = 312 + i * 38;
      text(`${i + 1}.`, 370, y, 18, i === 0 ? COLORS.gold : '#fff3d6', 'bold');
      ctx.fillStyle = h.silk;
      ctx.beginPath();
      ctx.arc(420, y, 10, 0, Math.PI * 2);
      ctx.fill();
      text(h.name, 440, y, 18, '#fff3d6');
      text(`${h.points} pts`, 700, y, 18, '#fff3d6', 'bold', 'center');
      text(`${h.wins}W / ${h.runs} runs`, 830, y, 15, 'rgba(255,243,214,0.75)', 'normal', 'center');
    });
    text(`You finished the season with ${season.coins} coins (started with 1000).`, 640, 570, 17, '#fff3d6', 'normal', 'center');
    text(`Total bet: ${season.totalBet}  •  Total won: ${season.totalWon}`, 640, 598, 15, 'rgba(255,243,214,0.75)', 'normal', 'center');
    button(ui, 'play-again', 490, 624, 300, 54, 'PLAY A NEW SEASON', { size: 20, bg: COLORS.gold });
  }

  // ---- GAME OVER ----
  function drawGameOver(ui, state) {
    const season = state.season;
    const g = ctx.createLinearGradient(0, 0, 0, VIEW_H);
    g.addColorStop(0, '#3d0c11');
    g.addColorStop(1, '#1d2b53');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, VIEW_W, VIEW_H);
    text('OUT OF COINS', 640, 220, 56, '#ef476f', 'bold', 'center');
    text('Your stable is broke — you cannot place the minimum bet of 50 coins.', 640, 300, 20, '#fff3d6', 'normal', 'center');
    text(`You reached Race ${season.raceNo} of ${RACES_PER_SEASON} with ${season.coins} coins left.`, 640, 336, 18, 'rgba(255,243,214,0.8)', 'normal', 'center');
    text('Tip: Place bets pay when your horse finishes top 3 — safer than Win.', 640, 372, 16, COLORS.gold, 'normal', 'center');
    button(ui, 'restart', 490, 430, 300, 54, 'RESTART SEASON', { size: 20, bg: COLORS.gold });
  }

  function drawPaused(ui) {
    ctx.fillStyle = 'rgba(10,14,28,0.72)';
    ctx.fillRect(0, 0, VIEW_W, VIEW_H);
    text('PAUSED', 640, 320, 56, '#fff3d6', 'bold', 'center');
    text('Press P or Esc to continue — your race waits for you.', 640, 380, 18, 'rgba(255,243,214,0.85)', 'normal', 'center');
    button(ui, 'resume', 540, 420, 200, 50, 'RESUME', { size: 20, bg: COLORS.gold });
  }

  function draw(state, ui) {
    ui.buttons.length = 0;
    ctx.clearRect(0, 0, VIEW_W, VIEW_H);
    if (state.screen === 'title') drawTitle(ui, state);
    else if (state.screen === 'bet') drawBet(ui, state);
    else if (state.screen === 'race') drawRace(ui, state);
    else if (state.screen === 'results') drawResults(ui, state);
    else if (state.screen === 'champ') drawChamp(ui, state);
    else if (state.screen === 'gameover') drawGameOver(ui, state);
    if (state.paused && state.screen !== 'title') drawPaused(ui);
    // Mute hint, always visible.
    text(state.muted ? 'M — sound off' : 'M — sound on', VIEW_W - 14, VIEW_H - 12, 12, 'rgba(255,243,214,0.55)', 'normal', 'right');
  }

  return { draw, drawHorse, button, text, rr, coinsChip, header };
}
