// Script de Simulación Headless y Auditoría de Balance (QA)
// Valida el funcionamiento autónomo de las Habilidades (Skills) y Agentes de IA sin requerir navegador.

import { BOSS_CONFIG, PLAYER_CONFIG, GAME_CONFIG } from '../src/config/index.js';
import { HabilidadDisparoAbanico } from '../src/ai/skills/HabilidadDisparoAbanico.js';
import { HabilidadEmbestida } from '../src/ai/skills/HabilidadEmbestida.js';
import { HabilidadSaltoAplastante } from '../src/ai/skills/HabilidadSaltoAplastante.js';
import { HabilidadTripleArco } from '../src/ai/skills/HabilidadTripleArco.js';
import { HabilidadRayoMortal } from '../src/ai/skills/HabilidadRayoMortal.js';
import { HabilidadInvocarEsbirros } from '../src/ai/skills/HabilidadInvocarEsbirros.js';
import { ReaperBoss } from '../src/ai/ReaperBoss.js';
import { ColossusBoss } from '../src/ai/ColossusBoss.js';
import { SwampGhostBoss } from '../src/ai/SwampGhostBoss.js';

console.log('='.repeat(60));
console.log('🤖 INICIANDO SUITE DE PRUEBAS AUTOMATIZADAS DE AGENTES Y HABILIDADES');
console.log('='.repeat(60));

let totalAprobadas = 0;
let totalFallidas = 0;

function afirmar(condicion, mensaje) {
  if (condicion) {
    console.log(`  ✅ [ÉXITO] ${mensaje}`);
    totalAprobadas++;
  } else {
    console.error(`  ❌ [FALLO] ${mensaje}`);
    totalFallidas++;
  }
}

// 1. Simulación del Mundo de Juego (Mock)
function crearMundoSimulado() {
  return {
    camX: 100,
    player: { x: 80, y: 100, hurtbox: { r: 4 } },
    enemyShots: [],
    spawnQueue: [],
    spawnedMinions: [],
    shakeAmount: 0,
    shake(n) { this.shakeAmount = Math.max(this.shakeAmount, n); },
    hurt() { this.playerHurt = true; },
    hurtPlayer() { this.playerHurt = true; },
    spawn(type, x, y) {
      this.spawnedMinions.push({ type, x, y });
    }
  };
}

// ==========================================
// PRUEBA 1: Verificación de Habilidades Modulares
// ==========================================
console.log('\n--- 1. Pruebas Unitarias de Habilidades (Skills) ---');

// HabilidadDisparoAbanico
{
  const habilidad = new HabilidadDisparoAbanico(BOSS_CONFIG.reaper.fanAttack);
  const mundo = crearMundoSimulado();
  const agenteSimulado = { x: 200, y: 80, enFuria: false, enraged: false };
  afirmar(habilidad.puedeEjecutarse(), 'HabilidadDisparoAbanico inicia lista para ejecución');
  habilidad.ejecutar(agenteSimulado, mundo);
  afirmar(mundo.enemyShots.length === 4, 'HabilidadDisparoAbanico genera 4 proyectiles en fase normal');
  afirmar(!habilidad.puedeEjecutarse(), 'HabilidadDisparoAbanico entra en enfriamiento tras ejecutarse');

  // Modo furia
  agenteSimulado.enFuria = true;
  habilidad.reiniciar();
  mundo.enemyShots.length = 0;
  habilidad.ejecutar(agenteSimulado, mundo);
  afirmar(mundo.enemyShots.length === 7, 'HabilidadDisparoAbanico genera 7 proyectiles en modo furia');
}

// HabilidadSaltoAplastante
{
  const habilidad = new HabilidadSaltoAplastante(BOSS_CONFIG.colossus);
  const mundo = crearMundoSimulado();
  const agenteSimulado = { x: 250, y: 134, enFuria: false, enraged: false, vx: 0, vy: 0 };
  habilidad.iniciarAgachado(agenteSimulado);
  afirmar(habilidad.estaActiva, 'HabilidadSaltoAplastante activa estado de aviso / telegrafiado');
  afirmar(!habilidad.actualizarAgachado(0.1), 'HabilidadSaltoAplastante espera durante el tiempo de aviso');
  afirmar(habilidad.actualizarAgachado(0.5), 'HabilidadSaltoAplastante completa el agachado y pasa a salto');
  habilidad.iniciarSalto(agenteSimulado, mundo);
  afirmar(agenteSimulado.vy < 0, 'HabilidadSaltoAplastante aplica velocidad vertical de salto');
  habilidad.alAterrizar(agenteSimulado, mundo);
  afirmar(mundo.shakeAmount === 7, 'HabilidadSaltoAplastante activa sacudida de pantalla al aterrizar');
  afirmar(mundo.enemyShots.length === 18, 'HabilidadSaltoAplastante genera anillo de 18 proyectiles en normal');
}

// HabilidadTripleArco
{
  const habilidad = new HabilidadTripleArco(BOSS_CONFIG.swampGhost.waveAttack);
  const mundo = crearMundoSimulado();
  const agenteSimulado = { x: 220, y: 60, enFuria: false, enraged: false };
  habilidad.ejecutar(agenteSimulado, mundo);
  afirmar(mundo.enemyShots.length === 1, 'HabilidadTripleArco lanza 1 arco en fase normal');

  agenteSimulado.enFuria = true;
  mundo.enemyShots.length = 0;
  habilidad.ejecutar(agenteSimulado, mundo);
  afirmar(mundo.enemyShots.length === 3, 'HabilidadTripleArco lanza 3 arcos escalonados en fase furia');
}

// HabilidadRayoMortal
{
  const habilidad = new HabilidadRayoMortal(BOSS_CONFIG.swampGhost.deathBeam);
  const mundo = crearMundoSimulado();
  const agenteSimulado = { x: 200, y: 70 };
  habilidad.iniciarCarga(agenteSimulado, mundo);
  afirmar(habilidad.fase === 'aviso', 'HabilidadRayoMortal entra en fase de aviso al iniciar carga');
  const rayoIniciado = habilidad.actualizarCarga(0.9, agenteSimulado, mundo);
  afirmar(rayoIniciado, 'HabilidadRayoMortal pasa a disparar tras completar la carga');
  const geom = habilidad.obtenerGeometriaRayo(agenteSimulado);
  afirmar(geom.len > 0 && Number.isFinite(geom.len), 'HabilidadRayoMortal calcula rayo con longitud geométrica válida');
}

// HabilidadInvocarEsbirros
{
  const habilidad = new HabilidadInvocarEsbirros(BOSS_CONFIG.reaper.summon);
  const mundo = crearMundoSimulado();
  const agenteSimulado = { enFuria: true, enraged: true };
  habilidad.ejecutar(agenteSimulado, mundo);
  afirmar(mundo.spawnedMinions.length === 2, 'HabilidadInvocarEsbirros genera los esbirros requeridos');
}

// ==========================================
// PRUEBA 2: Simulación de Ciclos de Combate de Jefes
// ==========================================
console.log('\n--- 2. Simulación de Ciclos de Combate de Jefes ---');

function simularJefe(nombreJefe, instanciaJefe, fotogramas = 300) {
  const mundo = crearMundoSimulado();
  const dt = 1 / 60;
  let huboExcepciones = false;

  try {
    for (let i = 0; i < fotogramas; i++) {
      instanciaJefe.update(dt, mundo);
      if (!Number.isFinite(instanciaJefe.x) || !Number.isFinite(instanciaJefe.y)) {
        throw new Error(`Coordenadas corruptas en ${nombreJefe}: x=${instanciaJefe.x}, y=${instanciaJefe.y}`);
      }
    }
  } catch (err) {
    console.error(`Error en simulación de ${nombreJefe}:`, err.message);
    huboExcepciones = true;
  }

  afirmar(!huboExcepciones, `Simulación de 300 fotogramas para ${nombreJefe} sin excepciones`);
  return { jefe: instanciaJefe, mundo };
}

// Jefe 1: Espectro Segador
{
  const reaper = new ReaperBoss(200);
  afirmar(reaper.habilidades.size >= 3, 'ReaperBoss registra sus 3 habilidades modulares');
  simularJefe('ReaperBoss (Fase 1)', reaper, 200);
  reaper.hp = reaper.maxHp * 0.4; // Furia
  afirmar(reaper.enFuria, 'ReaperBoss detecta correctamente umbral de furia (<50% HP)');
  simularJefe('ReaperBoss (Fase Furia)', reaper, 200);
}

// Jefe 2: Coloso de Huesos
{
  const colossus = new ColossusBoss(200);
  afirmar(colossus.habilidades.size >= 2, 'ColossusBoss registra sus 2 habilidades modulares');
  simularJefe('ColossusBoss (Fase 1)', colossus, 200);
  colossus.hp = colossus.maxHp * 0.3; // Furia
  afirmar(colossus.enFuria, 'ColossusBoss entra en furia correctamente');
  simularJefe('ColossusBoss (Fase Furia)', colossus, 200);
}

// Jefe 3: Fantasma del Pantano
{
  const ghost = new SwampGhostBoss(200);
  afirmar(ghost.intangible, 'SwampGhostBoss inicia intangible mientras está oculto');
  simularJefe('SwampGhostBoss (Fase 1)', ghost, 200);
  ghost.hp = ghost.maxHp * 0.2; // Furia
  afirmar(ghost.enFuria, 'SwampGhostBoss activa modo furia para triple arco y láser');
  simularJefe('SwampGhostBoss (Fase Furia)', ghost, 200);
}

// ==========================================
// PRUEBA 3: Auditoría de Balance de Combate
// ==========================================
console.log('\n--- 3. Auditoría de Balance (Métricas de Combate) ---');

const cadenciaJugador = 1 / PLAYER_CONFIG.combat.shootCooldown;
const dpsJugador = cadenciaJugador * 1;
console.log(`  ℹ️  Cadencia del jugador: ${cadenciaJugador.toFixed(2)} disparos/segundo (DPS: ${dpsJugador.toFixed(2)} HP/s)`);

for (const [clave, jefeCfg] of Object.entries(BOSS_CONFIG)) {
  const ttkTeorico = jefeCfg.maxHp / dpsJugador;
  const ttkEstimado = ttkTeorico * 2.2;
  console.log(`  📊 Jefe: ${jefeCfg.name} | HP: ${jefeCfg.maxHp} | TTK Teórico: ${ttkTeorico.toFixed(1)}s | TTK Estimado: ${ttkEstimado.toFixed(1)}s`);
  afirmar(ttkTeorico > 5 && ttkTeorico < 70, `TTK para ${jefeCfg.name} se mantiene dentro de los márgenes jugables (5s - 70s)`);
}

// Resumen final
console.log('\n' + '='.repeat(60));
console.log(`RESULTADO DE LA SUITE: ${totalAprobadas} APROBADAS, ${totalFallidas} FALLIDAS`);
console.log('='.repeat(60));

if (totalFallidas > 0) {
  process.exit(1);
} else {
  console.log('✨ TODAS LAS PRUEBAS DE HABILIDADES Y AGENTES FUERON EXITOSAS ✨\n');
  process.exit(0);
}
