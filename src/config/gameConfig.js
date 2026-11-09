// Configuración general del juego y del canvas
export const GAME_CONFIG = {
  canvas: {
    width: 320,
    height: 180,
    groundY: 150,
  },
  physics: {
    gravity: 620,
  },
  view: {
    cameraSpeedFactor: 6,
    leadAheadFactor: 0.4,
  }
};

// Aliases para compatibilidad con código existente
export const W = GAME_CONFIG.canvas.width;
export const H = GAME_CONFIG.canvas.height;
export const GROUND = GAME_CONFIG.canvas.groundY;
