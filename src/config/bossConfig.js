// Configuración declarativa de los jefes del juego
export const BOSS_CONFIG = {
  reaper: {
    name: 'ESPECTRO SEGADOR',
    maxHp: 260,
    radius: 18,
    color: '200,120,255',
    spawnOffsetX: 120,
    spawnY: 80,
    enragedHpRatio: 0.5,
    float: {
      amplitudeX: 12,
      frequencyX: 1.3,
      baseY: 82,
      amplitudeY: 38,
      frequencyYNormal: 1.5,
      frequencyYRage: 2.4,
    },
    fanAttack: {
      cooldownNormal: 1.4,
      cooldownRage: 0.95,
      bulletCountNormal: 4,
      bulletCountRage: 7,
      spreadNormal: 0.28,
      spreadRage: 0.22,
      bulletSpeedNormal: 95,
      bulletSpeedRage: 120,
      originOffsetX: -12,
    },
    dashAttack: {
      cooldownNormal: 3.6,
      cooldownRage: 2.4,
      telegraphDurationNormal: 0.75,
      telegraphDurationRage: 0.55,
      chargeSpeedNormal: 310,
      chargeSpeedRage: 360,
      returnSpeedNormal: 160,
      returnSpeedRage: 200,
      minReturnXOffset: 24,
    },
    summon: {
      type: 'bat',
      spawnPositions: [45, 105],
      triggerOnRageReturn: true,
    }
  },

  colossus: {
    name: 'COLOSO DE HUESOS',
    maxHp: 340,
    radius: 16,
    color: '220,210,180',
    spawnOffsetX: 140,
    enragedHpRatio: 0.5,
    jump: {
      cooldownNormal: 1.7,
      cooldownRage: 1.0,
      crouchTimeNormal: 0.45,
      crouchTimeRage: 0.32,
      jumpVy: -285,
      gravity: 620,
      maxVx: 180,
      landingShake: 7,
    },
    ringVolley: {
      countNormal: 18,
      countRage: 22,
      speedNormal: 115,
      speedRage: 130,
      interleavedDelay: 0.18,
    },
    summon: {
      type: 'skull',
      spawnPositions: [45, 85],
      triggerOnRageLanding: true,
    }
  },

  swampGhost: {
    name: 'FANTASMA DEL PANTANO',
    maxHp: 60,
    radius: 14,
    color: '170,255,220',
    enragedHpRatio: 0.5,
    teleport: {
      hiddenTimeNormal: 1.2,
      fadeInTime: 0.55,
      visibleTimeNormal: 1.7,
      visibleTimeRage: 1.3,
      fadeOutTime: 0.5,
      minDistanceToPlayer: 55,
    },
    waveAttack: {
      bulletSpeed: 95,
      singleScale: 1.0,
      enragedScales: [0.7, 1.0, 1.35],
      enragedOffsets: [12, -4, -20],
    },
    deathBeam: {
      cooldown: 2.0,
      chargeTime: 0.85,
      duration: 0.65,
      maxLength: 420,
      damageInterval: 0.08,
    },
    summon: {
      type: 'hunter',
      cooldownNormal: 3.0,
      countNormal: 1,
      countRage: 2,
    }
  }
};
