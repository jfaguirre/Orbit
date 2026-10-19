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
    if (!tab) {
      console.log('No tab found');
      return;
    }

    const ws = new WebSocket(tab.webSocketDebuggerUrl);
    let id = 1;

    ws.onopen = () => {
      ws.send(JSON.stringify({ id: id++, method: 'Runtime.enable' }));
      ws.send(JSON.stringify({ id: id++, method: 'Log.enable' }));
    };

    ws.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      if (msg.method === 'Runtime.exceptionThrown') {
        console.error('EXCEPTION:', JSON.stringify(msg.params.exceptionDetails, null, 2));
      } else if (msg.method === 'Runtime.consoleAPICalled') {
        console.log('CONSOLE:', msg.params.type, msg.params.args.map((a) => a.value || a.description).join(' '));
      }
    };

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

    await wait(1000);

    // Inyectar capturador de errores globales
    await evalCode(`
      window.__ERRORS__ = [];
      window.onerror = (msg, url, line, col, err) => {
        window.__ERRORS__.push({ msg, line, stack: err ? err.stack : null });
      };
      window.onunhandledrejection = (e) => {
        window.__ERRORS__.push({ msg: 'Unhandled rejection: ' + e.reason });
      };
    `);

    // Iniciar movimiento y disparo
    ws.send(JSON.stringify({
      id: id++,
      method: 'Input.dispatchKeyEvent',
      params: { type: 'keyDown', code: 'ArrowRight', key: 'ArrowRight', windowsVirtualKeyCode: 39 },
    }));
    ws.send(JSON.stringify({
      id: id++,
      method: 'Input.dispatchKeyEvent',
      params: { type: 'keyDown', code: 'KeyX', key: 'x', windowsVirtualKeyCode: 88 },
    }));

    // Monitorear durante 20 segundos
    for (let step = 0; step < 30; step++) {
      await wait(600);
      const snapshot = await evalCode(`
        (() => {
          return {
            errors: window.__ERRORS__,
            performanceNow: performance.now(),
          };
        })()
      `);
      if (snapshot?.errors && snapshot.errors.length > 0) {
        console.error('Captured window errors:', snapshot.errors);
      }
      // Alternar embestida
      if (step % 4 === 0) {
        ws.send(JSON.stringify({
          id: id++,
          method: 'Input.dispatchKeyEvent',
          params: { type: 'keyDown', code: 'KeyZ', key: 'z', windowsVirtualKeyCode: 90 },
        }));
        await wait(60);
        ws.send(JSON.stringify({
          id: id++,
          method: 'Input.dispatchKeyEvent',
          params: { type: 'keyUp', code: 'KeyZ', key: 'z', windowsVirtualKeyCode: 90 },
        }));
      }
    }
  } catch (err) {
    console.error('Script error:', err);
  } finally {
    edge.kill();
  }
}

run();
