import { HabilidadBase } from './HabilidadBase.js';
import { EnemyShot } from '../../projectile.js';
import { clamp } from '../../utils.js';
import { sfx } from '../../audio.js';
import { W, GROUND } from '../../config/gameConfig.js';

/**
 * Habilidad de salto aplastante y ondas radiales de fuego.
 */
export class HabilidadSaltoAplastante extends HabilidadBase {
  constructor(configuracion = {}) {
    super('SaltoAplastante', configuracion.jump?.cooldownNormal || 1.7);
    this.configuracion = configuracion;
    this.temporizadorAgachado = 0;
    this.temporizadorSegundaRafaga = -1;
  }

  get crouchTimer() { return this.temporizadorAgachado; }
  set crouchTimer(v) { this.temporizadorAgachado = v; }
  get secondVolleyTimer() { return this.temporizadorSegundaRafaga; }
  set secondVolleyTimer(v) { this.temporizadorSegundaRafaga = v; }

  iniciarAgachado(agente) {
    this.estaActiva = true;
    this.fase = 'aviso';
    const esFuria = agente.enFuria || agente.enraged;
    this.temporizadorAgachado = esFuria
      ? (this.configuracion.jump?.crouchTimeRage || 0.32)
      : (this.configuracion.jump?.crouchTimeNormal || 0.45);
  }

  startCrouch(agente) { this.iniciarAgachado(agente); }

  actualizarAgachado(dt) {
    this.temporizadorAgachado -= dt;
    return this.temporizadorAgachado <= 0;
  }

  updateCrouch(dt) { return this.actualizarAgachado(dt); }

  iniciarSalto(agente, mundo) {
    this.fase = 'ejecutando';
    const jugadorX = mundo.player ? mundo.player.x : agente.x;
    const destino = clamp(jugadorX, mundo.camX + 30, mundo.camX + W - 30);
    const maxVx = this.configuracion.jump?.maxVx || 180;
    agente.vx = clamp((destino - agente.x) / 0.85, -maxVx, maxVx);
    agente.vy = this.configuracion.jump?.jumpVy || -285;
    sfx.bossRoar();
  }

  initiateJump(agente, mundo) { this.iniciarSalto(agente, mundo); }

  dispararRafagaAnillo(agente, mundo, desfase = 0) {
    const esFuria = agente.enFuria || agente.enraged;
    const cfg = this.configuracion.ringVolley || {};
    const cantidad = esFuria ? (cfg.countRage || 22) : (cfg.countNormal || 18);
    const velocidad = esFuria ? (cfg.speedRage || 130) : (cfg.speedNormal || 115);
    const origenX = agente.x;
    const origenY = GROUND - 5;

    for (let i = 0; i < cantidad; i++) {
      const angulo = (Math.PI * 2 * i) / cantidad + desfase;
      mundo.enemyShots.push(new EnemyShot(origenX, origenY, angulo, velocidad));
    }
    sfx.enemyShoot();
  }

  fireRingVolley(agente, mundo, desfase = 0) { this.dispararRafagaAnillo(agente, mundo, desfase); }

  alAterrizar(agente, mundo) {
    const esFuria = agente.enFuria || agente.enraged;
    mundo.shake(this.configuracion.jump?.landingShake || 7);
    sfx.bossSlam();

    // Primera ráfaga circular al impactar
    this.dispararRafagaAnillo(agente, mundo, 0);

    // Preparar segunda ráfaga entrelazada
    this.temporizadorSegundaRafaga = this.configuracion.ringVolley?.interleavedDelay || 0.18;

    this.estaActiva = false;
    this.fase = 'lista';
    this.iniciarRecarga(esFuria
      ? (this.configuracion.jump?.cooldownRage || 1.0)
      : (this.configuracion.jump?.cooldownNormal || 1.7));
  }

  onLanding(agente, mundo) { this.alAterrizar(agente, mundo); }

  actualizarRafagas(dt, agente, mundo) {
    if (this.temporizadorSegundaRafaga >= 0) {
      this.temporizadorSegundaRafaga -= dt;
      if (this.temporizadorSegundaRafaga <= 0) {
        const esFuria = agente.enFuria || agente.enraged;
        const cantidad = esFuria
          ? (this.configuracion.ringVolley?.countRage || 22)
          : (this.configuracion.ringVolley?.countNormal || 18);
        this.dispararRafagaAnillo(agente, mundo, Math.PI / cantidad);
        this.temporizadorSegundaRafaga = -1;
      }
    }
  }

  updateVolleys(dt, agente, mundo) { this.actualizarRafagas(dt, agente, mundo); }
}

export const GroundSlamSkill = HabilidadSaltoAplastante;
