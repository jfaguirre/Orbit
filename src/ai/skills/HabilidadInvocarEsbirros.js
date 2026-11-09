import { HabilidadBase } from './HabilidadBase.js';
import { W } from '../../config/gameConfig.js';

/**
 * Habilidad de invocación de esbirros de apoyo al combate.
 */
export class HabilidadInvocarEsbirros extends HabilidadBase {
  constructor(configuracion = {}) {
    super('InvocarEsbirros', configuracion.cooldownNormal || 3.0);
    this.configuracion = configuracion;
  }

  ejecutar(agente, mundo) {
    const tipo = this.configuracion.type || 'bat';
    const posiciones = this.configuracion.spawnPositions || [45, 105];

    if (this.configuracion.triggerOnRageReturn || this.configuracion.triggerOnRageLanding) {
      for (const y of posiciones) {
        mundo.spawn(tipo, mundo.camX + W + 15, y);
      }
      return;
    }

    // Invocación directa periódica (ej. Fantasma del Pantano)
    const esFuria = agente.enFuria || agente.enraged;
    const cantidad = esFuria ? (this.configuracion.countRage || 2) : (this.configuracion.countNormal || 1);
    for (let i = 0; i < cantidad; i++) {
      const y = 30 + Math.random() * 85;
      mundo.spawn(tipo, mundo.camX + W + 15, y);
    }

    this.iniciarRecarga(this.configuracion.cooldownNormal || 3.0);
  }
}

export const SummonMinionsSkill = HabilidadInvocarEsbirros;
