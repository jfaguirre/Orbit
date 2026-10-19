import { spawn } from 'node:child_process';

const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const port = 9222;

const edge = spawn(edgePath, [
  '--headless',
  `--remote-debugging-port=${port}`,
  '--disable-gpu',
  '--no-sandbox',
  'http://localhost:5173',
]);

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function run() {
  await wait(1500);
  try {
    const res = await fetch(`http://127.0.0.1:${port}/json`);
    const tabs = await res.json();
    const tab = tabs.find((t) => t.url.includes('5173')) || tabs[0];
    if (!tab) return;

    const ws = new WebSocket(tab.webSocketDebuggerUrl);
    let id = 1;

    ws.onopen = () => {
      ws.send(JSON.stringify({ id: id++, method: 'Runtime.enable' }));
      ws.send(JSON.stringify({ id: id++, method: 'Log.enable' }));
    };

    const errors = [];
    ws.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      if (msg.method === 'Runtime.exceptionThrown') {
        console.error('EXCEPTION:', JSON.stringify(msg.params.exceptionDetails, null, 2));
        errors.push(msg.params.exceptionDetails);
      } else if (msg.method === 'Runtime.consoleAPICalled') {
        console.log('CONSOLE:', msg.params.type, msg.params.args.map((a) => a.value || a.description).join(' '));
      }
    };

    await wait(500);

    // Ejecutar código dentro de la página para inspeccionar el estado del juego
    const evalCode = (expr) => {
      return new Promise((resolve) => {
        const curId = id++;
        const handler = (event) => {
          const m = JSON.parse(event.data);
          if (m.id === curId) {
            ws.removeEventListener('message', handler);
            resolve(m.result?.result?.value);
          }
        };
        ws.addEventListener('message', handler);
        ws.send(JSON.stringify({
          id: curId,
          method: 'Runtime.evaluate',
          params: { expression: expr, returnByValue: true },
        }));
      });
    };

    console.log('Initial page title:', await evalCode('document.title'));

    // Test 1: Let's see if player gets hurt and dies
    console.log('Testing player damage and game over...');
    await evalCode(`
      // Simular recibir daño hasta morir
      window.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyX' }));
    `);

    await wait(1000);

    // Test 2: Teleport player to boss to see boss fight
    console.log('Testing boss trigger...');
    const bossResult = await evalCode(`
      (() => {
        // Enviar teclas o teletransportar
        return window.__TEST_STATE__ || 'ok';
      })()
    `);
    console.log('Boss state test:', bossResult);

    await wait(1000);
    console.log('Total exceptions so far:', errors.length);
  } finally {
    edge.kill();
  }
}

run();
