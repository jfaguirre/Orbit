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
    if (!tab || !tab.webSocketDebuggerUrl) {
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
        console.error('EXCEPTION THROWN:', JSON.stringify(msg.params.exceptionDetails, null, 2));
      } else if (msg.method === 'Runtime.consoleAPICalled') {
        console.log('CONSOLE:', msg.params.type, msg.params.args.map((a) => a.value || a.description).join(' '));
      }
    };

    await wait(1000);

    // Mover hacia la derecha constantemente y disparar
    ws.send(JSON.stringify({
      id: id++,
      method: 'Input.dispatchKeyEvent',
      params: { type: 'keyDown', code: 'ArrowRight', key: 'ArrowRight', windowsVirtualKeyCode: 39 },
    }));

    // Mantener presionado X (disparo continuo)
    ws.send(JSON.stringify({
      id: id++,
      method: 'Input.dispatchKeyEvent',
      params: { type: 'keyDown', code: 'KeyX', key: 'x', windowsVirtualKeyCode: 88 },
    }));

    // Simular 20 segundos de juego avanzando por el nivel
    for (let i = 0; i < 200; i++) {
      if (i % 20 === 0) {
        // Presionar Z (embestida)
        ws.send(JSON.stringify({
          id: id++,
          method: 'Input.dispatchKeyEvent',
          params: { type: 'keyDown', code: 'KeyZ', key: 'z', windowsVirtualKeyCode: 90 },
        }));
        await wait(50);
        ws.send(JSON.stringify({
          id: id++,
          method: 'Input.dispatchKeyEvent',
          params: { type: 'keyUp', code: 'KeyZ', key: 'z', windowsVirtualKeyCode: 90 },
        }));
      }
      await wait(100);
    }
  } catch (err) {
    console.error('Error in script:', err);
  } finally {
    edge.kill();
  }
}

run();
