import { BossAgent } from './BossAgent.js';
import { BOSS_CONFIG } from '../config/bossConfig.js';
import { HabilidadTripleArco } from './skills/HabilidadTripleArco.js';
import { HabilidadRayoMortal } from './skills/HabilidadRayoMortal.js';
import { HabilidadInvocarEsbirros } from './skills/HabilidadInvocarEsbirros.js';
import { W, GROUND } from '../config/gameConfig.js';
import { clamp } from '../utils.js';

/**
 * Jefe del Nivel 3: Fantasma del Pantano
 * Refactorizado a arquitectura agéntica con habilidades desacopladas en español:
 * - HabilidadTripleArco: Ondas de luz concéntricas en abanico
 * - HabilidadRayoMortal: Láser concentrado destructivo con raycast al suelo
 * - HabilidadInvocarEsbirros: Invocación de murciélagos cazadores
 */
export class SwampGhostBoss extends BossAgent {
  constructor(homeX) {
    const cfg = BOSS_CONFIG.swampGhost;
    super(homeX, 80, cfg.radius, cfg.maxHp, cfg);
    this.color = cfg.color;
    this.state = 'hidden'; // hidden → fadein → visible → (charge → beam) → fadeout → hidden
    this.timer = cfg.teleport.hiddenTimeNormal;
    this.alpha = 0;
    this.batCd = cfg.summon.cooldownNormal;
    this.beamCd = cfg.deathBeam.cooldown;
    this.beamAngle = Math.PI;

    // Registro modular de habilidades del agente
    this.habilidadOndas = this.registrarHabilidad(new HabilidadTripleArco(cfg.waveAttack));
    this.habilidadRayo = this.registrarHabilidad(new HabilidadRayoMortal(cfg.deathBeam));
    this.habilidadInvocacion = this.registrarHabilidad(new HabilidadInvocarEsbirros({
      type: 'huntbat',
      countNormal: cfg.summon.countNormal,
      countRage: cfg.summon.countRage,
    }));

    // Compatibilidad
    this.waveSkill = this.habilidadOndas;
    this.beamSkill = this.habilidadRayo;
    this.summonSkill = this.habilidadInvocacion;
  }

  // Mientras no es visible por completo, los disparos y el contacto lo atraviesan
  get intangible() {
    return this.state === 'hidden' || this.state === 'fadein' || this.state === 'fadeout';
  }

  damage(n = 1) {
    if (this.intangible) return;
    super.damage(n);
  }

  pickSpot(w) {
    const minDistance = this.configuracion.teleport.minDistanceToPlayer || 55;
    for (let i = 0; i < 6; i++) {
      this.x = w.camX + 100 + Math.random() * (W - 140);
      this.y = 28 + Math.random() * 88;
      if (w.player && Math.hypot(w.player.x - this.x, w.player.y - this.y) > minDistance) {
        break; // No aparece encima del jugador
      }
    }
  }

  wave(w) {
    this.habilidadOndas.ejecutar(this, w);
  }

  // Segmento del láser: dirección y largo (se corta en el suelo)
  beamGeom() {
    return this.habilidadRayo.obtenerGeometriaRayo(this);
  }

  update(dt, w) {
    this.tick(dt);
    this.actualizarHabilidades(dt);
    const p = w.player;
    const rage = this.enraged;
    const cfg = this.configuracion;

    this.timer -= dt;
    this.batCd -= dt;

    if (this.state === 'hidden') {
      this.alpha = 0;
      if (this.timer <= 0) {
        this.pickSpot(w);
        this.state = 'fadein';
        this.timer = cfg.teleport.fadeInTime || 0.55;
      }
    } else if (this.state === 'fadein') {
      const fadeInDuration = cfg.teleport.fadeInTime || 0.55;
      this.alpha = clamp(1 - this.timer / fadeInDuration, 0, 1);
      if (this.timer <= 0) {
        this.alpha = 1;
        this.state = 'visible';
        this.timer = rage ? cfg.teleport.visibleTimeRage : cfg.teleport.visibleTimeNormal;
        this.wave(w); // Al aparecer ejecuta la habilidad de onda
      }
    } else if (this.state === 'visible') {
      if (rage) this.beamCd -= dt;

      // Invocación de esbirros delegada a la habilidad
      if (this.batCd <= 0) {
        this.habilidadInvocacion.ejecutar(this, w);
        this.batCd = 3 + Math.random() * 3;
      }

      if (this.timer <= 0) {
        if (rage && this.beamCd <= 0) {
          this.habilidadRayo.iniciarCarga(this, w);
          this.state = 'charge';
          this.timer = 1.1;
        } else {
          this.state = 'fadeout';
          this.timer = cfg.teleport.fadeOutTime || 0.4;
        }
      }
    } else if (this.state === 'charge') {
      const disparoListo = this.habilidadRayo.actualizarCarga(dt, this, w);
      if (disparoListo) {
        this.state = 'beam';
        this.timer = cfg.deathBeam.duration || 0.6;
        w.shake(3);
      }
    } else if (this.state === 'beam') {
      const rayoFinalizado = this.habilidadRayo.actualizarRayo(dt, this, w);
      if (rayoFinalizado || this.timer <= 0) {
        this.beamCd = 6;
        this.state = 'fadeout';
        this.timer = cfg.teleport.fadeOutTime || 0.4;
      }
    } else if (this.state === 'fadeout') {
      const fadeOutDuration = cfg.teleport.fadeOutTime || 0.4;
      this.alpha = clamp(this.timer / fadeOutDuration, 0, 1);
      if (this.timer <= 0) {
        this.state = 'hidden';
        this.timer = rage ? 0.6 : 0.95;
      }
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
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(ex, ey);
        ctx.stroke();
      } else {
        ctx.strokeStyle = 'rgba(255,240,170,0.25)';
        ctx.lineWidth = 20;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(ex, ey);
        ctx.stroke();
        ctx.strokeStyle = '#fff3b0';
        ctx.lineWidth = 12;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(ex, ey);
        ctx.stroke();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 5;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(ex, ey);
        ctx.stroke();
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
    ctx.beginPath();
    ctx.arc(x, y, 40, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Brazos
    ctx.fillStyle = this.tint('#bfe0d8');
    ctx.beginPath();
    ctx.moveTo(x - 10, y + 2);
    ctx.lineTo(x - 26, y + 12 + Math.sin(this.age * 4) * 3);
    ctx.lineTo(x - 9, y + 9);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(x + 10, y + 2);
    ctx.lineTo(x + 26, y + 12 + Math.sin(this.age * 4 + 1) * 3);
    ctx.lineTo(x + 9, y + 9);
    ctx.fill();

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
    ctx.beginPath();
    ctx.ellipse(x - 5, y - 3, 2.5, 4, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(x + 5, y - 3, 2.5, 4, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(x, y + 7, 3, 4.5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.fillStyle = rage ? '#ffe9a0' : '#9dffe0';
    ctx.fillRect(x - 6, y - 4, 2, 2);
    ctx.fillRect(x + 4, y - 4, 2, 2);
    ctx.restore();

    ctx.restore();
  }
}
