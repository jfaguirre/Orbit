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
// kind: 'orb' (naranja), 'laser' (verde, del platillo) o 'wave' (arco de luz, del fantasma)
export class EnemyShot {
    constructor(x, y, angle, speed = 80, kind = 'orb', scale = 1) {
    this.x = x;
    this.y = y;
    this.angle = angle;
    this.kind = kind;
    this.scale = scale; // tamaño del arco (solo para 'wave')
    this.vx = Math.cos(angle) * speed;
    this.vy = Math.sin(angle) * speed;
    this.r = kind === 'wave' ? 8 * scale : kind === 'laser' ? 3 : 2.5;
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
    if (this.kind === 'laser') {
      ctx.translate(x, y);
      ctx.rotate(this.angle);
      ctx.fillStyle = 'rgba(120, 255, 150, 0.25)';
      ctx.fillRect(-8, -3, 16, 6);
      ctx.fillStyle = '#7dff9a';
      ctx.fillRect(-6, -1, 12, 2);
      ctx.fillStyle = '#eafff0';
      ctx.fillRect(-5, 0, 10, 1);
      } else if (this.kind === 'wave') {
      const k = this.scale;
      ctx.translate(x, y);
      ctx.rotate(this.angle);
      ctx.lineCap = 'round';
      ctx.strokeStyle = 'rgba(255, 240, 170, 0.25)';
      ctx.lineWidth = 8;
      ctx.beginPath(); ctx.arc(-6 * k, 0, 12 * k, -1.0, 1.0); ctx.stroke();
      ctx.strokeStyle = '#fff3b0';
      ctx.lineWidth = 3;
      ctx.beginPath(); ctx.arc(-6 * k, 0, 12 * k, -1.0, 1.0); ctx.stroke();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1;
      ctx.beginPath(); ctx.arc(-6 * k, 0, 12 * k, -1.0, 1.0); ctx.stroke();
    } else {
      ctx.fillStyle = 'rgba(255, 90, 60, 0.25)';
      ctx.beginPath(); ctx.arc(x, y, 5, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#ff6a3d';
      ctx.beginPath(); ctx.arc(x, y, 2.5, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#ffe2b8';
      ctx.fillRect(x - 1, y - 1, 2, 2);
    }
    ctx.restore();
  }
}

