# Plasma Orb

## Descripción
**Plasma Orb** es un videojuego de acción y disparos en 2D (*side-scroller / shoot 'em up*) con estilo retro pixel art (resolución nativa de 320x180 px). El jugador controla un orbe de plasma con movimiento fluido e inercia, enfrentándose a oleadas de enemigos, patrones de proyectiles y batallas contra jefes finales a lo largo de varios niveles.

---

## Requisitos Técnicos

### Software necesario
- **Node.js**: Versión 18.0 o superior (recomendada 20.x o 22.x LTS).
- **npm**: Versión 9.0 o superior (incluido con Node.js).
- **Navegador web**: Compatible con HTML5 Canvas y Web Audio API (Chrome, Firefox, Edge, Safari u Opera actualizados).
- **Sistema Operativo**: Windows, macOS o Linux.

---

## Instalación y Ejecución

1. **Clonar o descargar el proyecto** y ubicarse en el directorio raíz:
   ```bash
   cd Orbit
   ```

2. **Instalar las dependencias:**
   ```bash
   npm install
   ```

3. **Iniciar el juego en modo desarrollo:**
   ```bash
   npm run dev
   ```
   Abre en el navegador el enlace que genera la consola (por defecto: `http://localhost:5173`).

### Comandos adicionales
- **Compilar para producción:**
  ```bash
  npm run build
  ```
- **Previsualizar la compilación:**
  ```bash
  npm run preview
  ```

---

## Controles

| Acción | Tecla |
|---|---|
| **Movimiento** | Flechas de dirección (`←`, `→`, `↑`, `↓`) |
| **Disparar** | `X` (mantener para ráfaga) |
| **Embestida / Dash** | `Z` |
| **Silenciar música** | `M` |
| **Reiniciar juego** | `Enter`, `Espacio`, `Z` o `X` |
