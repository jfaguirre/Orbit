import { HabilidadBase } from './HabilidadBase.js';
import { GROUND } from '../../config/gameConfig.js';
import { sfx } from '../../audio.js';

/**
 * Habilidad de rayo destructor concentrado con aviso de carga y colisión con el suelo.
 */
export class HabilidadRayoMortal extends HabilidadBase {
  constructor(configuracion = {}) {
    super('RayoMortal', configuracion.cooldown || 2.0);
    this.configuracion = configuracion;
    this.temporizadorCarga = 0;
    this.temporizadorRayo = 0;
    this.temporizadorImpacto = 0;
    this.anguloRayo = Math.PI;
  }

  get chargeTimer() { return this.temporizadorCarga; }
  set chargeTimer(v) { this.temporizadorCarga = v; }
  get beamTimer() { return this.temporizadorRayo; }
  set beamTimer(v) { this.temporizadorRayo = v; }
  get hitTimer() { return this.temporizadorImpacto; }
  set hitTimer(v) { this.temporizadorImpacto = v; }
  get beamAngle() { return this.anguloRayo; }
  set beamAngle(v) { this.anguloRayo = v; }

  iniciarCarga(agente, mundo) {
    this.estaActiva = true;
    this.fase = 'aviso';
    this.temporizadorCarga = this.configuracion.chargeTime || 0.85;
    if (mundo.player) {
      this.anguloRayo = Math.atan2(mundo.player.y - agente.y, mundo.player.x - agente.x);
    }
  }

  startCharge(agente, mundo) { this.iniciarCarga(agente, mundo); }

  actualizarCarga(dt, agente, mundo) {
    this.temporizadorCarga -= dt;
    // Sigue suavemente al jugador durante el primer tramo de la carga
    if (this.temporizadorCarga > 0.25 && mundo.player) {
      const objetivo = Math.atan2(mundo.player.y - agente.y, mundo.player.x - agente.x);
      let diff = objetivo - this.anguloRayo;
      while (diff > Math.PI) diff -= Math.PI * 2;
      while (diff < -Math.PI) diff += Math.PI * 2;
      this.anguloRayo += diff * Math.min(1, dt * 4);
    }

    if (this.temporizadorCarga <= 0) {
      this.fase = 'ejecutando';
      this.temporizadorRayo = this.configuracion.duration || 0.65;
      this.temporizadorImpacto = 0;
      if (typeof sfx.bossBeam === 'function') sfx.bossBeam();
      else if (typeof sfx.bossRoar === 'function') sfx.bossRoar();
      return true; // Disparo iniciado
    }
    return false;
  }

  updateCharge(dt, agente, mundo) { return this.actualizarCarga(dt, agente, mundo); }

  actualizarRayo(dt, agente, mundo) {
    this.temporizadorRayo -= dt;
    this.temporizadorImpacto -= dt;
    mundo.shake(2);

    const geom = this.obtenerGeometriaRayo(agente);

    if (mundo.player && this.temporizadorImpacto <= 0) {
      if (this.verificarColisionJugador(agente, geom, mundo.player)) {
        mundo.hurtPlayer();
        this.temporizadorImpacto = this.configuracion.damageInterval || 0.08;
      }
    }

    if (this.temporizadorRayo <= 0) {
      this.estaActiva = false;
      this.fase = 'lista';
      this.iniciarRecarga(this.configuracion.cooldown || 2.0);
      return true; // Finalizado
    }
    return false;
  }

  updateBeam(dt, agente, mundo) { return this.actualizarRayo(dt, agente, mundo); }

  obtenerGeometriaRayo(agente) {
    const dx = Math.cos(this.anguloRayo);
    const dy = Math.sin(this.anguloRayo);
    let len = this.configuracion.maxLength || 420;
    if (dy > 0.001) len = Math.min(len, (GROUND - agente.y) / dy);
    return { dx, dy, len };
  }

  getBeamGeometry(agente) { return this.obtenerGeometriaRayo(agente); }

  verificarColisionJugador(agente, geom, jugador) {
    const px = jugador.x - agente.x;
    const py = jugador.y - agente.y;
    const proj = px * geom.dx + py * geom.dy;
    if (proj < 0 || proj > geom.len) return false;
    const perp = Math.abs(px * (-geom.dy) + py * geom.dx);
    return perp < 14;
  }

  checkPlayerCollision(agente, geom, jugador) { return this.verificarColisionJugador(agente, geom, jugador); }
}

export const DeathBeamSkill = HabilidadRayoMortal;
