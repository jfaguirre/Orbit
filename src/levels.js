import { W, H, GROUND } from './config.js';
import { Boss } from './boss.js';
import { createCatacumbas } from './level2.js';
import { createPantano } from './level3.js';

// Generador pseudoaleatorio con semilla: el escenario siempre sale igual
function rng(seed) {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return s / 2147483647;
  };
}

// Árbol seco: ramas recursivas guardadas como segmentos
function branch(segs, r, x, y, ang, len, depth) {
  if (depth === 0 || len < 3) return;
  const x2 = x + Math.cos(ang) * len;
  const y2 = y + Math.sin(ang) * len;
  segs.push([x, y, x2, y2, depth]);
  const n = depth > 2 ? 2 : r() < 0.5 ? 1 : 2;
  for (let i = 0; i < n; i++) {
    branch(segs, r, x2, y2, ang + (r() - 0.5) * 1.2, len * (0.65 + r() * 0.15), depth - 1);
  }
}

function createCementerio() {
  const worldW = 1800; // largo total del nivel en píxeles
  const r = rng(1337);

  const stars = Array.from({ length: 50 }, () => ({ x: r() * W, y: r() * 90, b: r() }));

  // Árboles: capa intermedia, se mueve a la mitad de velocidad que la cámara
  const treeLayerW = worldW * 0.5 + W;
  const trees = [];
  for (let x = 20; x < treeLayerW; x += 50 + r() * 45) {
    const segs = [];
    branch(segs, r, x, GROUND - 2, -Math.PI / 2 + (r() - 0.5) * 0.25, 16 + r() * 12, 5);
    trees.push({ x, segs });
  }

  // Lápidas: pegadas al suelo, se mueven igual que el mundo
  const tombs = Array.from({ length: 45 }, () => ({
    x: 20 + r() * (worldW - 40),
    w: 6 + Math.floor(r() * 5),
    h: 8 + Math.floor(r() * 8),
    cross: r() < 0.3,
  }));

  const hillY = (x) => GROUND - 32 + Math.sin(x * 0.02) * 8 + Math.sin(x * 0.05 + 1) * 5;

  const sky = (() => {
    const c = document.createElement('canvas').getContext('2d');
    const g = c.createLinearGradient(0, 0, 0, GROUND);
    g.addColorStop(0, '#07070f');
    g.addColorStop(1, '#1d1530');
    return g;
  })();

  const vignette = (() => {
    const c = document.createElement('canvas').getContext('2d');
    const g = c.createRadialGradient(W / 2, H / 2, 60, W / 2, H / 2, 200);
    g.addColorStop(0, 'rgba(0,0,0,0)');
    g.addColorStop(1, 'rgba(0,0,0,0.65)');
    return g;
  })();

  // Enemigos del nivel, ordenados por x. Aparecen al acercarse la cámara.
  // t: bat | rat | eye | idol | spider   (y solo importa para los voladores)
  const spawns = [
    // Oleada inicial
    { t: 'rat', x: 260 }, { t: 'bat', x: 310, y: 70 },
    { t: 'rat', x: 380 }, { t: 'bat', x: 420, y: 90 }, { t: 'bat', x: 460, y: 50 },
    // Encuentro terrestre y aéreo combinado
    { t: 'rat', x: 530 }, { t: 'rat', x: 570 }, { t: 'eye', x: 620, y: 65 },
    { t: 'spider', x: 690 }, { t: 'bat', x: 730, y: 80 }, { t: 'bat', x: 770, y: 55 },
    // Primera torreta de fuego con apoyo de arañas y ratas
    { t: 'idol', x: 840 }, { t: 'spider', x: 880 }, { t: 'eye', x: 920, y: 60 },
    { t: 'rat', x: 970 }, { t: 'rat', x: 1010 }, { t: 'bat', x: 1050, y: 90 },
    // Zona de fuego cruzado intenso
    { t: 'spider', x: 1110 }, { t: 'eye', x: 1150, y: 50 }, { t: 'idol', x: 1200 },
    { t: 'spider', x: 1240 }, { t: 'bat', x: 1280, y: 65 }, { t: 'bat', x: 1310, y: 100 },
    { t: 'rat', x: 1350 }, { t: 'rat', x: 1390 }, { t: 'eye', x: 1430, y: 70 },
    // Última emboscada antes del jefe
    { t: 'idol', x: 1490 }, { t: 'spider', x: 1530 }, { t: 'bat', x: 1560, y: 60 },
    { t: 'bat', x: 1590, y: 95 }, { t: 'eye', x: 1630, y: 65 }, { t: 'rat', x: 1660 }
  ];

  return {
    name: 'Cementerio de la niebla',
    music: 'level1',
    worldW,
    spawns,
    createBoss: () => new Boss(worldW - 56),
    update() {},
    draw(ctx, t, camX) {
      // Cielo
      ctx.fillStyle = sky;
      ctx.fillRect(0, 0, W, GROUND);

      // Estrellas parpadeantes
      for (const s of stars) {
        const sx = (((s.x - camX * 0.02) % W) + W) % W;
        ctx.fillStyle = `rgba(200,200,230,${0.2 + 0.4 * Math.abs(Math.sin(t * 0.8 + s.b * 10))})`;
        ctx.fillRect(Math.round(sx), Math.round(s.y), 1, 1);
      }

      // Luna
      const mx = 240 - camX * 0.02;
      ctx.fillStyle = 'rgba(201,196,176,0.08)';
      ctx.beginPath(); ctx.arc(mx, 40, 26, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#c9c4b0';
      ctx.beginPath(); ctx.arc(mx, 40, 14, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#a8a390';
      ctx.fillRect(Math.round(mx) - 4, 36, 3, 3);
      ctx.fillRect(Math.round(mx) + 3, 43, 2, 2);

      // Colinas lejanas
      ctx.fillStyle = '#12101c';
      ctx.beginPath();
      ctx.moveTo(0, GROUND);
      for (let x = 0; x <= W; x += 4) ctx.lineTo(x, hillY(x + camX * 0.2));
      ctx.lineTo(W, GROUND);
      ctx.fill();

      // Árboles secos
      ctx.save();
      ctx.translate(-Math.round(camX * 0.5), 0);
      ctx.strokeStyle = '#0a0812';
      ctx.lineCap = 'butt';
      for (const tr of trees) {
        const sx = tr.x - camX * 0.5;
        if (sx < -50 || sx > W + 50) continue;
        for (const [x1, y1, x2, y2, d] of tr.segs) {
          ctx.lineWidth = d * 0.8;
          ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
        }
      }
      // Ojos ámbar entre los árboles (parpadean)
      if (t % 7 < 6.7 && trees[3]) {
        ctx.fillStyle = '#ffb02e';
        ctx.fillRect(Math.round(trees[3].x) - 4, 118, 2, 1);
        ctx.fillRect(Math.round(trees[3].x) + 2, 118, 2, 1);
      }
      ctx.restore();

      // Suelo
      ctx.fillStyle = '#0a0810';
      ctx.fillRect(0, GROUND, W, H - GROUND);
      ctx.fillStyle = '#241d3a';
      ctx.fillRect(0, GROUND, W, 1);

      // Lápidas
      ctx.fillStyle = '#07060c';
      for (const g of tombs) {
        const gx = Math.round(g.x - camX);
        if (gx < -10 || gx > W + 10) continue;
        ctx.fillRect(gx, GROUND - g.h + 4, g.w, g.h);
        ctx.fillRect(gx + 1, GROUND - g.h + 3, g.w - 2, 1);
        if (g.cross) {
          ctx.fillRect(gx + Math.floor(g.w / 2), GROUND - g.h - 4, 1, 8);
          ctx.fillRect(gx + Math.floor(g.w / 2) - 2, GROUND - g.h - 2, 5, 1);
        }
      }

      // Niebla a la deriva
      const bands = [
        { y: GROUND - 4, speed: 6, a: 0.07 },
        { y: GROUND - 14, speed: -4, a: 0.05 },
        { y: GROUND - 26, speed: 3, a: 0.04 },
      ];
      for (const b of bands) {
        ctx.fillStyle = `rgba(150,140,190,${b.a})`;
        for (let i = 0; i < 5; i++) {
          const x = ((((i * 90 + t * b.speed - camX * 0.3) % (W + 120)) + (W + 120)) % (W + 120)) - 60;
          ctx.beginPath();
          ctx.ellipse(x, b.y, 50, 6, 0, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // Viñeta oscura
      ctx.fillStyle = vignette;
      ctx.fillRect(0, 0, W, H);
    },
  };
}

// Cada nivel es una función que crea su escenario.
export const levels = [createCementerio, createCatacumbas, createPantano];