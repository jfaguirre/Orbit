import { W, H, GROUND } from './config.js';
import { BoneColossus } from './boss2.js';

function rng(seed) {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return s / 2147483647;
  };
}

export function createCatacumbas() {
  const worldW = 2000;
  const r = rng(4242);

  // Montones de huesos y cráneos sobre el suelo
  const bones = Array.from({ length: 40 }, () => ({
    x: 15 + r() * (worldW - 30),
    skull: r() < 0.5,
    w: 4 + Math.floor(r() * 6),
  }));

  const sky = (() => {
    const c = document.createElement('canvas').getContext('2d');
    const g = c.createLinearGradient(0, 0, 0, GROUND);
    g.addColorStop(0, '#07070c');
    g.addColorStop(1, '#17121d');
    return g;
  })();

  const vignette = (() => {
    const c = document.createElement('canvas').getContext('2d');
    const g = c.createRadialGradient(W / 2, H / 2, 55, W / 2, H / 2, 200);
    g.addColorStop(0, 'rgba(0,0,0,0)');
    g.addColorStop(1, 'rgba(0,0,0,0.7)');
    return g;
  })();

  const spawns = [
    // Entrada con cráneos en picada y ratas terrestres
    { t: 'rat', x: 280 }, { t: 'skull', x: 340, y: 60 }, { t: 'rat', x: 390 },
    { t: 'skull', x: 440, y: 95 }, { t: 'spider', x: 500 }, { t: 'eye', x: 550, y: 60 },
    // Primera línea de defensa con ídolo y asedio aéreo
    { t: 'idol', x: 620 }, { t: 'skull', x: 660, y: 80 }, { t: 'spider', x: 700 },
    { t: 'bat', x: 740, y: 55 }, { t: 'bat', x: 770, y: 90 }, { t: 'rat', x: 820 },
    { t: 'rat', x: 860 }, { t: 'skull', x: 910, y: 65 }, { t: 'skull', x: 950, y: 105 },
    // Doble ojo vigilante y torreta
    { t: 'eye', x: 1010, y: 55 }, { t: 'spider', x: 1060 }, { t: 'idol', x: 1120 },
    { t: 'skull', x: 1160, y: 75 }, { t: 'spider', x: 1210 }, { t: 'rat', x: 1260 },
    // Sección de emboscada pesada
    { t: 'eye', x: 1310, y: 55 }, { t: 'eye', x: 1350, y: 85 }, { t: 'bat', x: 1390, y: 70 },
    { t: 'skull', x: 1440, y: 60 }, { t: 'skull', x: 1470, y: 110 }, { t: 'spider', x: 1520 },
    { t: 'idol', x: 1580 }, { t: 'skull', x: 1630, y: 80 }, { t: 'eye', x: 1680, y: 65 },
    { t: 'rat', x: 1720 }, { t: 'spider', x: 1760 }, { t: 'skull', x: 1800, y: 70 },
    { t: 'eye', x: 1840, y: 80 }, { t: 'rat', x: 1870 }
  ];

  return {
    name: 'Catacumbas olvidadas',
    music: 'level2',
    worldW,
    spawns,
    createBoss: () => new BoneColossus(worldW - 70),
    update() {},
    draw(ctx, t, camX) {
      // Fondo
      ctx.fillStyle = sky;
      ctx.fillRect(0, 0, W, GROUND);

      // Muro de ladrillos (paralaje lento)
      ctx.fillStyle = '#0f0d16';
      for (let row = 0; row * 12 < GROUND; row++) {
        const y = row * 12;
        ctx.fillRect(0, y, W, 1);
        const off = (row % 2) * 16;
        const start = -(((camX * 0.3 + off) % 32) + 32) % 32;
        for (let x = start; x < W; x += 32) ctx.fillRect(Math.round(x), y, 1, 12);
      }

      // Pilares y arcos (capa intermedia)
      const SP = 110;
      const k0 = Math.floor((camX * 0.5) / SP) - 1;
      for (let k = k0; k < k0 + 5; k++) {
        const sx = Math.round(k * SP - camX * 0.5);
        ctx.fillStyle = '#07060b';
        ctx.fillRect(sx - 7, 0, 14, GROUND);
        ctx.fillStyle = '#15111d';
        ctx.fillRect(sx - 7, 0, 2, GROUND);
        ctx.strokeStyle = '#07060b';
        ctx.lineWidth = 8;
        ctx.beginPath();
        ctx.arc(sx + SP / 2, 62, 46, Math.PI, Math.PI * 2);
        ctx.stroke();

        // Antorcha en un pilar de cada dos
        if (((k % 2) + 2) % 2 === 0) {
          const fl = Math.sin(t * 12 + k) * 0.5 + Math.sin(t * 7.3 + k * 2) * 0.5;
          ctx.fillStyle = '#3a2a1a';
          ctx.fillRect(sx - 1, 66, 3, 6);
          ctx.save();
          ctx.globalCompositeOperation = 'lighter';
          ctx.fillStyle = `rgba(255,150,50,${0.14 + fl * 0.03})`;
          ctx.beginPath(); ctx.arc(sx, 62, 40 + fl * 3, 0, Math.PI * 2); ctx.fill();
          ctx.fillStyle = '#ff9a2e';
          ctx.fillRect(sx - 1, 60 + Math.round(fl), 3, 6);
          ctx.fillStyle = '#ffe08a';
          ctx.fillRect(sx, 62, 1, 3);
          ctx.restore();
        }
      }

      // Goteras
      ctx.fillStyle = 'rgba(120,160,200,0.5)';
      for (let i = 0; i < 4; i++) {
        const dx = ((((i * 83 + 20 - camX * 0.5) % W) + W) % W);
        const dy = (t * 70 + i * 47) % GROUND;
        ctx.fillRect(Math.round(dx), Math.round(dy), 1, 3);
      }

      // Suelo
      ctx.fillStyle = '#0b0910';
      ctx.fillRect(0, GROUND, W, H - GROUND);
      ctx.fillStyle = '#2a2236';
      ctx.fillRect(0, GROUND, W, 1);
      ctx.fillStyle = '#14101c';
      for (let x = -(Math.round(camX) % 24); x < W; x += 24) ctx.fillRect(x, GROUND + 1, 1, H - GROUND);

      // Huesos y cráneos
      for (const b of bones) {
        const bx = Math.round(b.x - camX);
        if (bx < -12 || bx > W + 12) continue;
        ctx.fillStyle = '#8f8872';
        if (b.skull) {
          ctx.beginPath(); ctx.arc(bx, GROUND - 2, 3, 0, Math.PI * 2); ctx.fill();
          ctx.fillStyle = '#0b0910';
          ctx.fillRect(bx - 2, GROUND - 3, 1, 1);
          ctx.fillRect(bx + 1, GROUND - 3, 1, 1);
        } else {
          ctx.fillRect(bx, GROUND - 1, b.w, 1);
          ctx.fillRect(bx + 1, GROUND - 2, 1, 1);
          ctx.fillRect(bx + b.w - 2, GROUND - 2, 1, 1);
        }
      }

      // Niebla baja azulada
      ctx.fillStyle = 'rgba(110,130,170,0.05)';
      for (let i = 0; i < 5; i++) {
        const x = ((((i * 90 + t * 5 - camX * 0.3) % (W + 120)) + (W + 120)) % (W + 120)) - 60;
        ctx.beginPath(); ctx.ellipse(x, GROUND - 6, 55, 7, 0, 0, Math.PI * 2); ctx.fill();
      }

      // Viñeta
      ctx.fillStyle = vignette;
      ctx.fillRect(0, 0, W, H);
    },
  };
}