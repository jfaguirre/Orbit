// Generador de efectos de sonido procedurales para Plasma Orb
import fs from 'node:fs';
import path from 'node:path';

const SAMPLE_RATE = 44100;

function createWavBuffer(samples, sampleRate = SAMPLE_RATE) {
  const numSamples = samples.length;
  const buffer = Buffer.alloc(44 + numSamples * 2);

  buffer.write('RIFF', 0);
  buffer.writeUInt32LE(36 + numSamples * 2, 4);
  buffer.write('WAVE', 8);
  buffer.write('fmt ', 12);
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20); // PCM
  buffer.writeUInt16LE(1, 22); // Mono
  buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(sampleRate * 2, 28); // byte rate
  buffer.writeUInt16LE(2, 32); // block align
  buffer.writeUInt16LE(16, 34); // bits per sample
  buffer.write('data', 36);
  buffer.writeUInt32LE(numSamples * 2, 40);

  for (let i = 0; i < numSamples; i++) {
    const s = Math.max(-1, Math.min(1, samples[i]));
    const val = s < 0 ? s * 0x8000 : s * 0x7FFF;
    buffer.writeInt16LE(Math.floor(val), 44 + i * 2);
  }

  return buffer;
}

// 1. DASH: Impulso veloz de plasma (barrido ascendente + soplido de energía)
function genDash() {
  const duration = 0.22;
  const n = Math.floor(SAMPLE_RATE * duration);
  const out = new Float32Array(n);
  let phase = 0;

  for (let i = 0; i < n; i++) {
    const t = i / SAMPLE_RATE;
    const progress = t / duration;

    // Frecuencia que sube rápido y luego se asienta
    const freq = 220 + Math.sin(progress * Math.PI) * 450;
    phase += (2 * Math.PI * freq) / SAMPLE_RATE;

    const tone = Math.sin(phase) * 0.7 + (Math.sin(phase * 2) * 0.3);
    const noise = (Math.random() * 2 - 1) * 0.35;

    // Envolvente rápida
    const env = Math.sin(progress * Math.PI) * Math.pow(1 - progress, 0.4);
    out[i] = (tone * 0.65 + noise * 0.35) * env * 0.85;
  }
  return out;
}

// 2. HIT: Impacto nítido de disparo de plasma contra enemigo
function genHit() {
  const duration = 0.08;
  const n = Math.floor(SAMPLE_RATE * duration);
  const out = new Float32Array(n);
  let phase = 0;

  for (let i = 0; i < n; i++) {
    const t = i / SAMPLE_RATE;
    const progress = t / duration;

    // Rápido descenso de tono
    const freq = 600 * Math.exp(-progress * 25) + 120;
    phase += (2 * Math.PI * freq) / SAMPLE_RATE;

    const tone = Math.sin(phase);
    const noise = (Math.random() * 2 - 1) * Math.exp(-progress * 30);
    const env = Math.exp(-progress * 15);

    out[i] = (tone * 0.7 + noise * 0.5) * env * 0.8;
  }
  return out;
}

// 3. ENEMY DIE: Explosión y dispersión de enemigo normal
function genEnemyDie() {
  const duration = 0.28;
  const n = Math.floor(SAMPLE_RATE * duration);
  const out = new Float32Array(n);
  let phase = 0;
  let lastNoise = 0;

  for (let i = 0; i < n; i++) {
    const t = i / SAMPLE_RATE;
    const progress = t / duration;

    const freq = 260 * Math.exp(-progress * 8) + 40;
    phase += (2 * Math.PI * freq) / SAMPLE_RATE;

    const tone = (phase % (2 * Math.PI) < Math.PI ? 1 : -1) * 0.3; // Onda cuadrada retro
    const rawNoise = (Math.random() * 2 - 1);
    // Filtro paso bajo simple para el ruido
    const noise = lastNoise + 0.25 * (rawNoise - lastNoise);
    lastNoise = noise;

    const env = Math.exp(-progress * 7);
    out[i] = (tone * 0.4 + noise * 0.8) * env * 0.8;
  }
  return out;
}

// 4. ENEMY SHOOT: Disparo hostil (Ojo, Ídolo, Cráneo, Jefe)
function genEnemyShoot() {
  const duration = 0.16;
  const n = Math.floor(SAMPLE_RATE * duration);
  const out = new Float32Array(n);
  let phase = 0;

  for (let i = 0; i < n; i++) {
    const t = i / SAMPLE_RATE;
    const progress = t / duration;

    const freq = 680 * Math.exp(-progress * 12) + 180;
    phase += (2 * Math.PI * freq) / SAMPLE_RATE;

    const tone = Math.sin(phase) + 0.3 * Math.sin(phase * 3);
    const env = Math.exp(-progress * 10);

    out[i] = tone * env * 0.65;
  }
  return out;
}

// 5. PLAYER HURT: Daño recibido por el orbe
function genPlayerHurt() {
  const duration = 0.22;
  const n = Math.floor(SAMPLE_RATE * duration);
  const out = new Float32Array(n);
  let phase = 0;

  for (let i = 0; i < n; i++) {
    const t = i / SAMPLE_RATE;
    const progress = t / duration;

    const vibrato = Math.sin(t * 70) * 20;
    const freq = Math.max(30, 180 - progress * 130 + vibrato);
    phase += (2 * Math.PI * freq) / SAMPLE_RATE;

    const tone = (phase % (2 * Math.PI) < Math.PI ? 0.7 : -0.7);
    const noise = (Math.random() * 2 - 1) * Math.exp(-progress * 20);
    const env = Math.exp(-progress * 9);

    out[i] = (tone * 0.6 + noise * 0.4) * env * 0.8;
  }
  return out;
}

// 6. PLAYER DIE: Destrucción total del jugador (Game Over)
function genPlayerDie() {
  const duration = 0.85;
  const n = Math.floor(SAMPLE_RATE * duration);
  const out = new Float32Array(n);
  let phase = 0;
  let lastNoise = 0;

  for (let i = 0; i < n; i++) {
    const t = i / SAMPLE_RATE;
    const progress = t / duration;

    const freq = 450 * Math.exp(-progress * 4) + 30;
    const tremolo = 0.5 + 0.5 * Math.sin(t * 35);
    phase += (2 * Math.PI * freq) / SAMPLE_RATE;

    const tone = Math.sin(phase) * tremolo;
    const rawNoise = (Math.random() * 2 - 1);
    const noise = lastNoise + 0.2 * (rawNoise - lastNoise);
    lastNoise = noise;

    const env = Math.exp(-progress * 4.5);
    out[i] = (tone * 0.5 + noise * 0.6) * env * 0.85;
  }
  return out;
}

// 7. BOSS ROAR / TELEGRAPH: Alerta o embestida del jefe
function genBossRoar() {
  const duration = 0.6;
  const n = Math.floor(SAMPLE_RATE * duration);
  const out = new Float32Array(n);
  let p1 = 0, p2 = 0;

  for (let i = 0; i < n; i++) {
    const t = i / SAMPLE_RATE;
    const progress = t / duration;

    const lfo = Math.sin(t * 16) * 15;
    const f1 = 80 + progress * 70 + lfo;
    const f2 = 86 + progress * 74 + lfo;

    p1 += (2 * Math.PI * f1) / SAMPLE_RATE;
    p2 += (2 * Math.PI * f2) / SAMPLE_RATE;

    const tone = (Math.sin(p1) + Math.sin(p2)) * 0.5;
    const noise = (Math.random() * 2 - 1) * 0.25;
    const env = Math.sin(progress * Math.PI) * 0.85;

    out[i] = (tone * 0.75 + noise * 0.25) * env;
  }
  return out;
}

// 8. BOSS SLAM: Terremoto e impacto del Coloso al aterrizar
function genBossSlam() {
  const duration = 0.45;
  const n = Math.floor(SAMPLE_RATE * duration);
  const out = new Float32Array(n);
  let phase = 0;
  let lastNoise = 0;

  for (let i = 0; i < n; i++) {
    const t = i / SAMPLE_RATE;
    const progress = t / duration;

    const freq = 90 * Math.exp(-progress * 10) + 25;
    phase += (2 * Math.PI * freq) / SAMPLE_RATE;

    const sub = Math.sin(phase);
    const rawNoise = (Math.random() * 2 - 1);
    const noise = lastNoise + 0.15 * (rawNoise - lastNoise);
    lastNoise = noise;

    const env = Math.exp(-progress * 7);
    out[i] = (sub * 0.7 + noise * 0.5) * env * 0.9;
  }
  return out;
}

// 9. BOSS DIE: Explosión masiva final del jefe
function genBossDie() {
  const duration = 1.3;
  const n = Math.floor(SAMPLE_RATE * duration);
  const out = new Float32Array(n);
  let phase = 0;
  let lastNoise = 0;

  for (let i = 0; i < n; i++) {
    const t = i / SAMPLE_RATE;
    const progress = t / duration;

    // Tres picos de explosión sucesivos
    const burst1 = Math.exp(-Math.pow((t - 0.1) * 15, 2));
    const burst2 = Math.exp(-Math.pow((t - 0.35) * 12, 2));
    const burst3 = Math.exp(-Math.pow((t - 0.65) * 6, 2));

    const rumbleFreq = 65 * Math.exp(-progress * 3) + 25;
    phase += (2 * Math.PI * rumbleFreq) / SAMPLE_RATE;

    const tone = Math.sin(phase);
    const rawNoise = (Math.random() * 2 - 1);
    const noise = lastNoise + 0.2 * (rawNoise - lastNoise);
    lastNoise = noise;

    const totalBurst = burst1 * 0.6 + burst2 * 0.8 + burst3 * 1.0;
    const tail = Math.exp(-progress * 3.5);

    out[i] = (tone * 0.5 + noise * 0.7) * Math.max(totalBurst, tail * 0.4) * 0.9;
  }
  return out;
}

// Directorio de salida
const outDir = path.resolve(process.cwd(), 'public/sounds');
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

const sounds = {
  dash: genDash(),
  hit: genHit(),
  enemy_die: genEnemyDie(),
  enemy_shoot: genEnemyShoot(),
  player_hurt: genPlayerHurt(),
  player_die: genPlayerDie(),
  boss_roar: genBossRoar(),
  boss_slam: genBossSlam(),
  boss_die: genBossDie(),
};

for (const [name, samples] of Object.entries(sounds)) {
  const buffer = createWavBuffer(samples);
  const file = path.join(outDir, `${name}.wav`);
  fs.writeFileSync(file, buffer);
  console.log(`Generated: ${name}.wav (${buffer.length} bytes)`);
}

console.log('Todos los efectos de sonido se han generado con éxito en public/sounds/');
