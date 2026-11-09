# Referencia de Patrones de Combate y Balística de Jefes

## 1. Dispersión Angular de Proyectiles (Patrón en Abanico)
Para un abanico uniforme de $N$ proyectiles:
$$\theta_i = \theta_{\text{base}} + \left(i - \frac{N-1}{2}\right) \cdot \Delta\theta$$
- **Fase Normal:** $N = 4$, $\Delta\theta = 0.28\text{ rad} \approx 16^\circ$. Permite amplios huecos de evasión.
- **Fase de Furia:** $N = 7$, $\Delta\theta = 0.22\text{ rad} \approx 12.6^\circ$. Requiere uso obligatorio de la embestida invulnerable (Dash).

## 2. Anillos Radiales (Ráfaga en Anillo)
Para un anillo de $M$ proyectiles distribuidos uniformemente en $360^\circ$:
$$\theta_j = \frac{2\pi \cdot j}{M} + \phi_{\text{desfase}}$$
- Para entrelazar dos anillos sucesivos: $\phi_{\text{desfase}_2} = \frac{\pi}{M}$.

## 3. Tiempos de Reacción Humana (Ventanas de Aviso / Telegrafiado)
- El tiempo promedio de reacción visual humana es de 250 a 300 ms.
- Todo ataque de área o embestida veloz debe tener un tiempo de **aviso (telegraph)** mínimo de:
  - Fase Normal: $\ge 600\text{ ms}$
  - Fase de Furia: $\ge 400\text{ ms}$
- Durante los últimos 150 ms del aviso, la trayectoria debe bloquearse en coordenadas fijas para permitir que el jugador se desplace fuera del área de impacto.
