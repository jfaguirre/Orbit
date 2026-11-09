import { HabilidadBase } from './HabilidadBase.js';
import { sfx } from '../../audio.js';

/**
 * Habilidad de embestida con aviso visual (telegraph) y regreso a posición base.
 */
export class HabilidadEmbestida extends HabilidadBase {
  constructor(configuracion = {}) {
    super('Embestida', configuracion.cooldownNormal || 3.6);
    this.configuracion = configuracion;
    this.temporizadorAviso = 0;
  }

  get telegraphTimer() { return this.temporizadorAviso; }
  set telegraphTimer(v) { this.temporizadorAviso = v; }

  iniciarAviso(agente) {
    this.estaActiva = true;
    this.fase = 'aviso';
    const esFuria = agente.enFuria || agente.enraged;
    this.temporizadorAviso = esFuria
      ? (this.configuracion.telegraphDurationRage || 0.55)
      : (this.configuracion.telegraphDurationNormal || 0.75);
    sfx.bossRoar();
  }

  startTelegraph(agente) { this.iniciarAviso(agente); }

  actualizarAviso(dt, agente, jugador) {
    this.temporizadorAviso -= dt;
    // Sigue la altura del jugador y se fija justo antes de embestir
    if (this.temporizadorAviso > 0.2 && jugador) {
      agente.y += (jugador.y - agente.y) * Math.min(1, dt * 9);
    }
    if (this.temporizadorAviso <= 0) {
      this.fase = 'ejecutando';
      return true; // Listo para iniciar la embestida
    }
    return false;
  }

  updateTelegraph(dt, agente, jugador) { return this.actualizarAviso(dt, agente, jugador); }

  obtenerVelocidadEmbestida(agente) {
    const esFuria = agente.enFuria || agente.enraged;
    return esFuria
      ? (this.configuracion.chargeSpeedRage || 360)
      : (this.configuracion.chargeSpeedNormal || 310);
  }

  getChargeSpeed(agente) { return this.obtenerVelocidadEmbestida(agente); }

  obtenerVelocidadRegreso(agente) {
    const esFuria = agente.enFuria || agente.enraged;
    return esFuria
      ? (this.configuracion.returnSpeedRage || 200)
      : (this.configuracion.returnSpeedNormal || 160);
  }

  getReturnSpeed(agente) { return this.obtenerVelocidadRegreso(agente); }

  finalizar(agente) {
    this.estaActiva = false;
    this.fase = 'lista';
    const esFuria = agente.enFuria || agente.enraged;
    this.iniciarRecarga(esFuria
      ? (this.configuracion.cooldownRage || 2.4)
      : (this.configuracion.cooldownNormal || 3.6));
  }

  finish(agente) { this.finalizar(agente); }
}

export const DashChargeSkill = HabilidadEmbestida;
