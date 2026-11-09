---
description: Reglas fundamentales de arquitectura modular, separación de responsabilidades y configuración sin números mágicos para Plasma Orb.
globs: src/**/*.{js,css}
---

# Reglas de Arquitectura Modular del Juego (Plasma Orb)

1. **Separación de Responsabilidades (SoC):**
   - **Lógica de Motor:** Reside en `src/main.js`, `src/player.js`, `src/projectile.js`, `src/utils.js`.
   - **Configuración Declarativa:** Reside exclusivamente en `src/config/` (`bossConfig.js`, `playerConfig.js`, `enemyConfig.js`, `gameConfig.js`).
   - **Comportamiento Agéntico / IA:** Reside en `src/ai/` y `src/ai/skills/`.

2. **Cero Números Mágicos:**
   - Ninguna clase de entidad o habilidad debe contener constantes numéricas hardcodeadas (velocidad, cadencia, radio, daño, colores). Todo valor numérico debe importarse desde su respectivo archivo de configuración en `src/config/`.

3. **Patrón Strategy para Habilidades (Skills):**
   - Las habilidades de combate de jefes y enemigos deben derivar de `HabilidadBase` (`src/ai/skills/HabilidadBase.js`).
   - Cada habilidad debe gestionar su propio ciclo de vida (`actualizar`, `puedeEjecutarse`, `ejecutar`, `reiniciar`).
   - El agente jefe no implementa la balística interna de sus proyectiles u ondas; las delega a sus habilidades registradas.

4. **Compatibilidad Bidireccional:**
   - La API pública consumida por `levels.js` y `main.js` (`new Boss(x)`, `new BoneColossus(x)`, `new SwampGhost(x)`) debe mantenerse preservada a través de fachadas en `src/boss.js`, `src/boss2.js` y `src/boss3.js`.

5. **Pruebas y Verificación:**
   - Todo cambio en la lógica de combate debe pasar la suite de pruebas sin navegador ejecutando `npm test`.
