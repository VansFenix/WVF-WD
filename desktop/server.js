const http = require('http');
const fs = require('fs');
const path = require('path');
const { spawn, exec } = require('child_process');
const os = require('os');

const PORT = process.env.PORT || 7474;
const PUBLIC_DIR = path.join(__dirname, 'public');

let clientProcess = null;
let sseClients = [];
let isConnected = false;
let currentConfig = null;
let systemProxyEnabled = false;

// MIME types
const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon'
};

function broadcastEvent(data) {
  const payload = `data: ${JSON.stringify(data)}\n\n`;
  sseClients.forEach(res => {
    try {
      res.write(payload);
    } catch (e) {}
  });
}

function broadcastLog(line) {
  broadcastEvent({ type: 'log', message: line });
}

// Find Go binary or fallback
function getClientExecutable() {
  const isWin = process.platform === 'win32';
  const binaryName = isWin ? 'wvf-wd.exe' : 'wvf-wd';
  
  // Look in root or desktop directory
  const rootBin = path.join(__dirname, '..', binaryName);
  if (fs.existsSync(rootBin)) return { cmd: rootBin, args: [] };
  
  const localBin = path.join(__dirname, binaryName);
  if (fs.existsSync(localBin)) return { cmd: localBin, args: [] };

  const clientDirBin = path.join(__dirname, '..', 'go_client', binaryName);
  if (fs.existsSync(clientDirBin)) return { cmd: clientDirBin, args: [] };

  // Fallback to go run
  return { cmd: 'go', args: ['run', './go_client'] };
}

// Windows System Proxy Manager with WinINet immediate refresh
function setWindowsProxy(enable, socksAddr = '127.0.0.1:1080') {
  if (process.platform !== 'win32') return;
  const script = enable
    ? `$r = 'HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\Internet Settings'; Set-ItemProperty -Path $r -Name ProxyEnable -Value 1; Set-ItemProperty -Path $r -Name ProxyServer -Value 'socks=${socksAddr}'; try { Add-Type -TypeDefinition 'using System; using System.Runtime.InteropServices; public class WinINet { [DllImport(\"wininet.dll\")] public static extern bool InternetSetOption(IntPtr h, int o, IntPtr b, int l); }'; [WinINet]::InternetSetOption([IntPtr]::Zero, 39, [IntPtr]::Zero, 0); [WinINet]::InternetSetOption([IntPtr]::Zero, 37, [IntPtr]::Zero, 0); } catch {}`
    : `$r = 'HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\Internet Settings'; Set-ItemProperty -Path $r -Name ProxyEnable -Value 0; try { Add-Type -TypeDefinition 'using System; using System.Runtime.InteropServices; public class WinINet { [DllImport(\"wininet.dll\")] public static extern bool InternetSetOption(IntPtr h, int o, IntPtr b, int l); }'; [WinINet]::InternetSetOption([IntPtr]::Zero, 39, [IntPtr]::Zero, 0); [WinINet]::InternetSetOption([IntPtr]::Zero, 37, [IntPtr]::Zero, 0); } catch {}`;

  exec(`powershell -NoProfile -Command "${script}"`, (err) => {
    if (err) broadcastLog(`[WVF WD] Предупреждение системного прокси: ${err.message}`);
    else broadcastLog(`[WVF WD] Системный прокси Windows: ${enable ? 'ВКЛЮЧЕН (' + socksAddr + ')' : 'ОТКЛЮЧЕН'}`);
  });
}

// Linux System Proxy Manager
function setLinuxProxy(enable, socksAddr = '127.0.0.1:1080') {
  if (process.platform === 'win32' || process.platform === 'darwin') return;
  const host = socksAddr.split(':')[0] || '127.0.0.1';
  const port = socksAddr.split(':')[1] || '1080';

  if (enable) {
    exec(`gsettings set org.gnome.system.proxy mode 'manual'; gsettings set org.gnome.system.proxy.socks host '${host}'; gsettings set org.gnome.system.proxy.socks port ${port}`, () => {});
  } else {
    exec(`gsettings set org.gnome.system.proxy mode 'none'`, () => {});
  }
}

function setSystemProxy(enable, socksAddr) {
  if (process.platform === 'win32') setWindowsProxy(enable, socksAddr);
  else setLinuxProxy(enable, socksAddr);
  systemProxyEnabled = enable;
}

// Start Client
function startClient(config) {
  return new Promise((resolve, reject) => {
    if (clientProcess) {
      stopClient();
    }

    const { cmd, args } = getClientExecutable();
    const hashesStr = Array.isArray(config.hashes) ? config.hashes.join(',') : (config.hashes || '');
    const workers = config.workers || 9;
    let mode = config.mode || 'socks';
    const socksAddr = config.socksAddr || '127.0.0.1:1080';
    const obfs = config.obfs || 'audio';

    if (mode === 'rawtun' && process.platform === 'win32') {
      broadcastLog(`[WVF WD] Режим Raw-IP на Windows использует userspace SOCKS5 для туннелирования трафика.`);
      mode = 'socks';
    }

    const fullArgs = [
      ...args,
      '-peer', config.peer,
      '-password', config.password,
      '-vk', hashesStr,
      '-mode', mode,
      '-socks', socksAddr,
      '-n', String(workers),
      '-obfs', obfs
    ];

    broadcastLog(`[WVF WD] Запуск ядра QWDTT: ${cmd} ${fullArgs.join(' ')}`);

    try {
      const cwd = path.join(__dirname, '..');
      clientProcess = spawn(cmd, fullArgs, { cwd, env: process.env });

      clientProcess.stdout.on('data', (chunk) => {
        const text = chunk.toString();
        text.split('\n').forEach(line => {
          if (line.trim()) broadcastLog(line.trim());
        });
      });

      clientProcess.stderr.on('data', (chunk) => {
        const text = chunk.toString();
        text.split('\n').forEach(line => {
          if (line.trim()) broadcastLog(line.trim());
        });
      });

      clientProcess.on('error', (err) => {
        broadcastLog(`[WVF WD] Ошибка процесса: ${err.message}`);
        isConnected = false;
        broadcastEvent({ type: 'status', connected: false });
      });

      clientProcess.on('exit', (code, sig) => {
        broadcastLog(`[WVF WD] Ядро QWDTT завершило работу (код: ${code})`);
        if (systemProxyEnabled) setSystemProxy(false);
        isConnected = false;
        clientProcess = null;
        broadcastEvent({ type: 'status', connected: false });
      });

      isConnected = true;
      currentConfig = config;
      if (config.sysproxy) {
        setSystemProxy(true, socksAddr);
      }

      broadcastEvent({ type: 'status', connected: true });
      resolve({ ok: true });
    } catch (e) {
      reject(e);
    }
  });
}

function stopClient() {
  if (systemProxyEnabled) {
    setSystemProxy(false);
  }
  if (clientProcess) {
    try {
      if (process.platform === 'win32') {
        exec(`taskkill /pid ${clientProcess.pid} /T /F`);
      } else {
        clientProcess.kill('SIGTERM');
      }
    } catch (e) {}
    clientProcess = null;
  }
  isConnected = false;
  broadcastEvent({ type: 'status', connected: false });
}

// HTTP Server
const server = http.createServer((req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);

  // SSE Stream
  if (url.pathname === '/api/events') {
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*'
    });
    res.write('\n');
    sseClients.push(res);
    req.on('close', () => {
      sseClients = sseClients.filter(c => c !== res);
    });
    return;
  }

  // API Endpoints
  if (url.pathname === '/api/status') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      connected: isConnected,
      platform: process.platform,
      arch: process.arch,
      sysproxy: systemProxyEnabled
    }));
    return;
  }

  if (url.pathname === '/api/connect' && req.method === 'POST') {
    let body = '';
    req.on('data', c => body += c);
    req.on('end', async () => {
      try {
        const config = JSON.parse(body);
        await startClient(config);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: true }));
      } catch (err) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: false, error: err.message }));
      }
    });
    return;
  }

  if (url.pathname === '/api/disconnect' && req.method === 'POST') {
    stopClient();
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ ok: true }));
    return;
  }

  if (url.pathname === '/api/window/mode' && req.method === 'POST') {
    let body = '';
    req.on('data', c => body += c);
    req.on('end', () => {
      try {
        const { mode } = JSON.parse(body);
        if (typeof global.setWindowMode === 'function') {
          global.setWindowMode(mode);
        }
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: true }));
      } catch (err) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: false, error: err.message }));
      }
    });
    return;
  }

  if (url.pathname === '/api/ping' && req.method === 'POST') {
    let body = '';
    req.on('data', c => body += c);
    req.on('end', () => {
      try {
        const config = JSON.parse(body);
        const { cmd, args } = getClientExecutable();
        const hashesStr = Array.isArray(config.hashes) ? config.hashes.join(',') : (config.hashes || '');
        const pingArgs = [
          ...args,
          '-ping-only',
          '-peer', config.peer,
          '-password', config.password,
          '-vk', hashesStr
        ];

        const cwd = path.join(__dirname, '..');
        const p = spawn(cmd, pingArgs, { cwd });
        let pingOutput = '';
        p.stdout.on('data', d => pingOutput += d.toString());
        p.stderr.on('data', d => pingOutput += d.toString());
        p.on('close', (code) => {
          const match = pingOutput.match(/PING_RESULT\|(\d+)/);
          if (match) {
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ ok: true, rtt: parseInt(match[1], 10) }));
          } else {
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ ok: false, error: 'Ping failed: ' + pingOutput.slice(0, 100) }));
          }
        });
      } catch (e) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: false, error: e.message }));
      }
    });
    return;
  }

  if (url.pathname === '/api/test-ip') {
    const https = require('https');
    const reqIp = https.get('https://api.ipify.org?format=json', { timeout: 6000 }, (ipRes) => {
      let data = '';
      ipRes.on('data', chunk => data += chunk);
      ipRes.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ ok: true, ip: parsed.ip }));
        } catch (e) {
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ ok: true, ip: data.trim() }));
        }
      });
    });
    reqIp.on('error', (err) => {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ ok: false, error: 'Не удалось проверить IP: ' + err.message }));
    });
    return;
  }

  // Static Files
  let filePath = path.join(PUBLIC_DIR, url.pathname === '/' ? 'index.html' : url.pathname);
  const ext = path.extname(filePath).toLowerCase();
  const contentType = MIME_TYPES[ext] || 'application/octet-stream';

  fs.readFile(filePath, (err, content) => {
    if (err) {
      if (err.code === 'ENOENT') {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('404 Not Found');
      } else {
        res.writeHead(500, { 'Content-Type': 'text/plain' });
        res.end('Server Error: ' + err.code);
      }
    } else {
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content);
    }
  });
});

// Clean up on exit
process.on('SIGINT', () => {
  stopClient();
  process.exit();
});
process.on('SIGTERM', () => {
  stopClient();
  process.exit();
});

server.listen(PORT, '127.0.0.1', () => {
  const url = `http://127.0.0.1:${PORT}`;
  console.log(`\n======================================================`);
  console.log(`  ✦ WVF WD Desktop Client (QWDTT Multiplatform) ✦`);
  console.log(`  Веб-интерфейс запущен: ${url}`);
  console.log(`======================================================\n`);

  // Auto open browser on Windows/Linux only if not in Electron
  if (!process.versions.electron) {
    const startCmd = process.platform === 'win32' ? `start ${url}` : `xdg-open ${url}`;
    exec(startCmd, () => {});
  }
});
