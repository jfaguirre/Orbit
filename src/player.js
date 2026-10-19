import { GROUND } from './config.js';
import { input } from './input.js';
import { PlasmaShot } from './projectile.js';
import { sfx } from './audio.js';

const ACCEL = 700;        // qué tan rápido arranca
const DAMPING = 4.5;      // menor = más "resbaladizo" (efecto plasma)
const MAX_SPEED = 90;
const DASH_SPEED = 280;
const DASH_TIME = 0.15;   // 280 * 0.15 ≈ 42 px de embestida
const DASH_COOLDOWN = 0.52;
const SHOOT_COOLDOWN = 0.16;
const INVULN_TIME = 0.9;   // segundos de invulnerabilidad tras recibir daño

export class Player {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.vx = 0;
    this.vy = 0;
    this.r = 6;
    this.facing = 1;
    this.hp = 5;
    this.maxHp = 5;
    this.invuln = 0;
    this.dashTimer = 0;
    this.dashCd = 0;
    this.dashDirX = 1;
    this.dashDirY = 0;
    this.shootCd = 0;
    this.trail = [];
    this.stretch = 1;
    this.angle = 0;
  }

  get dashing() { return this.dashTimer > 0; }

  // Hitbox más pequeña que el dibujo: más justo para el jugador
  get hurtbox() { return { x: this.x, y: this.y, r: this.r - 2 }; }

  // Devuelve true si realmente recibió el golpe
  hit() {
    if (this.invuln > 0 || this.dashing) return false;
    this.hp -= 1;
    this.invuln = INVULN_TIME;
    this.vx = -this.facing * 120; // empujón
    this.vy = -40;
    return true;
  }

  // bounds = { min, max } límites horizontales en coordenadas del mundo
  update(dt, shots, bounds) {
    const ax = input.axisX;
    const ay = input.axisY;
    if (ax !== 0) this.facing = ax;

    this.dashCd = Math.max(0, this.dashCd - dt);
    this.shootCd = Math.max(0, this.shootCd - dt);
    this.invuln = Math.max(0, this.invuln - dt);

    // --- Embestida (Z) ---
    if (input.wasPressed('KeyZ') && this.dashCd === 0 && !this.dashing) {
      let dx = ax, dy = ay;
      if (dx === 0 && dy === 0) dx = this.facing; // sin dirección: hacia donde mira
      const len = Math.hypot(dx, dy);
      this.dashDirX = dx / len;
      this.dashDirY = dy / len;
      this.dashTimer = DASH_TIME;
      this.dashCd = DASH_COOLDOWN;
      sfx.dash();
    }

    if (this.dashing) {
      this.dashTimer -= dt;
      this.vx = this.dashDirX * DASH_SPEED;
      this.vy = this.dashDirY * DASH_SPEED;
      if (this.dashTimer <= 0) { // al terminar conserva algo de inercia
        this.vx = this.dashDirX * MAX_SPEED;
        this.vy = this.dashDirY * MAX_SPEED;
      }
    } else {
      // Movimiento fluido con inercia
      this.vx += ax * ACCEL * dt;
      this.vy += ay * ACCEL * dt;
      const damp = Math.exp(-DAMPING * dt);
      this.vx *= damp;
      this.vy *= damp;
      const sp = Math.hypot(this.vx, this.vy);
      if (sp > MAX_SPEED && this.invuln < INVULN_TIME - 0.25) { // deja que el empujón se note
        this.vx = (this.vx / sp) * MAX_SPEED;
        this.vy = (this.vy / sp) * MAX_SPEED;
      }
    }

    // --- Disparo (X, mantener para ráfaga; diagonal con dos flechas) ---
    if (input.isDown('KeyX') && this.shootCd === 0) {
      let dx = this.facing, dy = 0;
      if (ax !== 0 || ay !== 0) { dx = ax; dy = ay; }
      const len = Math.hypot(dx, dy);
      dx /= len;
      dy /= len;
      shots.push(new PlasmaShot(this.x + dx * (this.r + 3), this.y + dy * (this.r + 3), dx, dy));
      this.shootCd = SHOOT_COOLDOWN;
      this.vx -= dx * 12; // pequeño retroceso
      this.vy -= dy * 12;
      sfx.laser();
    }

    // --- Mover y limitar ---
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    const floor = GROUND - this.r;
    if (this.x < bounds.min + this.r) { this.x = bounds.min + this.r; this.vx = 0; }
    if (this.x > bounds.max - this.r) { this.x = bounds.max - this.r; this.vx = 0; }
    if (this.y < this.r) { this.y = this.r; this.vy = 0; }
    if (this.y > floor) { this.y = floor; this.vy = 0; }

    // --- Estela y deformación (squash & stretch) ---
    const life = this.dashing ? 0.25 : 0.18;
    this.trail.push({ x: this.x, y: this.y, life, max: life });
    for (const p of this.trail) p.life -= dt;
    this.trail = this.trail.filter((p) => p.life > 0);

    const speed = Math.hypot(this.vx, this.vy);
    const targetStretch = 1 + Math.min(speed / 250, 0.5);
    this.stretch += (targetStretch - this.stretch) * Math.min(1, dt * 14);
    if (speed > 5) this.angle = Math.atan2(this.vy, this.vx);
  }

  draw(ctx, t, camX) {
    const x = Math.round(this.x - camX);
    const y = Math.round(this.y);

    ctx.save();
    // Parpadeo mientras es invulnerable por el golpe
    if (this.invuln > 0 && Math.floor(t * 18) % 2 === 0) ctx.globalAlpha = 0.35;

    // Estela de plasma
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    for (const p of this.trail) {
      const a = p.life / p.max;
      ctx.fillStyle = `rgba(60, 200, 255, ${a * 0.35})`;
      ctx.beginPath();
      ctx.arc(Math.round(p.x - camX), Math.round(p.y), this.r * a, 0, Math.PI * 2);
      ctx.fill();
    }
    // Aura pulsante
    const pulse = 1 + Math.sin(t * 8) * 0.08;
    const ar = this.r * 2.6 * pulse;
    const g = ctx.createRadialGradient(x, y, 2, x, y, ar);
    g.addColorStop(0, 'rgba(79, 216, 255, 0.35)');
    g.addColorStop(1, 'rgba(79, 216, 255, 0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(x, y, ar, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Cuerpo metálico (se estira en la dirección del movimiento)
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(this.angle);
    ctx.scale(this.stretch, 1 / this.stretch);
    ctx.fillStyle = this.dashing ? '#bff6ff' : '#2b3347';
    ctx.beginPath();
    ctx.arc(0, 0, this.r, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = this.dashing ? '#ffffff' : '#4b5878';
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.restore();

    // Brillo y ojo
    ctx.fillStyle = '#5b6a8c';
    ctx.fillRect(x - 3, y - 3, 2, 1);
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.fillStyle = '#7ff0ff';
    ctx.beginPath();
    ctx.arc(x + this.facing * 2, y - 1, 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    ctx.restore();
  }
}