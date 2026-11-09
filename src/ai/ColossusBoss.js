import { BossAgent } from './BossAgent.js';
import { BOSS_CONFIG } from '../config/bossConfig.js';
import { HabilidadSaltoAplastante } from './skills/HabilidadSaltoAplastante.js';
import { HabilidadInvocarEsbirros } from './skills/HabilidadInvocarEsbirros.js';
import { W, GROUND } from '../config/gameConfig.js';
import { clamp } from '../utils.js';

/**
 * Jefe del Nivel 2: Coloso de Huesos
 * Refactorizado a arquitectura agéntica con habilidades desacopladas en español:
 * - HabilidadSaltoAplastante: Salto, impacto y ondas concéntricas de fuego
 * - HabilidadInvocarEsbirros: Invocación de cráneos en llamas durante furia
 */
export class ColossusBoss extends BossAgent {
  constructor(homeX) {
    const cfg = BOSS_CONFIG.colossus;
    super(homeX + cfg.spawnOffsetX, GROUND - 16, cfg.radius, cfg.maxHp, cfg);
    this.homeX = homeX;
    this.color = cfg.color;
    this.vx = 0;
    this.vy = 0;
    this.landings = 0;

    // Registro modular de habilidades del agente
    this.habilidadSalto = this.registrarHabilidad(new HabilidadSaltoAplastante(cfg));
    this.habilidadInvocacion = this.registrarHabilidad(new HabilidadInvocarEsbirros(cfg.summon));

    // Compatibilidad
    this.slamSkill = this.habilidadSalto;
    this.summonSkill = this.habilidadInvocacion;
  }

  // Fachada para pruebas y compatibilidad
  fireVolley(w, offset = 0) {
    this.habilidadSalto.dispararRafagaAnillo(this, w, offset);
  }

  update(dt, w) {
    this.tick(dt);
    this.actualizarHabilidades(dt);
    this.habilidadSalto.actualizarRafagas(dt, this, w);

    const rage = this.enraged;
    const floorY = GROUND - 16;
    const cfg = this.configuracion;

    if (this.state === 'enter') {
      this.x += (this.homeX - this.x) * Math.min(1, dt * 2.5);
      if (Math.abs(this.x - this.homeX) < 2) {
        this.x = this.homeX;
        this.state = 'idle';
      }
    } else if (this.state === 'idle') {
      if (this.habilidadSalto.puedeEjecutarse()) {
        this.habilidadSalto.iniciarAgachado(this);
        this.state = 'crouch';
      }
    } else if (this.state === 'crouch') {
      const listoParaSaltar = this.habilidadSalto.actualizarAgachado(dt);
      if (listoParaSaltar) {
        this.habilidadSalto.iniciarSalto(this, w);
        this.state = 'jump';
      }
    } else if (this.state === 'jump') {
      this.vy += (cfg.jump?.gravity || 620) * dt;
      this.x += this.vx * dt;
      this.y += this.vy * dt;
      this.x = clamp(this.x, w.camX + 24, w.camX + W - 24);

      if (this.vy > 0 && this.y >= floorY) {
        this.y = floorY;
        this.vx = 0;
        this.vy = 0;
        this.state = 'idle';
        this.landings++;

        // Ejecutar impacto y ráfagas
        this.habilidadSalto.alAterrizar(this, w);

        // En furia suelta cráneos en cada aterrizaje
        if (rage) {
          this.habilidadInvocacion.ejecutar(this, w);
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
    ctx.beginPath();
    ctx.arc(x, y, 44, 0, Math.PI * 2);
    ctx.fill();
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
    ctx.moveTo(-12, -24);
    ctx.lineTo(-17, -8);
    ctx.moveTo(12, -24);
    ctx.lineTo(17, -8);
    ctx.stroke();

    ctx.fillStyle = bone;
    ctx.beginPath();
    ctx.arc(-17, -6, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(17, -6, 3, 0, Math.PI * 2);
    ctx.fill();

    // Caja torácica
    ctx.beginPath();
    ctx.ellipse(0, -18, 12, 10, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = dark;
    ctx.fillRect(-9, -22, 18, 1);
    ctx.fillRect(-9, -18, 18, 1);
    ctx.fillRect(-9, -14, 18, 1);
    ctx.fillRect(0, -26, 1, 14);

    // Cráneo
    ctx.fillStyle = this.tint('#d8d0b8');
    ctx.beginPath();
    ctx.arc(0, -31, 7, 0, Math.PI * 2);
    ctx.fill();
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
