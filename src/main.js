import './style.css';
import { W, H } from './config.js';
import { input } from './input.js';
import { Player } from './player.js';
import { levels } from './levels.js';
import { createEnemy } from './enemies.js';
import { Particles } from './effects.js';
import { overlap, clamp } from './utils.js';
import { music, sfx } from './audio.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
ctx.imageSmoothingEnabled = false;

let levelIndex = 0;
let player, level, shots, enemyShots, enemies, particles;
let camX, spawnIdx, boss, bossLocked, state, shake, time;

// Carga un nivel desde cero. hp = vida con la que llega el jugador (opcional).
function loadLevel(index, hp) {
  levelIndex = index;
  player = new Player(40, 100);
  if (hp !== undefined) player.hp = Math.min(player.maxHp, hp + 1); // recupera 1 de vida entre niveles
  level = levels[index]();
  shots = [];
  enemyShots = [];
  enemies = [];
  particles = new Particles();
  camX = 0;
  spawnIdx = 0;
  boss = null;
  bossLocked = false;
  state = 'playing'; // playing | gameover | victory
  shake = 0;
  time = 0;
  spawnQueue.length = 0;
  music.playLevel(level.music || index);
}

const spawnQueue = [];
const spawnEnemy = (type, x, y) => {
  const e = createEnemy(type, x, y);
  if (e) spawnQueue.push(e);
};
const addShake = (n) => { shake = Math.max(shake, n); };
loadLevel(0);

function startBoss() {
  bossLocked = true;
  spawnQueue.length = 0;
  for (const e of enemies) { // limpia la pantalla
    particles.burst(e.x, e.y, e.color, 10, 90);
    e.alive = false;
  }
  enemyShots = [];
  boss = level.createBoss();
  enemies.push(boss);
  music.playBoss();
  sfx.bossRoar();
}

function hurtPlayer() {
  if (!player.hit()) return;
  shake = 4;
  particles.burst(player.x, player.y, '255,90,90', 12, 90);
  if (player.hp <= 0) {
    state = 'gameover';
    particles.burst(player.x, player.y, '79,216,255', 30, 140);
    music.stop(true);
    sfx.playerDie();
  } else {
    sfx.playerHurt();
  }
}

function update(dt) {
  if (input.wasPressed('KeyM')) {
    music.toggleMute();
  }

  if (state === 'playing') {
    // Jugador y cámara
    const bounds = bossLocked ? { min: camX, max: camX + W } : { min: 0, max: level.worldW };
    player.update(dt, shots, bounds);

    const target = bossLocked ? level.worldW - W : clamp(player.x - W * 0.4, 0, level.worldW - W);
    camX += (target - camX) * Math.min(1, dt * 6);

    // Llegó al final: empieza el combate con el jefe
    if (!bossLocked && player.x > level.worldW - W + 60) startBoss();

    // Aparición de enemigos según avanza la cámara
    while (!bossLocked && spawnIdx < level.spawns.length && level.spawns[spawnIdx].x < camX + W + 30) {
      const s = level.spawns[spawnIdx++];
      spawnEnemy(s.t, s.x, s.y);
    }
    if (spawnQueue.length > 0) {
      enemies.push(...spawnQueue);
      spawnQueue.length = 0;
    }

    // Actualizar entidades
    const world = { player, enemyShots, camX, spawn: spawnEnemy, shake: addShake };
    const currentEnemies = enemies.slice();
    for (const e of currentEnemies) {
      if (e.alive) e.update(dt, world);
    }
    if (spawnQueue.length > 0) {
      enemies.push(...spawnQueue);
      spawnQueue.length = 0;
    }

    for (const s of shots) s.update(dt, camX);
    for (const s of enemyShots) s.update(dt, camX);

    // Disparos del jugador contra enemigos
    for (const s of shots) {
      if (!s.alive) continue;
      for (const e of enemies) {
        if (!e.alive || !overlap(s, e)) continue;
        e.damage(1);
        s.alive = false;
        particles.burst(s.x, s.y, '79,216,255', 5, 70);
        if (!e.alive && e !== boss) {
          particles.burst(e.x, e.y, e.color, 16, 120);
          shake = Math.max(shake, 2);
          sfx.enemyDie();
        } else {
          sfx.hit();
        }
        break;
      }
    }

    // Daño al jugador (la embestida lo hace invulnerable)
    const hb = player.hurtbox;
    for (const e of enemies) if (e.alive && overlap(hb, e)) hurtPlayer();
    for (const s of enemyShots) {
      if (s.alive && overlap(hb, s)) { s.alive = false; hurtPlayer(); }
    }

    // Jefe derrotado
    if (boss && !boss.alive && state === 'playing') {
      state = 'victory';
      enemyShots = [];
      for (const e of enemies) if (e !== boss) e.alive = false; // los cráneos que queden desaparecen
      for (let i = 0; i < 6; i++) {
        particles.burst(boss.x + (Math.random() - 0.5) * 30, boss.y + (Math.random() - 0.5) * 30, boss.color, 24, 150);
      }
      shake = 8;
      music.stop(true);
      sfx.bossDie();
    }

    enemies = enemies.filter((e) => e.alive && (e === boss || e.x > camX - 80));
    shots = shots.filter((s) => s.alive);
    enemyShots = enemyShots.filter((s) => s.alive);
  } else if (input.anyRestartPressed()) {
    if (state === 'victory' && levelIndex < levels.length - 1) loadLevel(levelIndex + 1, player.hp);
    else if (state === 'victory') loadLevel(0); // terminó todos los niveles disponibles
    else loadLevel(levelIndex); // reintentar el nivel actual
  }

  particles.update(dt);
  shake = Math.max(0, shake - dt * 20);
}

function drawHud() {
  // Vida del jugador
  ctx.font = '8px monospace';
  ctx.textAlign = 'left';
  ctx.fillStyle = '#9fb4c8';
  ctx.fillText('VIDA', 8, 14);
  for (let i = 0; i < player.maxHp; i++) {
    ctx.fillStyle = i < player.hp ? '#4fd8ff' : '#1d2a38';
    ctx.fillRect(34 + i * 9, 7, 7, 7);
  }
  ctx.textAlign = 'right';
  ctx.fillStyle = '#9fb4c8';
  ctx.fillText(`NIVEL ${levelIndex + 1}/${levels.length}`, W - 8, 14);
  if (music.muted) {
    ctx.fillStyle = '#ff7b7b';
    ctx.fillText('MUDO [M]', W - 8, 24);
  }

  // Barra del jefe
  if (boss && boss.alive) {
    ctx.textAlign = 'center';
    ctx.fillStyle = '#d0a0e0';
    ctx.fillText(boss.name, W / 2, 161);
    ctx.fillStyle = '#2a1a3a';
    ctx.fillRect(80, 165, 160, 6);
    ctx.fillStyle = '#c0405a';
    ctx.fillRect(80, 165, Math.round(160 * Math.max(0, boss.hp) / boss.maxHp), 6);
  }

  // Ayuda inicial (solo en el primer nivel)
  if (levelIndex === 0 && time > 2.6 && time < 9 && state === 'playing') {
    ctx.globalAlpha = Math.min(1, 9 - time);
    ctx.textAlign = 'center';
    ctx.fillStyle = '#9fb4c8';
    ctx.fillText('FLECHAS mover  ·  Z embestida  ·  X plasma  ·  M música', W / 2, 30);
    ctx.fillText('Avanza a la derecha hasta el final →', W / 2, 42);
    ctx.globalAlpha = 1;
  }

  // Título del nivel al empezar
  if (time < 2.6 && state === 'playing') {
    ctx.globalAlpha = Math.min(1, (2.6 - time) * 1.5, time * 3);
    ctx.textAlign = 'center';
    ctx.fillStyle = '#e0e8f0';
    ctx.font = 'bold 14px monospace';
    ctx.fillText(`NIVEL ${levelIndex + 1}`, W / 2, 74);
    ctx.fillStyle = '#9fb4c8';
    ctx.font = '8px monospace';
    ctx.fillText(level.name.toUpperCase(), W / 2, 88);
    ctx.globalAlpha = 1;
  }
}

function drawOverlay(title, sub, color) {
  ctx.fillStyle = 'rgba(0,0,0,0.65)';
  ctx.fillRect(0, 0, W, H);
  ctx.textAlign = 'center';
  ctx.fillStyle = color;
  ctx.font = 'bold 14px monospace';
  ctx.fillText(title, W / 2, 80);
  ctx.fillStyle = '#e0e8f0';
  ctx.font = '8px monospace';
  ctx.fillText(sub, W / 2, 98);
  ctx.fillStyle = '#9fb4c8';
  ctx.font = '7px monospace';
  ctx.fillText('ENTER · ESPACIO · Z · X · CLIC', W / 2, 115);
}

function draw() {
  ctx.save();
  if (shake > 0) ctx.translate(Math.round((Math.random() - 0.5) * shake), Math.round((Math.random() - 0.5) * shake));

  level.draw(ctx, time, camX);
  for (const e of enemies) e.draw(ctx, camX);
  for (const s of shots) s.draw(ctx, camX);
  for (const s of enemyShots) s.draw(ctx, camX);
  if (player.hp > 0) player.draw(ctx, time, camX);
  particles.draw(ctx, camX);
  ctx.restore();

  drawHud();
  if (state === 'gameover') {
    drawOverlay('HAS CAÍDO', 'Reintentar este nivel', '#ff5a5a');
  }
  if (state === 'victory') {
    const more = levelIndex < levels.length - 1;
    drawOverlay(
      `NIVEL ${levelIndex + 1} COMPLETADO`,
      more ? 'Avanzar al siguiente nivel' : '¡Completaste todos los niveles!',
      '#4fd8ff'
    );
  }
}

let last = performance.now();

function frame(now) {
  try {
    const dt = Math.min((now - last) / 1000, 1 / 30);
    last = now;
    time += dt;

    update(dt);
    draw();
  } catch (err) {
    console.error('Error en el bucle principal del juego:', err);
  } finally {
    input.endFrame();
    requestAnimationFrame(frame);
  }
}

requestAnimationFrame(frame);