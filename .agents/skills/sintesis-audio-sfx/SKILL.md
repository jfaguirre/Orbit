---
name: sintesis-audio-sfx
description: >-
  Genera, edita y ajusta efectos de sonido (SFX) procedurales en formato WAV PCM de 16-bit utilizando WebAudio y scripts de síntesis matemática para Plasma Orb. Usar cuando se requiera añadir un nuevo sonido de impacto, rugido de jefe, rayo láser o disparo de plasma.
---

# Habilidad del Agente: Síntesis de Audio y Efectos de Sonido (SFX)

Esta habilidad permite generar efectos de sonido de estilo arcade retro 8-bit / 16-bit sin necesidad de librerías externas ni archivos de audio prediseñados, utilizando síntesis pura basada en formas de onda matemáticas y modulación de frecuencia.

## Procedimiento de Generación de SFX

1. **Definir la envolvente matemática del sonido en `scripts/generate_sfx.js`:**
   - Crear una función generadora que retorne un `Float32Array` con valores entre $[-1.0, 1.0]$.
   - Aplicar modulación de frecuencia (FM) o caída exponencial de ganancia para simular percusión, ráfagas o impulsos de plasma.

   *Ejemplo de barrido descendente (láser de plasma):*
   ```javascript
   function generarLaser() {
     const duracion = 0.12;
     const n = Math.floor(SAMPLE_RATE * duracion);
     const salida = new Float32Array(n);
     let fase = 0;
     for (let i = 0; i < n; i++) {
       const t = i / SAMPLE_RATE;
       const frec = 880 * Math.exp(-t * 28);
       fase += (2 * Math.PI * frec) / SAMPLE_RATE;
       salida[i] = Math.sin(fase) * (1 - t / duracion);
     }
     return salida;
   }
   ```

2. **Compilar los buffers a archivos WAV:**
   Ejecutar el script generador para exportar los buffers PCM a `public/sounds/`:
   ```bash
   node scripts/generate_sfx.js
   ```

3. **Registrar en el Gestor de Audio:**
   En `src/audio.js`:
   - Añadir la ruta en `SFX_FILES`.
   - Exponer el método correspondiente en `sfx` con llamada polifónica.

## Referencias
- Para fórmulas de ruido blanco, distorsión armónica y frecuencias de resonancia, consulta [formulas-sintesis.md](./referencias/formulas-sintesis.md).
