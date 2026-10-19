const keys = new Set();
const pressed = new Set(); // teclas presionadas en este frame
let clicked = false;

const GAME_KEYS = [
  'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight',
  'KeyZ', 'KeyX', 'Enter', 'NumpadEnter', 'Space', 'KeyM'
];

window.addEventListener('keydown', (e) => {
  if (GAME_KEYS.includes(e.code)) e.preventDefault();
  if (!keys.has(e.code)) pressed.add(e.code);
  keys.add(e.code);
});
window.addEventListener('keyup', (e) => keys.delete(e.code));
window.addEventListener('blur', () => {
  keys.clear();
  clicked = false;
});
window.addEventListener('pointerdown', () => {
  clicked = true;
});

export const input = {
  isDown: (code) => keys.has(code),
  wasPressed: (code) => pressed.has(code),
  get wasClicked() { return clicked; },
  anyRestartPressed() {
    return (
      pressed.has('Enter') ||
      pressed.has('NumpadEnter') ||
      pressed.has('Space') ||
      pressed.has('KeyZ') ||
      pressed.has('KeyX') ||
      clicked
    );
  },
  endFrame() {
    pressed.clear();
    clicked = false;
  },
  get axisX() { return (keys.has('ArrowRight') ? 1 : 0) - (keys.has('ArrowLeft') ? 1 : 0); },
  get axisY() { return (keys.has('ArrowDown') ? 1 : 0) - (keys.has('ArrowUp') ? 1 : 0); },
};