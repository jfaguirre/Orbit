import { W, GROUND } from './config.js';
import { Enemy } from './enemies.js';
import { EnemyShot } from './projectile.js';
import { clamp } from './utils.js';

// Jefe del nivel 3: Fantasma del Pantano
// Aparece y desaparece en lugares distintos. Al aparecer lanza una onda de luz en arco
// y, a ratos, suelta murciélagos cazadores. Con menos de la mitad de vida
// agrega un láser grueso que apunta al jugador (la embestida lo atraviesa).
export class SwampGhost extends Enemy {
  constructor(homeX) {
    super(homeX, 80, 14, 60);
    this.name = 'FANTASMA DEL PANTANO';
    this.maxHp = 60;
    this.state = 'hidden'; // hidden → fadein → visible → (charge → beam) → fadeout → hidden
    this.timer = 1.2;
    this.alpha = 0;
    this.batCd = 3;
    this.beamCd = 2;
    this.beamAngle = Math.PI;
    this.color = '170,255,220';
  }

  get enraged() { return this.hp <= this.maxHp / 2; }

  // Mientras no es visible por completo, los disparos y el contacto lo atraviesan
  get intangible() { return this.state === 'hidden' || this.state === 'fadein' || this.state === 'fadeout'; }

  damage(n = 1) {
    if (this.intangible) return;
    super.damage(n);
  }

  pickSpot(w) {
    for (let i = 0; i < 6; i++) {
      this.x = w.camX + 100 + Math.random() * (W - 140);
      this.y = 28 + Math.random() * 88;
      if (Math.hypot(w.player.x - this.x, w.player.y - this.y) > 55) break; // no aparece encima del Orbe
    }
  }

  wave(w) {
    const a = Math.atan2(w.player.y - this.y, w.player.x - this.x);
    const cx = Math.cos(a);
    const cy = Math.sin(a);
    if (!this.enraged) {
      // Fase 1: un solo arco de luz
      w.enemyShots.push(new EnemyShot(this.x + cx * 12, this.y + cy * 12, a, 95, 'wave'));
      return;
    }
    // Fase 2: tres arcos seguidos; el de adelante es el más chico y los de atrás crecen
    const scales = [0.7, 1, 1.35];
    scales.forEach((k, i) => {
      const d = 12 - i * 16; // distancia al jefe: 12, -4, -20
      w.enemyShots.push(new EnemyShot(this.x + cx * d, this.y + cy * d, a, 95, 'wave', k));
    });
  }

  // Segmento del láser: dirección y largo (se corta en el suelo)
  beamGeom() {
    const dx = Math.cos(this.beamAngle);
    const dy = Math.sin(this.beamAngle);
    let len = 420;
    if (dy > 0.001) len = Math.min(len, (GROUND - this.y) / dy);
    return { dx, dy, len };
  }

  update(dt, w) {
    this.tick(dt);
    const p = w.player;
    const rage = this.enraged;
    this.timer -= dt;
    this.batCd -= dt;

    if (this.state === 'hidden') {
      this.alpha = 0;
      if (this.timer <= 0) { this.pickSpot(w); this.state = 'fadein'; this.timer = 0.55; }
    } else if (this.state === 'fadein') {
      this.alpha = clamp(1 - this.timer / 0.55, 0, 1);
      if (this.timer <= 0) {
        this.alpha = 1;
        this.state = 'visible';
        this.timer = rage ? 1.3 : 1.7;
        this.wave(w); // al aparecer lanza la onda de luz
      }
    } else if (this.state === 'visible') {
      if (rage) this.beamCd -= dt;
      // Murciélagos cazadores en momentos aleatorios
      if (this.batCd <= 0) {
        const n = rage ? 2 : 1;
        for (let i = 0; i < n; i++) w.spawn('huntbat', this.x, this.y + i * 8);
        this.batCd = 3 + Math.random() * 3;
      }
      if (this.timer <= 0) {
        if (rage && this.beamCd <= 0) { this.state = 'charge'; this.timer = 1.1; }
        else { this.state = 'fadeout'; this.timer = 0.4; }
      }
    } else if (this.state === 'charge') {
      // Apunta al Orbe y fija el ángulo justo antes de disparar
      if (this.timer > 0.35) this.beamAngle = Math.atan2(p.y - this.y, p.x - this.x);
      if (this.timer <= 0) { this.state = 'beam'; this.timer = 0.6; w.shake(3); }
    } else if (this.state === 'beam') {
      const { dx, dy, len } = this.beamGeom();
      const t = clamp((p.x - this.x) * dx + (p.y - this.y) * dy, 0, len);
      const d = Math.hypot(p.x - (this.x + dx * t), p.y - (this.y + dy * t));
      if (d < 7 + p.hurtbox.r) w.hurt(); // la embestida (invulnerable) lo atraviesa
      if (this.timer <= 0) { this.beamCd = 6; this.state = 'fadeout'; this.timer = 0.4; }
    } else if (this.state === 'fadeout') {
      this.alpha = clamp(this.timer / 0.4, 0, 1);
      if (this.timer <= 0) { this.state = 'hidden'; this.timer = rage ? 0.6 : 0.95; }
    }
  }

  draw(ctx, camX) {
    if (this.alpha <= 0.01) return;
    const x = Math.round(this.x - camX);
    const y = Math.round(this.y + Math.sin(this.age * 3) * 2);
    const rage = this.enraged;

    // Láser: aviso fino al cargar, haz grueso al disparar
    if (this.state === 'charge' || this.state === 'beam') {
      const { dx, dy, len } = this.beamGeom();
      const ex = x + dx * len;
      const ey = y + dy * len;
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      ctx.lineCap = 'round';
      if (this.state === 'charge') {
        ctx.strokeStyle = this.timer > 0.35 ? 'rgba(255,240,170,0.3)' : 'rgba(255,90,90,0.6)';
        ctx.lineWidth = this.timer > 0.35 ? 1 : 2;
        ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(ex, ey); ctx.stroke();
      } else {
        ctx.strokeStyle = 'rgba(255,240,170,0.25)';
        ctx.lineWidth = 20;
        ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(ex, ey); ctx.stroke();
        ctx.strokeStyle = '#fff3b0';
        ctx.lineWidth = 12;
        ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(ex, ey); ctx.stroke();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 5;
        ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(ex, ey); ctx.stroke();
      }
      ctx.restore();
    }

    ctx.save();
    ctx.globalAlpha = this.alpha * 0.9;

    // Aura
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    const g = ctx.createRadialGradient(x, y, 4, x, y, 40);
    g.addColorStop(0, rage ? 'rgba(255,220,140,0.3)' : 'rgba(140,255,210,0.25)');
    g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.arc(x, y, 40, 0, Math.PI * 2); ctx.fill();
    ctx.restore();

    // Brazos
    ctx.fillStyle = this.tint('#bfe0d8');
    ctx.beginPath(); ctx.moveTo(x - 10, y + 2); ctx.lineTo(x - 26, y + 12 + Math.sin(this.age * 4) * 3); ctx.lineTo(x - 9, y + 9); ctx.fill();
    ctx.beginPath(); ctx.moveTo(x + 10, y + 2); ctx.lineTo(x + 26, y + 12 + Math.sin(this.age * 4 + 1) * 3); ctx.lineTo(x + 9, y + 9); ctx.fill();

    // Túnica con cola ondulante
    ctx.fillStyle = this.tint('#d6efe8');
    ctx.beginPath();
    ctx.arc(x, y - 2, 13, Math.PI, 0);
    for (let i = 0; i <= 8; i++) {
      ctx.lineTo(x + 13 - i * 3.25, y + 18 + Math.sin(this.age * 5 + i * 1.3) * 4 + (i % 2 ? 3 : 0));
    }
    ctx.closePath();
    ctx.fill();

    // Rostro hueco
    ctx.fillStyle = '#0b1412';
    ctx.beginPath(); ctx.ellipse(x - 5, y - 3, 2.5, 4, 0, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(x + 5, y - 3, 2.5, 4, 0, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(x, y + 7, 3, 4.5, 0, 0, Math.PI * 2); ctx.fill();
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.fillStyle = rage ? '#ffe9a0' : '#9dffe0';
    ctx.fillRect(x - 6, y - 4, 2, 2);
    ctx.fillRect(x + 4, y - 4, 2, 2);
    ctx.restore();

    ctx.restore();
  }
}