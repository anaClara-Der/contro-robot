const connectBtn = document.getElementById('connectBtn');
const disconnectBtn = document.getElementById('disconnectBtn');
const baudSelect = document.getElementById('baud');
const dot = document.getElementById('dot');
const statusText = document.getElementById('statusText');
const logEl = document.getElementById('log');
const unsupportedEl = document.getElementById('unsupported');

let port = null;
let writer = null;

const keyMap = {
  'w': 'w', 'arrowup': 'w',
  's': 's', 'arrowdown': 's',
  'a': 'a', 'arrowleft': 'a',
  'd': 'd', 'arrowright': 'd',
};
const STOP_CHAR = 'x';
let activeKey = null;

function log(msg) {
  const time = new Date().toLocaleTimeString();
  logEl.textContent = `[${time}] ${msg}\n` + logEl.textContent;
}

function setConnected(isConnected) {
  dot.classList.toggle('on', isConnected);
  statusText.textContent = isConnected ? 'Conectado' : 'Sin conectar';
  connectBtn.disabled = isConnected;
  disconnectBtn.disabled = !isConnected;
  baudSelect.disabled = isConnected;
}

async function sendChar(ch) {
  if (!writer) return;
  try {
    const data = new TextEncoder().encode(ch);
    await writer.write(data);
    log(`Enviado: '${ch}' (${ch.charCodeAt(0)})`);
  } catch (err) {
    log('Error al enviar: ' + err.message);
  }
}

async function connect() {
  if (!('serial' in navigator)) {
    unsupportedEl.style.display = 'block';
    return;
  }
  try {
    port = await navigator.serial.requestPort();
    await port.open({ baudRate: parseInt(baudSelect.value, 10) });
    writer = port.writable.getWriter();
    setConnected(true);
    log('Puerto abierto a ' + baudSelect.value + ' baudios.');
  } catch (err) {
    log('No se pudo conectar: ' + err.message);
  }
}

async function disconnect() {
  try {
    if (writer) {
      try { await writer.close(); } catch (e) {}
      writer.releaseLock();
      writer = null;
    }
    if (port) {
      await port.close();
      port = null;
    }
  } catch (err) {
    log('Error al desconectar: ' + err.message);
  } finally {
    setConnected(false);
    log('Desconectado.');
  }
}

connectBtn.addEventListener('click', connect);
disconnectBtn.addEventListener('click', disconnect);

function highlightKey(dirKey, on) {
  const el = document.querySelector(`.key[data-key="${dirKey === 'w' ? 'ArrowUp' : dirKey === 's' ? 'ArrowDown' : dirKey === 'a' ? 'ArrowLeft' : 'ArrowRight'}"]`);
  if (el) el.classList.toggle('active', on);
}

window.addEventListener('keydown', (e) => {
  const k = e.key.toLowerCase();
  const mapped = keyMap[k];
  if (!mapped) return;
  e.preventDefault();
  if (e.repeat) return;
  if (activeKey === mapped) return;
  activeKey = mapped;
  highlightKey(mapped, true);
  sendChar(mapped);
});

window.addEventListener('keyup', (e) => {
  const k = e.key.toLowerCase();
  const mapped = keyMap[k];
  if (!mapped) return;
  e.preventDefault();
  if (activeKey === mapped) {
    activeKey = null;
    highlightKey(mapped, false);
    sendChar(STOP_CHAR);
  }
});

if (!('serial' in navigator)) {
  unsupportedEl.style.display = 'block';
}
