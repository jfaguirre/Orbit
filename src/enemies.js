import { W, GROUND } from './config.js';
import { EnemyShot } from './projectile.js';
import { sfx } from './audio.js';

// Base común para todos los enemigos (el jefe también la usa)
export class Enemy {
  constructor(x, y, r, hp) {
    this.x = x;
    this.y = y;
    this.r = r;
    this.hp = hp;
    this.alive = true;
    this.age = 0;
    this.flash = 0;
    this.color = '255,90,90'; // color de las partículas al morir ('r,g,b')
  }

  damage(n = 1) {
    this.hp -= n;
    this.flash = 0.08;
    if (this.hp <= 0) this.alive = false;
  }

  tick(dt) {
    this.age += dt;
    this.flash = Math.max(0, this.flash - dt);
  }

  tint(c) { return this.flash > 0 ? '#ffffff' : c; } // blanco al recibir daño

  onScreen(camX, m = 8) { return this.x > camX + m && this.x < camX + W - m; }
}

// 1. Murciélago espectral: volador, avanza en ondas
class Bat extends Enemy {
  constructor(x, y) {
    super(x, y, 5, 2); // 2 golpes
    this.baseY = y;
    this.phase = Math.random() * 6;
    this.color = '170,90,255';
  }

  update(dt) {
    this.tick(dt);
    this.x -= 65 * dt; // más rápido
    this.y = this.baseY + Math.sin(this.age * 5 + this.phase) * 26;
  }

  draw(ctx, camX) {
    const x = Math.round(this.x - camX);
    const y = Math.round(this.y);
    if (x < -20 || x > W + 20) return;
    const flap = Math.sin(this.age * 22) * 5;
    ctx.fillStyle = this.tint('#2a1a3d');
    ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x - 10, y - 4 + flap); ctx.lineTo(x - 6, y + 2); ctx.lineTo(x, y + 3); ctx.fill();
    ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + 10, y - 4 + flap); ctx.lineTo(x + 6, y + 2); ctx.lineTo(x, y + 3); ctx.fill();
    ctx.beginPath(); ctx.arc(x, y, 3, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#ff4040';
    ctx.fillRect(x - 2, y - 1, 1, 1);
    ctx.fillRect(x + 1, y - 1, 1, 1);
  }
}

// 2. Rata de cripta: terrestre, patrulla y persigue si te acercas
class Rat extends Enemy {
  constructor(x) {
    super(x, GROUND - 5, 5, 3); // 3 golpes
    this.home = x;
    this.dir = -1;
    this.color = '170,140,110';
  }

  update(dt, w) {
    this.tick(dt);
    const dx = w.player.x - this.x;
    if (Math.abs(dx) < 130) { // persigue más rápido y desde más lejos
      this.dir = Math.sign(dx) || 1;
      this.x += this.dir * 95 * dt;
    } else { // patrulla
      if (this.x > this.home + 60) this.dir = -1;
      else if (this.x < this.home - 60) this.dir = 1;
      this.x += this.dir * 40 * dt;
    }
  }

  draw(ctx, camX) {
    const x = Math.round(this.x - camX);
    const y = Math.round(this.y);
    if (x < -20 || x > W + 20) return;
    const d = this.dir;
    const leg = Math.sin(this.age * 24) > 0 ? 1 : 0;
    ctx.fillStyle = this.tint('#4a3f38');
    ctx.beginPath(); ctx.ellipse(x, y, 6, 4, 0, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(x + d * 6, y - 1, 3, 0, Math.PI * 2); ctx.fill();
    ctx.fillRect(x - 3 + leg, y + 3, 1, 2);
    ctx.fillRect(x + 2 - leg, y + 3, 1, 2);
    ctx.strokeStyle = this.tint('#6a5a50');
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(x - d * 6, y); ctx.lineTo(x - d * 11, y - 3); ctx.stroke();
    ctx.fillStyle = '#ff4040';
    ctx.fillRect(x + d * 7, y - 2, 1, 1);
  }
}

// 3. Ojo flotante: volador, flota y dispara hacia el jugador
class Eye extends Enemy {
  constructor(x, y) {
    super(x, y, 6, 3); // 3 golpes
    this.baseY = y;
    this.cd = 0.8 + Math.random() * 0.5; // dispara antes al aparecer
    this.lookX = -1;
    this.lookY = 0;
    this.color = '255,220,220';
  }

  update(dt, w) {
    this.tick(dt);
    const p = w.player;
    this.x += Math.sign(p.x - this.x) * 20 * dt;
    this.y = this.baseY + Math.sin(this.age * 2.5) * 12;
    const a = Math.atan2(p.y - this.y, p.x - this.x);
    this.lookX = Math.cos(a);
    this.lookY = Math.sin(a);
    if (!this.onScreen(w.camX)) return;
    this.cd -= dt;
    if (this.cd <= 0) {
      w.enemyShots.push(new EnemyShot(this.x, this.y, a, 105)); // proyectiles más veloces
      this.cd = 1.5; // cadencia aumentada
      sfx.enemyShoot();
    }
  }

  draw(ctx, camX) {
    const x = Math.round(this.x - camX);
    const y = Math.round(this.y);
    if (x < -20 || x > W + 20) return;
    const warn = this.cd < 0.4;
    ctx.fillStyle = this.tint(warn ? '#e8b8b8' : '#d8d0dc');
    ctx.beginPath(); ctx.arc(x, y, 6, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#a05060';
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(x - 6, y - 1); ctx.lineTo(x - 3, y - 2); ctx.moveTo(x + 6, y + 1); ctx.lineTo(x + 3, y + 2); ctx.stroke();
    ctx.fillStyle = warn ? '#ff3030' : '#1a0f1f';
    ctx.beginPath(); ctx.arc(x + this.lookX * 2.5, y + this.lookY * 2.5, 2.5, 0, Math.PI * 2); ctx.fill();
  }
}

// 4. Ídolo de piedra: terrestre, no se mueve y dispara un abanico de 5 tiros
class Idol extends Enemy {
  constructor(x) {
    super(x, GROUND - 8, 8, 7); // 7 golpes
    this.cd = 1.0;
    this.dir = -1;
    this.color = '150,150,180';
  }

  update(dt, w) {
    this.tick(dt);
    this.dir = w.player.x < this.x ? -1 : 1;
    if (!this.onScreen(w.camX)) return;
    this.cd -= dt;
    if (this.cd <= 0) {
      const base = this.dir < 0 ? Math.PI : 0;
      for (const off of [-0.45, -0.22, 0, 0.22, 0.45]) {
        w.enemyShots.push(new EnemyShot(this.x + this.dir * 8, this.y - 3, base + off, 90));
      }
      this.cd = 1.8;
      sfx.enemyShoot();
    }
  }

  draw(ctx, camX) {
    const x = Math.round(this.x - camX);
    const y = Math.round(this.y);
    if (x < -20 || x > W + 20) return;
    ctx.fillStyle = this.tint('#33333f'); ctx.fillRect(x - 7, y - 8, 14, 16);
    ctx.fillStyle = this.tint('#454556'); ctx.fillRect(x - 7, y - 8, 14, 3);
    ctx.fillStyle = '#1d1d26'; ctx.fillRect(x - 5, y + 3, 10, 1);
    ctx.fillStyle = this.cd < 0.5 ? '#ff5a2a' : '#7a6a3a';
    ctx.fillRect(x - 4, y - 3, 3, 2);
    ctx.fillRect(x + 1, y - 3, 3, 2);
  }
}

// 5. Araña saltarina: terrestre, salta hacia el jugador
class Spider extends Enemy {
  constructor(x) {
    super(x, GROUND - 5, 5, 3); // 3 golpes
    this.vx = 0;
    this.vy = 0;
    this.cd = 0.6;
    this.air = false;
    this.color = '120,200,120';
  }

  update(dt, w) {
    this.tick(dt);
    const p = w.player;
    if (!this.air) {
      this.cd -= dt;
      const dx = p.x - this.x;
      if (this.cd <= 0 && Math.abs(dx) < 170 && this.onScreen(w.camX)) {
        this.air = true;
        this.vy = -220; // salto más alto
        this.vx = Math.sign(dx) * (Math.abs(dx) > 40 ? 115 : 60); // salto más rápido
      }
    } else {
      this.vy += 540 * dt;
      this.x += this.vx * dt;
      this.y += this.vy * dt;
      if (this.y >= GROUND - 5) {
        this.y = GROUND - 5;
        this.air = false;
        this.cd = 0.65;
        this.vx = 0;
        this.vy = 0;
      }
    }
  }

  draw(ctx, camX) {
    const x = Math.round(this.x - camX);
    const y = Math.round(this.y);
    if (x < -20 || x > W + 20) return;
    ctx.strokeStyle = this.tint('#2d5a34');
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let i = 0; i < 4; i++) {
      for (const s of [-1, 1]) {
        const wiggle = this.air ? -3 : Math.sin(this.age * 10 + i) * 1.5;
        ctx.moveTo(x + s * 2, y);
        ctx.lineTo(x + s * (5 + i), y + 4 + wiggle);
      }
    }
    ctx.stroke();
    ctx.fillStyle = this.tint('#1f3a24');
    ctx.beginPath(); ctx.arc(x, y, 4, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#ff4040';
    ctx.fillRect(x - 2, y - 2, 1, 1);
    ctx.fillRect(x + 1, y - 2, 1, 1);
  }
}


// 6. Cráneo en llamas: volador kamikaze, se detiene a apuntar y se lanza en línea recta
class Skull extends Enemy {
  constructor(x, y) {
    super(x, y, 5, 2); // 2 golpes
    this.state = 'wait'; // wait → aim → dash
    this.timer = 0;
    this.vx = 0;
    this.vy = 0;
    this.color = '255,150,60';
  }

  update(dt, w) {
    this.tick(dt);
    const p = w.player;
    if (this.state === 'wait') {
      this.x -= 40 * dt;
      if (this.onScreen(w.camX, 24)) { this.state = 'aim'; this.timer = 0.42; }
    } else if (this.state === 'aim') {
      this.timer -= dt;
      this.y += (p.y - this.y) * Math.min(1, dt * 5); // apunta y se alinea más rápido
      if (this.timer <= 0) {
        const a = Math.atan2(p.y - this.y, p.x - this.x);
        this.vx = Math.cos(a) * 210; // embestida mucho más rápida
        this.vy = Math.sin(a) * 210;
        this.state = 'dash';
        sfx.enemyShoot();
      }
    } else {
      this.x += this.vx * dt;
      this.y += this.vy * dt;
      if (this.y > GROUND || this.y < -10 || this.x < w.camX - 40 || this.x > w.camX + W + 60) this.alive = false;
    }
  }

  draw(ctx, camX) {
    const x = Math.round(this.x - camX);
    const y = Math.round(this.y);
    if (x < -20 || x > W + 20) return;
    const dashing = this.state === 'dash';
    let bx = 0, by = -1; // la llama sale hacia atrás
    if (dashing) { const l = Math.hypot(this.vx, this.vy) || 1; bx = -this.vx / l; by = -this.vy / l; }
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    for (let i = 1; i <= 3; i++) {
      const f = Math.sin(this.age * 30 + i) * 1;
      ctx.fillStyle = `rgba(255,${140 + i * 20},40,${0.4 - i * 0.08})`;
      ctx.beginPath(); ctx.arc(x + bx * i * 3 + f, y + by * i * 3, 5 - i, 0, Math.PI * 2); ctx.fill();
    }
    ctx.restore();
    ctx.fillStyle = this.tint('#cfc9b8');
    ctx.beginPath(); ctx.arc(x, y, 5, 0, Math.PI * 2); ctx.fill();
    ctx.fillRect(x - 3, y + 3, 6, 2);
    ctx.fillStyle = this.state === 'aim' ? '#ff2020' : '#1a0f1f';
    ctx.fillRect(x - 3, y - 2, 2, 2);
    ctx.fillRect(x + 1, y - 2, 2, 2);
  }
}


export function createEnemy(type, x, y) {
  switch (type) {
    case 'bat': return new Bat(x, y);
    case 'rat': return new Rat(x);
    case 'eye': return new Eye(x, y);
    case 'idol': return new Idol(x);
    case 'spider': return new Spider(x);
    case 'skull': return new Skull(x, y);
    default:
      console.warn(`Enemigo desconocido: ${type}`);
      return null;
  }
}