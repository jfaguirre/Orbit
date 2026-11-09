/**
 * Clase base para todas las habilidades (Skills) de agentes y jefes del sistema.
 * Aplica el patrón Strategy / Action Skill para desacoplar comportamiento de la entidad.
 */
export class HabilidadBase {
  constructor(nombre, recargaBase = 1.0) {
    this.nombre = nombre;
    this.recargaBase = recargaBase;
    this.temporizadorRecarga = 0;
    this.estaActiva = false;
    this.fase = 'lista'; // lista | aviso | ejecutando | recarga
  }

  // Compatibilidad con getters
  get name() { return this.nombre; }
  get isActive() { return this.estaActiva; }
  set isActive(v) { this.estaActiva = v; }
  get phase() { return this.fase; }
  set phase(v) { this.fase = v; }
  get cooldownTimer() { return this.temporizadorRecarga; }
  set cooldownTimer(v) { this.temporizadorRecarga = v; }

  /**
   * Actualiza los temporizadores de recarga de la habilidad
   */
  actualizar(dt) {
    if (this.temporizadorRecarga > 0) {
      this.temporizadorRecarga -= dt;
      if (this.temporizadorRecarga <= 0) {
        this.temporizadorRecarga = 0;
        this.fase = 'lista';
      }
    }
  }

  update(dt) { this.actualizar(dt); }

  /**
   * Determina si la habilidad puede ser disparada por el agente
   */
  puedeEjecutarse() {
    return this.temporizadorRecarga <= 0 && !this.estaActiva;
  }

  canExecute() { return this.puedeEjecutarse(); }

  /**
   * Dispara el inicio del enfriamiento con un multiplicador opcional (ej. modo furia)
   */
  iniciarRecarga(recargaPersonalizada = null) {
    this.temporizadorRecarga = recargaPersonalizada !== null ? recargaPersonalizada : this.recargaBase;
    this.estaActiva = false;
    this.fase = 'recarga';
  }

  triggerCooldown(custom) { this.iniciarRecarga(custom); }

  /**
   * Método que deben implementar las subclases
   */
  ejecutar(agente, mundo) {
    throw new Error(`Método ejecutar() no implementado en habilidad ${this.nombre}`);
  }

  execute(agente, mundo) { return this.ejecutar(agente, mundo); }

  reiniciar() {
    this.temporizadorRecarga = 0;
    this.estaActiva = false;
    this.fase = 'lista';
  }

  reset() { this.reiniciar(); }
}

// Alias para compatibilidad
export const BaseSkill = HabilidadBase;
