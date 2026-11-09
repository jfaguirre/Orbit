---
description: Convenciones de estilo de código, modularidad ES6 y documentación en español para Plasma Orb.
globs: **/*.{js,json,md}
---

# Convenciones de Calidad de Código y Estilo

1. **Estándar de Módulos:**
   - Uso estricto de ECMAScript Modules (`import` / `export`).
   - Evitar importaciones circulares.
   - Usar rutas relativas explícitas con extensión `.js`.

2. **Nomenclatura y Claridad:**
   - Nombres de clases en PascalCase (`ReaperBoss`, `HabilidadDisparoAbanico`).
   - Métodos y variables en camelCase (`puedeEjecutarse`, `tiempoRecarga`).
   - Constantes de configuración en UPPER_SNAKE_CASE o mapas de objetos (`BOSS_CONFIG`).
   - Comentarios y documentación técnica en español claro y profesional.

3. **Inmutabilidad y Estado Limpio:**
   - No mutar objetos de configuración global directamente en tiempo de ejecución.
   - Resetear temporizadores y estados al reiniciar niveles o fases de jefes.
