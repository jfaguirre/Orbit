# Guía de Ritmo (Pacing) y Escenografía de Niveles

## 1. Niveles Actuales
| Nivel | Nombre | Temática | Enemigos Clave | Jefe |
|---|---|---|---|---|
| 1 | Cementerio de la Niebla | Nocturno, estrellas, lápidas y árboles secos | Murciélago, Rata, Ojo, Ídolo | Espectro Segador |
| 2 | Catacumbas Olvidadas | Subterráneo, antorchas de fuego, pilares | Araña saltarina, Cráneo en llamas | Coloso de Huesos |
| 3 | Pantano Muerto | Cieno tóxico, luciérnagas, niebla densa | Platillo volador, Murciélago cazador | Fantasma del Pantano |

## 2. Parámetros de Cámara y Parallax
- **Capa Estelar / Cielo Lejano:** Factor de desplazamiento relativo $0.0$ a $0.1$.
- **Capa Media (árboles / pilares):** Factor de desplazamiento relativo $0.5$.
- **Suelo y Primer Plano:** Factor de desplazamiento $1.0$ (coordenadas reales del mundo).
- **Amortiguación de Cámara:** `camX += (target - camX) * Math.min(1, dt * 6)`.
