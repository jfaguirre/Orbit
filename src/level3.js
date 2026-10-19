import { W, H, GROUND } from './config.js';
import { SwampGhost } from './boss3.js';

function rng(seed) {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return s / 2147483647;
  };
}

function branch(segs, r, x, y, ang, len, depth) {
  if (depth === 0 || len < 3) return;
  const x2 = x + Math.cos(ang) * len;
  const y2 = y + Math.sin(ang) * len;
  segs.push([x, y, x2, y2, depth]);
  const n = depth > 2 ? 2 : r() < 0.5 ? 1 : 2;
  for (let i = 0; i < n; i++) {
    branch(segs, r, x2, y2, ang + (r() - 0.5) * 1.3, len * (0.65 + r() * 0.15), depth - 1);
  }
}

function makeTrees(r, layerW, step, base, lenMin, lenVar, depth) {
  const trees = [];
  for (let x = 10; x < layerW; x += step[0] + r() * step[1]) {
    const segs = [];
    branch(segs, r, x, base, -Math.PI / 2 + (r() - 0.5) * 0.3, lenMin + r() * lenVar, depth);
    trees.push({ x, segs });
  }
  return trees;
}

function drawTrees(ctx, trees, camX, factor, color) {
  ctx.save();
  ctx.translate(-Math.round(camX * factor), 0);
  ctx.strokeStyle = color;
  ctx.lineCap = 'butt';
  for (const tr of trees) {
    const sx = tr.x - camX * factor;
    if (sx < -60 || sx > W + 60) continue;
    for (const [x1, y1, x2, y2, d] of tr.segs) {
      ctx.lineWidth = d * 0.8;
      ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
    }
  }
  ctx.restore();
}

export function createPantano() {
  const worldW = 2400;
  const r = rng(777);

  const farTrees = makeTrees(r, worldW * 0.25 + W, [45, 40], GROUND - 6, 14, 10, 4);
  const nearLayerW = worldW * 0.55 + W;
  const nearTrees = makeTrees(r, nearLayerW, [80, 60], GROUND - 2, 24, 14, 5);
  const vines = Array.from({ length: 50 }, () => ({ x: r() * nearLayerW, len: 15 + r() * 50, ph: r() * 6 }));
  const wisps = Array.from({ length: 12 }, () => ({ x: r() * worldW, y: 55 + r() * 75, ph: r() * 6 }));
  const reeds = Array.from({ length: 80 }, () => ({ x: r() * worldW, h: 8 + r() * 14, ph: r() * 6 }));

  const sky = (() => {
    const c = document.createElement('canvas').getContext('2d');
    const g = c.createLinearGradient(0, 0, 0, GROUND);
    g.addColorStop(0, '#050908');
    g.addColorStop(1, '#15251f');
    return g;
  })();

  const vignette = (() => {
    const c = document.createElement('canvas').getContext('2d');
    const g = c.createRadialGradient(W / 2, H / 2, 55, W / 2, H / 2, 200);
    g.addColorStop(0, 'rgba(0,0,0,0)');
    g.addColorStop(1, 'rgba(0,0,0,0.7)');
    return g;
  })();

  // Nivel más difícil: más enemigos, en grupos, y platillos voladores.
  // t: bat | rat | eye | idol | spider | skull | ufo
  const spawns = [
    { t: 'bat', x: 360, y: 70 }, { t: 'rat', x: 380 }, { t: 'spider', x: 430 },
    { t: 'skull', x: 500, y: 80 }, { t: 'skull', x: 520, y: 50 }, { t: 'rat', x: 560 },
    { t: 'ufo', x: 640, y: 50 },
    { t: 'idol', x: 720 }, { t: 'spider', x: 760 }, { t: 'bat', x: 800, y: 60 }, { t: 'bat', x: 820, y: 100 },
    { t: 'eye', x: 880, y: 50 }, { t: 'rat', x: 900 }, { t: 'rat', x: 930 },
    { t: 'ufo', x: 1000, y: 70 }, { t: 'skull', x: 1040, y: 90 },
    { t: 'spider', x: 1100 }, { t: 'spider', x: 1130 }, { t: 'idol', x: 1200 },
    { t: 'bat', x: 1250, y: 60 }, { t: 'bat', x: 1270, y: 90 }, { t: 'bat', x: 1290, y: 120 },
    { t: 'eye', x: 1350, y: 60 }, { t: 'eye', x: 1390, y: 100 },
    { t: 'ufo', x: 1450, y: 60 }, { t: 'rat', x: 1480 }, { t: 'spider', x: 1520 },
    { t: 'skull', x: 1580, y: 60 }, { t: 'skull', x: 1600, y: 100 }, { t: 'skull', x: 1620, y: 130 },
    { t: 'idol', x: 1700 }, { t: 'idol', x: 1760 },
    { t: 'ufo', x: 1830, y: 50 }, { t: 'bat', x: 1870, y: 100 }, { t: 'spider', x: 1910 },
    { t: 'eye', x: 1960, y: 60 }, { t: 'rat', x: 2000 }, { t: 'rat', x: 2030 },
    { t: 'ufo', x: 2080, y: 80 }, { t: 'skull', x: 2110, y: 70 }, { t: 'skull', x: 2130, y: 110 },
  ];

  return {
    name: 'Pantano muerto',
    worldW,
    spawns,
    createBoss: () => new SwampGhost(worldW - 70),
    update() {},
    draw(ctx, t, camX) {
      // Cielo
      ctx.fillStyle = sky;
      ctx.fillRect(0, 0, W, GROUND);

      // Luna enfermiza
      const mx = 80 - camX * 0.02;
      ctx.fillStyle = 'rgba(185,202,162,0.08)';
      ctx.beginPath(); ctx.arc(mx, 38, 26, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#b9caa2';
      ctx.beginPath(); ctx.arc(mx, 38, 13, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#9fb088';
      ctx.fillRect(Math.round(mx) - 4, 34, 3, 3);
      ctx.fillRect(Math.round(mx) + 2, 41, 2, 2);

      // Árboles lejanos y cercanos
      drawTrees(ctx, farTrees, camX, 0.25, '#0b1613');
      drawTrees(ctx, nearTrees, camX, 0.55, '#040a08');

      // Lianas que cuelgan
      ctx.strokeStyle = '#07110e';
      ctx.lineWidth = 1;
      for (const v of vines) {
        const sx = v.x - camX * 0.55;
        if (sx < -10 || sx > W + 10) continue;
        const sway = Math.sin(t * 0.8 + v.ph) * 3;
        ctx.beginPath(); ctx.moveTo(Math.round(sx), 0); ctx.lineTo(Math.round(sx + sway), v.len); ctx.stroke();
      }

      // Agua del pantano
      ctx.fillStyle = '#06110f';
      ctx.fillRect(0, GROUND, W, H - GROUND);
      ctx.fillStyle = '#1b3a30';
      ctx.fillRect(0, GROUND, W, 1);
      for (let k = 0; k < 6; k++) { // reflejo de la luna
        ctx.fillStyle = 'rgba(185,202,162,0.15)';
        ctx.fillRect(Math.round(mx - 4 + Math.sin(t * 2 + k) * 2), GROUND + 4 + k * 5, 8, 1);
      }
      for (let i = 0; i < 9; i++) { // ondas
        const x = ((((i * 47 + t * 8 - camX) % W) + W) % W);
        ctx.fillStyle = 'rgba(120,200,170,0.12)';
        ctx.fillRect(Math.round(x), GROUND + 6 + (i % 4) * 8, 10 + (i % 3) * 4, 1);
      }
      for (let i = 0; i < 5; i++) { // burbujas
        const bx = ((((i * 61 - camX) % W) + W) % W);
        const by = GROUND + 28 - ((t * 8 + i * 9) % 26);
        ctx.fillStyle = 'rgba(150,220,190,0.3)';
        ctx.fillRect(Math.round(bx), Math.round(by), 1, 1);
      }

      // Juncos
      ctx.lineWidth = 1;
      for (const re of reeds) {
        const gx = Math.round(re.x - camX);
        if (gx < -10 || gx > W + 10) continue;
        const sway = Math.sin(t * 1.5 + re.ph) * 2;
        ctx.strokeStyle = '#0d1a14';
        ctx.beginPath(); ctx.moveTo(gx, GROUND); ctx.lineTo(Math.round(gx + sway), GROUND - re.h); ctx.stroke();
        ctx.fillStyle = '#2a1f14';
        ctx.fillRect(Math.round(gx + sway) - 1, GROUND - re.h - 4, 2, 4);
      }

      // Fuegos fatuos
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      for (const wp of wisps) {
        const sx = wp.x - camX + Math.sin(t * 0.7 + wp.ph) * 14;
        if (sx < -20 || sx > W + 20) continue;
        const sy = wp.y + Math.sin(t * 1.3 + wp.ph) * 8;
        ctx.fillStyle = 'rgba(140,255,200,0.08)';
        ctx.beginPath(); ctx.arc(sx, sy, 14, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = 'rgba(140,255,200,0.18)';
        ctx.beginPath(); ctx.arc(sx, sy, 6, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#d8fff0';
        ctx.fillRect(Math.round(sx), Math.round(sy), 2, 2);
      }
      ctx.restore();

      // Niebla verdosa
      const bands = [
        { y: GROUND - 6, speed: 5, a: 0.08 },
        { y: GROUND - 18, speed: -3, a: 0.06 },
        { y: GROUND - 34, speed: 2, a: 0.04 },
      ];
      for (const b of bands) {
        ctx.fillStyle = `rgba(130,180,160,${b.a})`;
        for (let i = 0; i < 5; i++) {
          const x = ((((i * 90 + t * b.speed - camX * 0.3) % (W + 120)) + (W + 120)) % (W + 120)) - 60;
          ctx.beginPath(); ctx.ellipse(x, b.y, 55, 7, 0, 0, Math.PI * 2); ctx.fill();
        }
      }

      // Viñeta
      ctx.fillStyle = vignette;
      ctx.fillRect(0, 0, W, H);
    },
  };
}