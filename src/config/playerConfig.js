// Configuración y balance del jugador
export const PLAYER_CONFIG = {
  stats: {
    initialHp: 5,
    maxHp: 5,
    radius: 6,
    hurtboxMargin: 2,
    hpRecoveryBetweenLevels: 1,
  },
  movement: {
    accel: 700,
    damping: 4.5,
    maxSpeed: 90,
  },
  dash: {
    speed: 280,
    duration: 0.15,
    cooldown: 0.52,
    invulnerable: true,
  },
  combat: {
    shootCooldown: 0.16,
    invulnerabilityTime: 0.9,
    recoilSpeed: 120,
    recoilUpSpeed: 40,
  }
};
