export class Particles {
  constructor() {
    this.list = [];
  }

  // color en formato 'r,g,b'
  burst(x, y, color, n = 10, speed = 80) {
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2;
      const s = speed * (0.3 + Math.random() * 0.7);
      const life = 0.3 + Math.random() * 0.4;
      this.list.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, life, max: life, color });
    }
  }

  update(dt) {
    const damp = Math.exp(-3 * dt);
    for (const p of this.list) {
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vx *= damp;
      p.vy *= damp;
      p.life -= dt;
    }
    this.list = this.list.filter((p) => p.life > 0);
  }

  draw(ctx, camX) {
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    for (const p of this.list) {
      ctx.fillStyle = `rgba(${p.color},${p.life / p.max})`;
      ctx.fillRect(Math.round(p.x - camX), Math.round(p.y), 2, 2);
    }
    ctx.restore();
  }
}