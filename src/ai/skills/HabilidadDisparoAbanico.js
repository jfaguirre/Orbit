import { HabilidadBase } from './HabilidadBase.js';
import { EnemyShot } from '../../projectile.js';
import { sfx } from '../../audio.js';

/**
 * Habilidad de disparo en abanico multidireccional apuntando hacia el jugador.
 */
export class HabilidadDisparoAbanico extends HabilidadBase {
  constructor(configuracion = {}) {
    super('DisparoAbanico', configuracion.cooldownNormal || 1.4);
    this.configuracion = configuracion;
  }

  ejecutar(agente, mundo) {
    const esFuria = agente.enFuria || agente.enraged;
    const cfg = this.configuracion;
    const cantidad = esFuria ? (cfg.bulletCountRage || 7) : (cfg.bulletCountNormal || 4);
    const dispersion = esFuria ? (cfg.spreadRage || 0.22) : (cfg.spreadNormal || 0.28);
    const velocidad = esFuria ? (cfg.bulletSpeedRage || 120) : (cfg.bulletSpeedNormal || 95);
    const desfaseX = cfg.originOffsetX !== undefined ? cfg.originOffsetX : -12;

    const objetivoX = mundo.player ? mundo.player.x : agente.x - 100;
    const objetivoY = mundo.player ? mundo.player.y : agente.y;
    const anguloBase = Math.atan2(objetivoY - agente.y, objetivoX - agente.x);

    for (let i = 0; i < cantidad; i++) {
      const angulo = anguloBase + (i - (cantidad - 1) / 2) * dispersion;
      mundo.enemyShots.push(new EnemyShot(agente.x + desfaseX, agente.y, angulo, velocidad));
    }

    sfx.enemyShoot();
    this.iniciarRecarga(esFuria ? (cfg.cooldownRage || 0.95) : (cfg.cooldownNormal || 1.4));
  }
}

export const FanShotSkill = HabilidadDisparoAbanico;
