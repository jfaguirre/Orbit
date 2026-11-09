---
name: diseno-oleadas-niveles
description: >-
  Diseña la progresión de niveles, coreografía de oleadas de enemigos, curvas de tensión y puntos de bloqueo de arena de jefes en Plasma Orb. Usar al crear nuevos niveles, balancear densidad de apariciones o ajustar el ritmo de juego (pacing).
---

# Habilidad del Agente: Diseño de Oleadas y Niveles

Esta habilidad define la metodología para componer niveles 2D de avance horizontal, regulando la curva de dificultad y la sincronización con la cámara.

## Estructura de un Nivel en Plasma Orb

Un nivel se define como una función generadora que retorna un objeto con:
- `worldW`: Longitud total del nivel en coordenadas del mundo (ej. 1800 a 2400 píxeles).
- `spawns`: Arreglo ordenado por coordenada $x$ ascendente de enemigos a instanciar:
  ```javascript
  { t: 'bat', x: 260, y: 40 }
  ```
- `createBoss`: Fábrica que devuelve la instancia del jefe al llegar a la arena final ($x > \text{worldW} - W + 60$).
- `draw`: Función de renderizado por capas (fondo lejano, parallax medio, suelo, partículas ambientales, viñeta).

## Procedimiento para Diseñar una Oleada

1. **Ritmo de Tensión y Descanso:**
   - **Tramo de Apertura ($x = 0$ a $300$):** 1 o 2 enemigos individuales para familiarizarse con los controles.
   - **Tramo de Presión Media ($x = 300$ a $800$):** Combinación de voladores (`bat`, `skull`) con terrestres (`rat`).
   - **Zona de Tensión Alta ($x = 800$ a $1300$):** Enemigos de control de área (`turret`, `saucer`).
   - **Respiro Pre-Jefe ($x = 1300$ a $1500$):** Sin enemigos para recargar concentración y ambientación sonora.
   - **Arena de Jefe ($x > 1500$):** Bloqueo de cámara y combate contra el `BossAgent`.

2. **Reglas de Desove:**
   - La cola de enemigos solo instancia aquellos cuya posición cumpla $x \le \text{camX} + W + 30$ para evitar desoves bruscos en pantalla.
   - No colocar más de 2 proyectiles enemigos activos en el mismo plano horizontal simultáneamente durante el recorrido previo al jefe.

## Referencias
- Para detalles de composición visual y paletas cromáticas por nivel, consulta [guia-ritmo.md](./referencias/guia-ritmo.md).
