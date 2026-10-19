// Gestor de audio (Música de fondo y Efectos de sonido SFX) para Plasma Orb

const BASE = import.meta.env.BASE_URL.endsWith('/')
  ? import.meta.env.BASE_URL
  : `${import.meta.env.BASE_URL}/`;

export const TRACKS = {
  level1: `${BASE}music/nivel1.mp3`,
  level2: `${BASE}music/nivel2.mp3`,
  boss: `${BASE}music/boss.mp3`,
};

export const SFX_FILES = {
  laser: `${BASE}music/laser.mp3`,
  dash: `${BASE}sounds/dash.wav`,
  hit: `${BASE}sounds/hit.wav`,
  enemyDie: `${BASE}sounds/enemy_die.wav`,
  enemyShoot: `${BASE}sounds/enemy_shoot.wav`,
  playerHurt: `${BASE}sounds/player_hurt.wav`,
  playerDie: `${BASE}sounds/player_die.wav`,
  bossRoar: `${BASE}sounds/boss_roar.wav`,
  bossSlam: `${BASE}sounds/boss_slam.wav`,
  bossDie: `${BASE}sounds/boss_die.wav`,
};

// Gestor de Efectos de Sonido con Web Audio API (soporta polifonía y cero latencia)
class SoundEffectsManager {
  constructor() {
    this.ctx = null;
    this.gainNode = null;
    this.buffers = new Map();
    this.volume = 0.55;
    this.muted = false;

    this._init();
  }

  _init() {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
        this.gainNode = this.ctx.createGain();
        this.gainNode.gain.value = this.muted ? 0 : this.volume;
        this.gainNode.connect(this.ctx.destination);
        this.preload();
      }
    } catch (_) {}
  }

  resume() {
    try {
      if (this.ctx && this.ctx.state === 'suspended') {
        this.ctx.resume().catch(() => {});
      }
    } catch (_) {}
  }

  preload() {
    if (!this.ctx) return;
    for (const [key, url] of Object.entries(SFX_FILES)) {
      fetch(url)
        .then((res) => {
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          return res.arrayBuffer();
        })
        .then((arr) => {
          return new Promise((resolve, reject) => {
            try {
              const p = this.ctx.decodeAudioData(arr, resolve, reject);
              if (p && typeof p.then === 'function') {
                p.then(resolve).catch(reject);
              }
            } catch (e) {
              reject(e);
            }
          });
        })
        .then((decoded) => {
          this.buffers.set(key, decoded);
        })
        .catch(() => {
          // Si falla la carga del archivo, usará el sintetizador procedural de respaldo
        });
    }
  }

  play(name, scale = 1.0) {
    if (this.muted) return;
    this.resume();
    if (!this.ctx) return;

    try {
      const buffer = this.buffers.get(name);
      if (buffer) {
        const source = this.ctx.createBufferSource();
        source.buffer = buffer;
        if (scale !== 1.0) {
          const subGain = this.ctx.createGain();
          subGain.gain.value = scale;
          source.connect(subGain);
          subGain.connect(this.gainNode);
        } else {
          source.connect(this.gainNode);
        }
        source.start(0);
        return;
      }
    } catch (_) {}

    // Síntesis procedural de respaldo si el archivo de audio aún no se ha cargado
    this._playSynthFallback(name);
  }

  _playSynthFallback(name) {
    if (!this.ctx || this.muted) return;
    try {
      const now = this.ctx.currentTime || 0;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.connect(gain);
      gain.connect(this.gainNode);

      if (name === 'laser') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(800, now);
        osc.frequency.exponentialRampToValueAtTime(180, now + 0.12);
        gain.gain.setValueAtTime(0.4, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.12);
        osc.start(now);
        osc.stop(now + 0.12);
      } else if (name === 'dash') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(250, now);
        osc.frequency.exponentialRampToValueAtTime(600, now + 0.08);
        osc.frequency.exponentialRampToValueAtTime(300, now + 0.18);
        gain.gain.setValueAtTime(0.4, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.18);
        osc.start(now);
        osc.stop(now + 0.18);
      } else if (name === 'hit') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(550, now);
        osc.frequency.exponentialRampToValueAtTime(100, now + 0.06);
        gain.gain.setValueAtTime(0.5, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.06);
        osc.start(now);
        osc.stop(now + 0.06);
      } else if (name === 'enemyDie') {
        osc.type = 'square';
        osc.frequency.setValueAtTime(260, now);
        osc.frequency.exponentialRampToValueAtTime(40, now + 0.22);
        gain.gain.setValueAtTime(0.5, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.22);
        osc.start(now);
        osc.stop(now + 0.22);
      } else if (name === 'enemyShoot') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(650, now);
        osc.frequency.exponentialRampToValueAtTime(180, now + 0.14);
        gain.gain.setValueAtTime(0.35, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.14);
        osc.start(now);
        osc.stop(now + 0.14);
      } else if (name === 'playerHurt') {
        osc.type = 'square';
        osc.frequency.setValueAtTime(180, now);
        osc.frequency.exponentialRampToValueAtTime(50, now + 0.2);
        gain.gain.setValueAtTime(0.55, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
        osc.start(now);
        osc.stop(now + 0.2);
      } else if (name === 'playerDie') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(420, now);
        osc.frequency.exponentialRampToValueAtTime(30, now + 0.7);
        gain.gain.setValueAtTime(0.6, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.7);
        osc.start(now);
        osc.stop(now + 0.7);
      } else if (name === 'bossRoar') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(90, now);
        osc.frequency.linearRampToValueAtTime(160, now + 0.4);
        gain.gain.setValueAtTime(0.5, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.45);
        osc.start(now);
        osc.stop(now + 0.45);
      } else if (name === 'bossSlam') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(80, now);
        osc.frequency.exponentialRampToValueAtTime(25, now + 0.35);
        gain.gain.setValueAtTime(0.7, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.35);
        osc.start(now);
        osc.stop(now + 0.35);
      } else if (name === 'bossDie') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(120, now);
        osc.frequency.exponentialRampToValueAtTime(20, now + 1.1);
        gain.gain.setValueAtTime(0.7, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 1.1);
        osc.start(now);
        osc.stop(now + 1.1);
      }
    } catch (_) {}
  }

  setMuted(muted) {
    this.muted = muted;
    try {
      if (this.gainNode) {
        this.gainNode.gain.value = muted ? 0 : this.volume;
      }
    } catch (_) {}
  }
}

const sfxManager = new SoundEffectsManager();

class AudioManager {
  constructor() {
    this.audio = null;
    this.currentTrack = null;
    this.targetTrack = null;
    this.volume = 0.45;
    this.muted = false;
    this.fadeInterval = null;

    // Desbloquear audio en la primera interacción del usuario (política autoplay del navegador)
    const unlock = () => {
      sfxManager.resume();
      if (this.targetTrack && (!this.audio || this.audio.paused)) {
        this.play(this.targetTrack, true);
      }
      window.removeEventListener('keydown', unlock);
      window.removeEventListener('pointerdown', unlock);
    };

    window.addEventListener('keydown', unlock);
    window.addEventListener('pointerdown', unlock);
  }

  _getAudio() {
    if (!this.audio) {
      try {
        this.audio = new Audio();
        this.audio.loop = true;
      } catch (_) {}
    }
    return this.audio;
  }

  _clearFade() {
    if (this.fadeInterval) {
      clearInterval(this.fadeInterval);
      this.fadeInterval = null;
    }
  }

  play(trackKey, force = false) {
    const src = TRACKS[trackKey] || trackKey;
    if (!src) return;

    this._clearFade();
    this.targetTrack = trackKey;

    const audio = this._getAudio();
    if (!audio) return;

    if (!force && this.currentTrack === trackKey && !audio.paused) {
      return;
    }

    try {
      this.currentTrack = trackKey;
      audio.src = src;
      try { audio.currentTime = 0; } catch (_) {}
      audio.volume = this.muted ? 0 : this.volume;

      const p = audio.play();
      if (p !== undefined) {
        p.catch(() => {
          // Bloqueado temporalmente por autoplay; se reproducirá en la primera interacción
        });
      }
    } catch (_) {}
  }

  playLevel(level) {
    if (typeof level === 'string' && TRACKS[level]) {
      this.play(level);
    } else if (level === 1) {
      this.play('level2');
    } else {
      this.play('level1');
    }
  }

  playBoss() {
    this.play('boss');
  }

  stop(fadeOut = false) {
    this.targetTrack = null;
    this.currentTrack = null;
    this._clearFade();

    if (!this.audio) return;

    if (!fadeOut || this.audio.paused) {
      try {
        this.audio.pause();
        this.audio.currentTime = 0;
      } catch (_) {}
      return;
    }

    const initialVol = this.audio.volume;
    const steps = 10;
    const stepTime = 40;
    let currentStep = 0;

    this.fadeInterval = setInterval(() => {
      currentStep++;
      if (!this.audio || currentStep >= steps) {
        this._clearFade();
        if (this.audio) {
          try {
            this.audio.pause();
            this.audio.currentTime = 0;
            this.audio.volume = this.muted ? 0 : this.volume;
          } catch (_) {}
        }
      } else {
        try {
          this.audio.volume = Math.max(0, initialVol * (1 - currentStep / steps));
        } catch (_) {}
      }
    }, stepTime);
  }

  toggleMute() {
    this.muted = !this.muted;
    sfxManager.setMuted(this.muted);
    if (this.audio) {
      try {
        this.audio.volume = this.muted ? 0 : this.volume;
      } catch (_) {}
    }
    return this.muted;
  }

  setVolume(vol) {
    this.volume = Math.max(0, Math.min(1, vol));
    if (this.audio && !this.muted) {
      try {
        this.audio.volume = this.volume;
      } catch (_) {}
    }
  }
}

export const music = new AudioManager();

export const sfx = {
  laser: () => { try { sfxManager.play('laser'); } catch (_) {} },
  dash: () => { try { sfxManager.play('dash'); } catch (_) {} },
  hit: () => { try { sfxManager.play('hit'); } catch (_) {} },
  enemyDie: () => { try { sfxManager.play('enemyDie'); } catch (_) {} },
  enemyShoot: () => { try { sfxManager.play('enemyShoot'); } catch (_) {} },
  playerHurt: () => { try { sfxManager.play('playerHurt'); } catch (_) {} },
  playerDie: () => { try { sfxManager.play('playerDie'); } catch (_) {} },
  bossRoar: () => { try { sfxManager.play('bossRoar'); } catch (_) {} },
  bossSlam: () => { try { sfxManager.play('bossSlam'); } catch (_) {} },
  bossDie: () => { try { sfxManager.play('bossDie'); } catch (_) {} },
  play: (name, scale) => { try { sfxManager.play(name, scale); } catch (_) {} },
};
