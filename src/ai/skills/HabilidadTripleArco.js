import { HabilidadBase } from './HabilidadBase.js';
import { EnemyShot } from '../../projectile.js';

/**
 * Habilidad de emisión de ondas de choque luminosas en arco curvo.
 */
export class HabilidadTripleArco extends HabilidadBase {
  constructor(configuracion = {}) {
    super('TripleArco', 1.0);
    this.configuracion = configuracion;
  }

  ejecutar(agente, mundo) {
    if (!mundo.player) return;
    const a = Math.atan2(mundo.player.y - agente.y, mundo.player.x - agente.x);
    const cx = Math.cos(a);
    const cy = Math.sin(a);
    const velocidad = this.configuracion.bulletSpeed || 95;
    const esFuria = agente.enFuria || agente.enraged;

    if (!esFuria) {
      // Fase 1: un solo arco de luz estándar
      mundo.enemyShots.push(new EnemyShot(agente.x + cx * 12, agente.y + cy * 12, a, velocidad, 'wave'));
      return;
    }

    // Fase 2: tres arcos seguidos con escalas progresivas
    const escalas = this.configuracion.enragedScales || [0.7, 1.0, 1.35];
    const desfases = this.configuracion.enragedOffsets || [12, -4, -20];

    escalas.forEach((escala, i) => {
      const d = desfases[i] !== undefined ? desfases[i] : (12 - i * 16);
      mundo.enemyShots.push(new EnemyShot(agente.x + cx * d, agente.y + cy * d, a, velocidad, 'wave', escala));
    });
  }
}

export const TripleArcSkill = HabilidadTripleArco;
