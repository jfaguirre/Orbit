import { BossAgent } from './BossAgent.js';
import { BOSS_CONFIG } from '../config/bossConfig.js';
import { HabilidadDisparoAbanico } from './skills/HabilidadDisparoAbanico.js';
import { HabilidadEmbestida } from './skills/HabilidadEmbestida.js';
import { HabilidadInvocarEsbirros } from './skills/HabilidadInvocarEsbirros.js';
import { W } from '../config/gameConfig.js';

/**
 * Jefe del Nivel 1: Espectro Segador
 * Refactorizado a arquitectura agéntica con habilidades desacopladas en español:
 * - HabilidadDisparoAbanico: Disparo en abanico
 * - HabilidadEmbestida: Embestida con aviso visual (telegraph)
 * - HabilidadInvocarEsbirros: Invocación de refuerzos (murciélagos)
 */
export class ReaperBoss extends BossAgent {
  constructor(homeX) {
    const cfg = BOSS_CONFIG.reaper;
    super(homeX + cfg.spawnOffsetX, cfg.spawnY, cfg.radius, cfg.maxHp, cfg);
    this.homeX = homeX;
    this.color = cfg.color;

    // Registro modular de habilidades del agente
    this.habilidadAbanico = this.registrarHabilidad(new HabilidadDisparoAbanico(cfg.fanAttack));
    this.habilidadEmbestida = this.registrarHabilidad(new HabilidadEmbestida(cfg.dashAttack));
    this.habilidadInvocacion = this.registrarHabilidad(new HabilidadInvocarEsbirros(cfg.summon));

    // Compatibilidad
    this.fanSkill = this.habilidadAbanico;
    this.dashSkill = this.habilidadEmbestida;
    this.summonSkill = this.habilidadInvocacion;
  }

  // Fachada para compatibilidad
  fan(w) {
    this.habilidadAbanico.ejecutar(this, w);
  }

  update(dt, w) {
    this.tick(dt);
    this.actualizarHabilidades(dt);
    const p = w.player;
    const rage = this.enraged;
    const cfg = this.configuracion;

    if (this.state === 'enter') {
      this.x += (this.homeX - this.x) * Math.min(1, dt * 2.5);
      if (Math.abs(this.x - this.homeX) < 2) {
        this.x = this.homeX;
        this.state = 'idle';
      }
    } else if (this.state === 'idle') {
      // Movimiento flotante senoidal basado en configuración
      this.x = this.homeX + Math.sin(this.age * cfg.float.frequencyX) * cfg.float.amplitudeX;
      const freqY = rage ? cfg.float.frequencyYRage : cfg.float.frequencyYNormal;
      this.y = cfg.float.baseY + Math.sin(this.age * freqY) * cfg.float.amplitudeY;

      // Habilidad 1: Disparo en abanico
      if (this.habilidadAbanico.puedeEjecutarse()) {
        this.habilidadAbanico.ejecutar(this, w);
      }

      // Habilidad 2: Embestida
      if (this.habilidadEmbestida.puedeEjecutarse()) {
        this.habilidadEmbestida.iniciarAviso(this);
        this.state = 'telegraph';
      }
    } else if (this.state === 'telegraph') {
      const listoParaEmbestir = this.habilidadEmbestida.actualizarAviso(dt, this, p);
      if (listoParaEmbestir) {
        this.state = 'charge';
      }
    } else if (this.state === 'charge') {
      this.x -= this.habilidadEmbestida.obtenerVelocidadEmbestida(this) * dt;
      if (this.x < w.camX + cfg.dashAttack.minReturnXOffset) {
        this.state = 'return';
      }
    } else if (this.state === 'return') {
      const dx = this.homeX - this.x;
      this.x += Math.sign(dx) * Math.min(Math.abs(dx), this.habilidadEmbestida.obtenerVelocidadRegreso(this) * dt);
      this.y += (cfg.float.baseY - this.y) * Math.min(1, dt * 3.5);

      if (Math.abs(dx) < 3) {
        this.state = 'idle';
        this.habilidadEmbestida.finalizar(this);

        // Habilidad 3: Invocación en fase de furia al regresar
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
    const tele = this.state === 'telegraph';

    // Línea de aviso de la embestida delegada
    if (tele) {
      this.dibujarLineaAviso(ctx, y, x, '#ff4040');
    }

    // Aura
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    const g = ctx.createRadialGradient(x, y, 4, x, y, 42);
    g.addColorStop(0, rage ? 'rgba(255,60,60,0.25)' : 'rgba(160,90,255,0.25)');
    g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(x, y, 42, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Guadaña
    ctx.strokeStyle = this.tint('#5a4a3a');
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x - 18, y + 20);
    ctx.lineTo(x - 14, y - 24);
    ctx.stroke();

    ctx.fillStyle = this.tint('#9aa0b8');
    ctx.beginPath();
    ctx.moveTo(x - 14, y - 24);
    ctx.quadraticCurveTo(x - 32, y - 24, x - 34, y - 12);
    ctx.quadraticCurveTo(x - 26, y - 20, x - 14, y - 20);
    ctx.fill();

    // Capa con dobladillo ondulante
    ctx.fillStyle = this.tint('#1a1026');
    ctx.beginPath();
    ctx.arc(x, y - 4, 14, Math.PI, 0);
    for (let i = 0; i <= 8; i++) {
      ctx.lineTo(x + 16 - i * 4, y + 20 + Math.sin(this.age * 6 + i) * 3);
    }
    ctx.closePath();
    ctx.fill();

    // Calavera
    ctx.fillStyle = this.tint('#cfc9b8');
    ctx.beginPath();
    ctx.arc(x, y - 5, 7, 0, Math.PI * 2);
    ctx.fill();
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
