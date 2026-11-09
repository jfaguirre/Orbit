import { Enemy } from '../enemies.js';
import { clamp } from '../utils.js';

/**
 * Agente base para los Jefes de Orbit.
 * Encapsula la máquina de estados, el registro de habilidades (Skills) y el modo Furia.
 */
export class BossAgent extends Enemy {
  constructor(x, y, radio, vidaMaxima, configuracion = {}) {
    super(x, y, radio, vidaMaxima);
    this.configuracion = configuracion;
    this.nombre = configuracion.name || configuracion.nombre || 'JEFE';
    this.vidaMaxima = vidaMaxima;
    this.vida = vidaMaxima;
    this.hp = vidaMaxima;
    this.maxHp = vidaMaxima;
    this.estado = 'enter';
    this.state = 'enter';
    this.temporizador = 0;
    this.timer = 0;
    this.habilidades = new Map();
    this.skills = this.habilidades;
    this.proporcionFuria = configuracion.enragedHpRatio || configuracion.proporcionVidaFuria || 0.5;
  }

  get enFuria() {
    return this.hp <= this.maxHp * this.proporcionFuria;
  }

  get enraged() {
    return this.enFuria;
  }

  registrarHabilidad(habilidad) {
    this.habilidades.set(habilidad.nombre, habilidad);
    if (habilidad.name && habilidad.name !== habilidad.nombre) {
      this.habilidades.set(habilidad.name, habilidad);
    }
    return habilidad;
  }

  registerSkill(skill) {
    return this.registrarHabilidad(skill);
  }

  obtenerHabilidad(nombre) {
    return this.habilidades.get(nombre);
  }

  getSkill(name) {
    return this.obtenerHabilidad(name);
  }

  actualizarHabilidades(dt) {
    for (const habilidad of new Set(this.habilidades.values())) {
      habilidad.actualizar(dt);
    }
  }

  updateSkills(dt) {
    this.actualizarHabilidades(dt);
  }

  damage(n = 1) {
    if (this.state === 'enter' || this.estado === 'enter') return;
    super.damage(n);
  }

  // Dibuja una línea de advertencia / telegrafiado hacia el jugador
  dibujarLineaAviso(ctx, yObjetivo, longitud, color = '#ff4040') {
    ctx.save();
    ctx.globalAlpha = 0.25 + 0.2 * Math.sin(this.age * 30);
    ctx.fillStyle = color;
    ctx.fillRect(0, yObjetivo - 1, Math.max(0, longitud), 2);
    ctx.restore();
  }

  drawTelegraphLine(ctx, targetY, length, color = '#ff4040') {
    this.dibujarLineaAviso(ctx, targetY, length, color);
  }
}
