// Nusantara Derby — input.js
// Keyboard and pointer state. The game loop polls this; render code asks
// it where the pointer is so buttons can highlight on hover.
export function createInput(canvas) {
  const input = {
    keys: new Set(),
    pressed: new Set(),
    pointer: { x: -1, y: -1, down: false, clicked: false, clickX: 0, clickY: 0 },
    _canvas: canvas,
  };

  window.addEventListener('keydown', (e) => {
    if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) {
      e.preventDefault();
    }
    if (!e.repeat) input.pressed.add(e.code);
    input.keys.add(e.code);
  });
  window.addEventListener('keyup', (e) => {
    input.keys.delete(e.code);
  });

  function toGame(e) {
    const rect = canvas.getBoundingClientRect();
    return {
      x: ((e.clientX - rect.left) / rect.width) * canvas.width,
      y: ((e.clientY - rect.top) / rect.height) * canvas.height,
    };
  }

  canvas.addEventListener('pointermove', (e) => {
    const p = toGame(e);
    input.pointer.x = p.x;
    input.pointer.y = p.y;
  });
  canvas.addEventListener('pointerdown', (e) => {
    const p = toGame(e);
    input.pointer.x = p.x;
    input.pointer.y = p.y;
    input.pointer.down = true;
    input.pointer.clicked = true;
    input.pointer.clickX = p.x;
    input.pointer.clickY = p.y;
  });
  window.addEventListener('pointerup', () => {
    input.pointer.down = false;
  });
  return input;
}

// Keys pressed since the last frame; the caller clears them by reading.
export function takePressed(input) {
  const out = new Set(input.pressed);
  input.pressed.clear();
  return out;
}

export function takeClick(input) {
  if (!input.pointer.clicked) return null;
  input.pointer.clicked = false;
  return { x: input.pointer.clickX, y: input.pointer.clickY };
}
