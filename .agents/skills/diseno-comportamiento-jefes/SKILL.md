---
name: diseno-comportamiento-jefes
description: >-
  Diseña, implementa, calibra y registra nuevas habilidades (skills), fases de furia y comportamientos agénticos para jefes en Plasma Orb. Utilizar cuando se solicite crear un nuevo jefe, añadir ataques especiales, modificar patrones de proyectiles o ajustar la máquina de estados de combate.
---

# Habilidad del Agente: Diseño de Comportamiento de Jefes

Esta habilidad proporciona el procedimiento paso a paso para crear o extender jefes en Plasma Orb utilizando la arquitectura agéntica modular y el patrón de diseño Estrategia (Strategy).

## Procedimiento de Implementación

### 1. Definir los Parámetros Declarativos
No escribas constantes directamente en la clase del jefe. Añade la configuración en `src/config/bossConfig.js`:
```javascript
export const BOSS_CONFIG = {
  miNuevoJefe: {
    nombre: 'NOMBRE EN MAYÚSCULAS',
    vidaMaxima: 300,
    radio: 16,
    color: '200,100,50',
    proporcionVidaFuria: 0.5,
    miHabilidadConfig: {
      recargaNormal: 2.0,
      recargaFuria: 1.2,
      // parámetros numéricos específicos
    }
  }
};
```

### 2. Encapsular Nuevas Habilidades en Clases Modulares
Si el ataque requiere una nueva mecánica (no cubierta por las existentes):
1. Crea `src/ai/skills/HabilidadMiNuevoAtaque.js` heredando de `HabilidadBase`:
```javascript
import { HabilidadBase } from './HabilidadBase.js';

export class HabilidadMiNuevoAtaque extends HabilidadBase {
  constructor(configuracion = {}) {
    super('MiNuevoAtaque', configuracion.recargaNormal || 1.5);
    this.configuracion = configuracion;
  }

  ejecutar(agente, mundo) {
    const esFuria = agente.enFuria;
    // Lógica desacoplada de la habilidad
    // Generar proyectiles o efectos en mundo
    this.iniciarRecarga(esFuria ? this.configuracion.recargaFuria : this.configuracion.recargaNormal);
  }
}
```
2. Exporta la habilidad en `src/ai/skills/index.js`.

### 3. Componer el Agente Jefe
Crea la clase del jefe en `src/ai/MiNuevoJefe.js` extendiendo `BossAgent`:
1. Registra las habilidades en el constructor con `this.registrarHabilidad(new HabilidadMiNuevoAtaque(...))`.
2. En `update(dt, mundo)`:
   - Invoca `this.tick(dt)` y `this.actualizarHabilidades(dt)`.
   - Consulta `if (habilidad.puedeEjecutarse()) { habilidad.ejecutar(this, mundo); }`.
   - Modela estados de telegrafiado (aviso visual previo al jugador) antes de impactos de alta velocidad.
3. En `draw(ctx, camX)`:
   - Dibuja el aura, cuerpo y ojos acordes a la paleta pixel art.
   - Utiliza `this.dibujarLineaAviso()` para advertencias de trayectoria.

### 4. Validar con la Suite de Pruebas
Ejecuta la suite automatizada para asegurar que las habilidades no lanzan excepciones y respetan los tipos de datos:
```bash
npm test
```

## Referencias
- Para patrones de dispersión geométrica de balas y tiempos de reacción humanos, consulta [patrones-jefes.md](./referencias/patrones-jefes.md).
