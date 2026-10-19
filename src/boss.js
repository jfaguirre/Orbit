import { Enemy } from './enemies.js';
import { EnemyShot } from './projectile.js';
import { sfx } from './audio.js';

// Jefe del nivel 1: Espectro Segador
// Fase 1: flota y dispara abanicos. Fase 2 (mitad de vida): más rápido y embiste.
export class Boss extends Enemy {
  constructor(homeX) {
    super(homeX + 120, 80, 18, 260);
    this.name = 'ESPECTRO SEGADOR';
    this.maxHp = 260;
    this.homeX = homeX;
    this.state = 'enter'; // enter → idle → telegraph → charge → return → idle
    this.fireCd = 1.0;
    this.chargeCd = 3.6;
    this.timer = 0;
    this.color = '200,120,255';
  }

  get enraged() { return this.hp <= this.maxHp / 2; }

  // No recibe daño mientras hace su entrada
  damage(n = 1) {
    if (this.state === 'enter') return;
    super.damage(n);
  }

  fan(w) {
    const rage = this.enraged;
    const n = rage ? 7 : 4;
    const base = Math.atan2(w.player.y - this.y, w.player.x - this.x);
    for (let i = 0; i < n; i++) {
      const a = base + (i - (n - 1) / 2) * (rage ? 0.22 : 0.28);
      w.enemyShots.push(new EnemyShot(this.x - 12, this.y, a, rage ? 120 : 95));
    }
    sfx.enemyShoot();
  }

  update(dt, w) {
    this.tick(dt);
    const p = w.player;
    const rage = this.enraged;

    if (this.state === 'enter') {
      this.x += (this.homeX - this.x) * Math.min(1, dt * 2.5);
      if (Math.abs(this.x - this.homeX) < 2) { this.x = this.homeX; this.state = 'idle'; }
    } else if (this.state === 'idle') {
      this.x = this.homeX + Math.sin(this.age * 1.3) * 12;
      this.y = 82 + Math.sin(this.age * (rage ? 2.4 : 1.5)) * 38;
      this.fireCd -= dt;
      if (this.fireCd <= 0) {
        this.fan(w);
        this.fireCd = rage ? 0.95 : 1.4;
      }
      this.chargeCd -= dt;
      if (this.chargeCd <= 0) {
        this.state = 'telegraph';
        this.timer = rage ? 0.55 : 0.75;
        sfx.bossRoar();
      }
    } else if (this.state === 'telegraph') {
      this.timer -= dt;
      // Sigue la altura del jugador y se detiene justo antes de embestir
      if (this.timer > 0.2) this.y += (p.y - this.y) * Math.min(1, dt * 9);
      if (this.timer <= 0) this.state = 'charge';
    } else if (this.state === 'charge') {
      this.x -= (rage ? 360 : 310) * dt;
      if (this.x < w.camX + 24) this.state = 'return';
    } else if (this.state === 'return') {
      const dx = this.homeX - this.x;
      this.x += Math.sign(dx) * Math.min(Math.abs(dx), (rage ? 200 : 160) * dt);
      this.y += (82 - this.y) * Math.min(1, dt * 3.5);
      if (Math.abs(dx) < 3) {
        this.state = 'idle';
        this.chargeCd = rage ? 2.4 : 3.6;
        if (rage) {
          // En furia invoca refuerzos de murciélagos espectrales
          w.spawn('bat', w.camX + W + 15, 45);
          w.spawn('bat', w.camX + W + 15, 105);
        }
      }
    }
  }

  draw(ctx, camX) {
    const x = Math.round(this.x - camX);
    const y = Math.round(this.y);
    const rage = this.enraged;
    const tele = this.state === 'telegraph';

    // Línea de aviso de la embestida
    if (tele) {
      ctx.save();
      ctx.globalAlpha = 0.25 + 0.2 * Math.sin(this.age * 30);
      ctx.fillStyle = '#ff4040';
      ctx.fillRect(0, y - 1, Math.max(0, x), 2);
      ctx.restore();
    }

    // Aura
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    const g = ctx.createRadialGradient(x, y, 4, x, y, 42);
    g.addColorStop(0, rage ? 'rgba(255,60,60,0.25)' : 'rgba(160,90,255,0.25)');
    g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.arc(x, y, 42, 0, Math.PI * 2); ctx.fill();
    ctx.restore();

    // Guadaña
    ctx.strokeStyle = this.tint('#5a4a3a');
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(x - 18, y + 20); ctx.lineTo(x - 14, y - 24); ctx.stroke();
    ctx.fillStyle = this.tint('#9aa0b8');
    ctx.beginPath(); ctx.moveTo(x - 14, y - 24); ctx.quadraticCurveTo(x - 32, y - 24, x - 34, y - 12); ctx.quadraticCurveTo(x - 26, y - 20, x - 14, y - 20); ctx.fill();

    // Capa con dobladillo ondulante
    ctx.fillStyle = this.tint('#1a1026');
    ctx.beginPath();
    ctx.arc(x, y - 4, 14, Math.PI, 0);
    for (let i = 0; i <= 8; i++) ctx.lineTo(x + 16 - i * 4, y + 20 + Math.sin(this.age * 6 + i) * 3);
    ctx.closePath();
    ctx.fill();

    // Calavera
    ctx.fillStyle = this.tint('#cfc9b8');
    ctx.beginPath(); ctx.arc(x, y - 5, 7, 0, Math.PI * 2); ctx.fill();
    ctx.fillRect(x - 4, y, 8, 4);
    ctx.fillStyle = '#120a1a';
    ctx.fillRect(x - 5, y - 7, 3, 4);
    ctx.fillRect(x + 2, y - 7, 3, 4);
    ctx.fillRect(x - 3, y + 2, 1, 2);
    ctx.fillRect(x, y + 2, 1, 2);
    ctx.fillRect(x + 2, y + 2, 1, 2);
    ctx.fillStyle = tele ? '#ff2020' : rage ? '#ff6a3d' : '#ffb02e';
    ctx.fillRect(x - 4, y - 6, 2, 2);
    ctx.fillRect(x + 3, y - 6, 2, 2);
  }
}