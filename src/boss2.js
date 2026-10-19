import { W, GROUND } from './config.js';
import { Enemy } from './enemies.js';
import { EnemyShot } from './projectile.js';
import { clamp } from './utils.js';
import { sfx } from './audio.js';

// Jefe del nivel 2: Coloso de Huesos
// Salta hacia el jugador y al aterrizar lanza ondas por el suelo.
// En fase 2 (mitad de vida) salta más seguido y suelta cráneos en llamas.

export class BoneColossus extends Enemy {
  constructor(homeX) {
    super(homeX + 140, GROUND - 16, 16, 340);
    this.name = 'COLOSO DE HUESOS';
    this.maxHp = 340;
    this.homeX = homeX;
    this.state = 'enter'; // enter → idle → crouch → jump → idle
    this.timer = 0;
    this.jumpCd = 1.6;
    this.landings = 0;
    this.vx = 0;
    this.vy = 0;
    this.color = '220,210,180';
    this.secondVolleyTimer = -1;
  }

  get enraged() { return this.hp <= this.maxHp / 2; }

  damage(n = 1) {
    if (this.state === 'enter') return;
    super.damage(n);
  }
  
  // Lanza una ráfaga circular de bolas de fuego.
  fireVolley(w, offset = 0) {
    const rage = this.enraged;
    const count = rage ? 22 : 18;
    const speed = rage ? 130 : 115;
    const originX = this.x;
    const originY = GROUND - 5;

    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count + offset;
      w.enemyShots.push(new EnemyShot(originX, originY, angle, speed));
    }
    sfx.enemyShoot();
  }

  update(dt, w) {
    this.tick(dt);
    const rage = this.enraged;
    const floorY = GROUND - 16;

    // Segunda ráfaga: se dispara poco después para entrelazar las balas
    if (this.secondVolleyTimer >= 0) {
      this.secondVolleyTimer -= dt;
      if (this.secondVolleyTimer <= 0) {
        const count = rage ? 22 : 18;
        this.fireVolley(w, Math.PI / count);
        this.secondVolleyTimer = -1;
      }
    }

    if (this.state === 'enter') {
      this.x += (this.homeX - this.x) * Math.min(1, dt * 2.5);
      if (Math.abs(this.x - this.homeX) < 2) { this.x = this.homeX; this.state = 'idle'; }
    } else if (this.state === 'idle') {
      this.jumpCd -= dt;
      if (this.jumpCd <= 0) {
        this.state = 'crouch';
        this.timer = rage ? 0.32 : 0.45;
      }
    } else if (this.state === 'crouch') {
      this.timer -= dt;
      if (this.timer <= 0) {
        const target = clamp(w.player.x, w.camX + 30, w.camX + W - 30);
        this.vx = clamp((target - this.x) / 0.85, -180, 180);
        this.vy = -285;
        this.state = 'jump';
        sfx.bossRoar();
      }
    } else if (this.state === 'jump') {
      this.vy += 620 * dt;
      this.x += this.vx * dt;
      this.y += this.vy * dt;
      this.x = clamp(this.x, w.camX + 24, w.camX + W - 24);
      if (this.vy > 0 && this.y >= floorY) {
        this.y = floorY;
        this.vx = 0;
        this.vy = 0;
        this.state = 'idle';
        this.jumpCd = rage ? 1.0 : 1.7;
        this.landings++;
        w.shake(7);
        sfx.bossSlam();
                        
        // Primera ráfaga circular al aterrizar
        this.fireVolley(w, 0);

        // Segunda ráfaga rápida entrelazada
        this.secondVolleyTimer = 0.26;

        // En furia suelta cráneos en cada aterrizaje
        if (rage) {
          w.spawn('skull', w.camX + W + 15, 45);
          w.spawn('skull', w.camX + W + 15, 85);
        }
      }
    }
  }

  draw(ctx, camX) {
    const x = Math.round(this.x - camX);
    const y = Math.round(this.y);
    const rage = this.enraged;
    const crouch = this.state === 'crouch';
    const shake = crouch ? Math.round(Math.sin(this.age * 60)) : 0;

    // Aura
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    const g = ctx.createRadialGradient(x, y, 4, x, y, 44);
    g.addColorStop(0, rage ? 'rgba(255,90,40,0.22)' : 'rgba(220,210,180,0.15)');
    g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.arc(x, y, 44, 0, Math.PI * 2); ctx.fill();
    ctx.restore();

    // Cuerpo: el origen está en los pies
    ctx.save();
    ctx.translate(x + shake, y + 16);
    if (crouch) ctx.scale(1.1, 0.8);
    else if (this.state === 'jump') ctx.scale(0.92, 1.12);

    const bone = this.tint('#cfc6ad');
    const dark = '#2e2820';

    // Piernas
    ctx.fillStyle = bone;
    ctx.fillRect(-9, -10, 5, 10);
    ctx.fillRect(4, -10, 5, 10);
    ctx.fillRect(-11, -2, 8, 2);
    ctx.fillRect(3, -2, 8, 2);

    // Brazos
    ctx.strokeStyle = bone;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(-12, -24); ctx.lineTo(-17, -8);
    ctx.moveTo(12, -24); ctx.lineTo(17, -8);
    ctx.stroke();
    ctx.fillStyle = bone;
    ctx.beginPath(); ctx.arc(-17, -6, 3, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(17, -6, 3, 0, Math.PI * 2); ctx.fill();

    // Caja torácica
    ctx.beginPath(); ctx.ellipse(0, -18, 12, 10, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = dark;
    ctx.fillRect(-9, -22, 18, 1);
    ctx.fillRect(-9, -18, 18, 1);
    ctx.fillRect(-9, -14, 18, 1);
    ctx.fillRect(0, -26, 1, 14);

    // Cráneo
    ctx.fillStyle = this.tint('#d8d0b8');
    ctx.beginPath(); ctx.arc(0, -31, 7, 0, Math.PI * 2); ctx.fill();
    ctx.fillRect(-4, -27, 8, 3);
    ctx.fillStyle = dark;
    ctx.fillRect(-5, -33, 3, 4);
    ctx.fillRect(2, -33, 3, 4);
    ctx.fillRect(-2, -26, 1, 2);
    ctx.fillRect(1, -26, 1, 2);
    ctx.fillStyle = crouch ? '#ff2020' : rage ? '#ff6a3d' : '#ffb02e';
    ctx.fillRect(-4, -32, 2, 2);
    ctx.fillRect(3, -32, 2, 2);
    ctx.restore();
  }
}