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

    ws.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      if (msg.method === 'Runtime.exceptionThrown') {
        console.error('*** EXCEPTION THROWN ***:', JSON.stringify(msg.params.exceptionDetails, null, 2));
      } else if (msg.method === 'Runtime.consoleAPICalled') {
        console.log('CONSOLE:', msg.params.type, msg.params.args.map((a) => a.value || a.description).join(' '));
      }
    };

    await wait(1000);

    // Mover hacia la derecha SIN disparar para chocar contra las ratas y murciélagos
    ws.send(JSON.stringify({
      id: id++,
      method: 'Input.dispatchKeyEvent',
      params: { type: 'keyDown', code: 'ArrowRight', key: 'ArrowRight', windowsVirtualKeyCode: 39 },
    }));

    // Esperar 8 segundos recibiendo daño hasta morir
    await wait(8000);

    // Presionar Enter para reintentar
    ws.send(JSON.stringify({
      id: id++,
      method: 'Input.dispatchKeyEvent',
      params: { type: 'keyDown', code: 'Enter', key: 'Enter', windowsVirtualKeyCode: 13 },
    }));
    await wait(100);
    ws.send(JSON.stringify({
      id: id++,
      method: 'Input.dispatchKeyEvent',
      params: { type: 'keyUp', code: 'Enter', key: 'Enter', windowsVirtualKeyCode: 13 },
    }));

    await wait(2000);
  } finally {
    edge.kill();
  }
}

run();
