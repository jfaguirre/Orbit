# Sistema Agéntico y Gobernanza del Proyecto Plasma Orb

Este proyecto utiliza un sistema agéntico modular para guiar el desarrollo asistido por IA, la refactorización arquitectónica y el control de calidad.

## 1. Roles de Agentes Especializados
- **Arquitecto Principal del Juego** (`.agents/agents/arquitecto-principal-juego.agent.md`): Supervisa la modularidad del código, separación de responsabilidades y erradicación de números mágicos.
- **Especialista en IA de Combate** (`.agents/agents/especialista-ia-combate.agent.md`): Diseña habilidades (`skills`) de jefes, patrones de proyectiles y transiciones a modo furia.
- **Auditor de Calidad y Balance** (`.agents/agents/auditor-calidad-balance.agent.md`): Ejecuta suites de pruebas automatizadas headless, calcula TTK y valida que no existan regresiones.

## 2. Skills Propias Disponibles
Las capacidades del sistema están encapsuladas en la carpeta `.agents/skills/`:
- `diseno-comportamiento-jefes`: Creación y registro de habilidades desacopladas de jefes.
- `auditoria-balance-juego`: Ejecución de simulaciones de combate sin navegador y métricas de balance.
- `sintesis-audio-sfx`: Síntesis matemática de efectos de sonido en formato WAV PCM.
- `diseno-oleadas-niveles`: Coreografía de oleadas, curvas de dificultad y áreas de bloqueo.

## 3. Reglas del Código
- **Separación de Responsabilidades:** Toda configuración debe vivir en `src/config/`, la lógica agéntica en `src/ai/`, y la renderización en el motor visual.
- **Patrón Strategy:** Toda habilidad de combate debe heredar de `HabilidadBase`.
- **Validación Continua:** Antes de dar por finalizada una tarea, ejecutar:
  ```bash
  npm test
  npm run build
  ```
- **Consistencia Visual:** Respetar la resolución nativa de 320x180 px y la paleta de colores pixel art.
