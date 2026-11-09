---
name: auditoria-balance-juego
description: >-
  Audita, prueba y calibra la dificultad, cadencia de fuego, salud de jefes, tiempo estimado para derrotar jefes (TTK) y robustez del juego en simulación headless sin navegador. Usar cuando se modifiquen estadísticas de combate, se detecten cuelgues o se balanceen las fases de jefes y enemigos.
---

# Habilidad del Agente: Auditoría y Balance del Juego (QA Headless)

Esta habilidad permite ejecutar auditorías automatizadas de jugabilidad y balance de combate en tiempo récord sin requerir interacción manual con interfaz gráfica ni navegador.

## Objetivos de la Habilidad
1. Garantizar que ningún cambio en la IA o motor lance excepciones no controladas (`TypeError`, `NaN` en coordenadas o velocidades).
2. Calcular métricas clave de combate:
   - Cadencia de fuego del jugador ($DPS$).
   - Tiempo teórico de eliminación ($TTK_{\text{teórico}} = \frac{HP}{DPS}$).
   - Tiempo realista de eliminación con evasión humana ($TTK_{\text{estimado}} \approx TTK_{\text{teórico}} \times 2.2$).
3. Verificar que las ventanas de invulnerabilidad de la embestida (Dash) permitan esquivar los patrones de proyectiles.

## Procedimiento de Ejecución

1. **Ejecutar la suite de simulación completa:**
   ```bash
   node scripts/test_simulation.js
   ```
   O mediante el script auxiliar de la habilidad:
   ```bash
   node .agents/skills/auditoria-balance-juego/scripts/ejecutar_auditoria.js
   ```

2. **Criterios de Aceptación:**
   - Cero fallos reportados en las 31+ aserciones unitarias y de simulación.
   - $TTK_{\text{teórico}}$ para cualquier jefe debe mantenerse dentro del rango $[10\text{ s}, 60\text{ s}]$.
   - Ninguna coordenada $x$ o $y$ de entidades puede ser `NaN` o `Infinity`.

3. **Verificación de Empaquetado:**
   - Asegurarse de que el compilador Vite complete la construcción sin advertencias:
   ```bash
   npm run build
   ```
