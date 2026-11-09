# Fórmulas de Síntesis de Efectos de Sonido Chiptune

## 1. Estructura del Encabezado RIFF / WAV (44 bytes)
- **Formato:** PCM lineal sin comprimir
- **Canales:** 1 (Mono)
- **Frecuencia de muestreo:** 44,100 Hz
- **Profundidad de bits:** 16-bit con signo (`Int16LE`, rango $[-32768, 32767]$)

## 2. Tipos de Generadores
- **Barrido Exponencial (Disparos / Láser):**
  $$f(t) = f_0 \cdot e^{-k \cdot t}$$
- **Onda Senoidal Pura con Vibrato (Flotación mística):**
  $$f(t) = f_0 + A_{\text{vib}} \cdot \sin(2\pi \cdot f_{\text{vib}} \cdot t)$$
- **Ruido Rosa / Blanco Filtrado (Explosiones e impactos):**
  $$s(t) = (2 \cdot \text{random}() - 1) \cdot (1 - t/T)^2$$
