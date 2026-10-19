import { W, H, GROUND } from './config.js';

// Disparo del jugador
export class PlasmaShot {
  constructor(x, y, dx, dy) {
    this.x = x;
    this.y = y;
    this.vx = dx * 280;
    this.vy = dy * 280;
    this.angle = Math.atan2(dy, dx);
    this.w = 10;
    this.h = 3;
    this.r = 3; // radio de colisión
    this.alive = true;
  }

  update(dt, camX) {
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    if (this.x < camX - 20 || this.x > camX + W + 20 || this.y < -20 || this.y > GROUND) {
      this.alive = false;
    }
  }

  draw(ctx, camX) {
    ctx.save();
    ctx.translate(Math.round(this.x - camX), Math.round(this.y));
    ctx.rotate(this.angle);
    ctx.globalCompositeOperation = 'lighter';
    ctx.fillStyle = 'rgba(60, 200, 255, 0.25)'; // halo
    ctx.fillRect(-this.w / 2 - 2, -this.h / 2 - 2, this.w + 4, this.h + 4);
    ctx.fillStyle = '#4fd8ff'; // cuerpo
    ctx.fillRect(-this.w / 2, -this.h / 2, this.w, this.h);
    ctx.fillStyle = '#e8fbff'; // núcleo brillante
    ctx.fillRect(-this.w / 2 + 1, -0.5, this.w - 2, 1);
    ctx.restore();
  }
}

// Disparo de los enemigos
export class EnemyShot {
  constructor(x, y, angle, speed = 80) {
    this.x = x;
    this.y = y;
    this.vx = Math.cos(angle) * speed;
    this.vy = Math.sin(angle) * speed;
    this.r = 2.5;
    this.alive = true;
  }

  update(dt, camX) {
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    if (this.x < camX - 30 || this.x > camX + W + 30 || this.y < -30 || this.y > GROUND || this.y > H) {
      this.alive = false;
    }
  }

  draw(ctx, camX) {
    const x = Math.round(this.x - camX);
    const y = Math.round(this.y);
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.fillStyle = 'rgba(255, 90, 60, 0.25)';
    ctx.beginPath(); ctx.arc(x, y, 5, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#ff6a3d';
    ctx.beginPath(); ctx.arc(x, y, 2.5, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#ffe2b8';
    ctx.fillRect(x - 1, y - 1, 2, 2);
    ctx.restore();
  }
}