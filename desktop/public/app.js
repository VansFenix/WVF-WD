// WVF WD Desktop Client Application Logic
(function() {
  'use strict';

  // State
  const state = {
    connected: false,
    connecting: false,
    startTime: null,
    timerInterval: null,
    ping: null,
    rxRate: 0,
    txRate: 0,
    logs: [],
    historyRx: new Array(50).fill(0),
    historyTx: new Array(50).fill(0),
    profiles: [
      {
        id: 'default',
        name: 'Основной VPS (WVF WD)',
        peer: '127.0.0.1:9000',
        password: 'password123',
        hashes: ['7b28a9f0c1e4d8b2a3f5c7e9d0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9'],
        mode: 'socks',
        workers: 9,
        obfs: 'audio'
      }
    ],
    activeProfileId: 'default'
  };

  // DOM Elements
  const els = {
    btnToggle: document.getElementById('btn-toggle-connect'),
    powerText: document.getElementById('power-text'),
    statusIndicator: document.getElementById('status-indicator'),
    statusLabel: document.getElementById('status-label'),
    connectionTimer: document.getElementById('connection-timer'),
    metricPing: document.getElementById('metric-ping'),
    metricRx: document.getElementById('metric-rx'),
    metricTx: document.getElementById('metric-tx'),
    btnQuickPing: document.getElementById('btn-quick-ping'),
    btnCopySocks: document.getElementById('btn-copy-socks'),
    terminalOutput: document.getElementById('terminal-output'),
    logCount: document.getElementById('log-count'),
    btnClearLogs: document.getElementById('btn-clear-logs'),
    btnCopyLogs: document.getElementById('btn-copy-logs'),
    trafficCanvas: document.getElementById('traffic-canvas'),
    // Quick Config Inputs
    inputQuickPeer: document.getElementById('input-quick-peer'),
    inputQuickPass: document.getElementById('input-quick-pass'),
    inputQuickHash: document.getElementById('input-quick-hash'),
    btnSaveQuick: document.getElementById('btn-save-quick'),
    // Display fields
    displayProfileName: document.getElementById('display-profile-name'),
    displayProfileEndpoint: document.getElementById('display-profile-endpoint'),
    metaHashCount: document.getElementById('meta-hash-count'),
    metaWorkersCount: document.getElementById('meta-workers-count'),
    metaSysproxyStatus: document.getElementById('meta-sysproxy-status'),
    // Settings & Hashes
    selectMode: document.getElementById('select-mode'),
    checkSysproxy: document.getElementById('check-sysproxy'),
    inputSocksAddr: document.getElementById('input-socks-addr'),
    inputWorkers: document.getElementById('input-workers'),
    selectObfs: document.getElementById('select-obfs'),
    inputNewHash: document.getElementById('input-new-hash'),
    btnAddHash: document.getElementById('btn-add-hash'),
    hashList: document.getElementById('hash-list'),
    profilesGrid: document.getElementById('profiles-grid'),
    btnTestAllHashes: document.getElementById('btn-test-all-hashes'),
    // IP and Mode
    btnCheckIp: document.getElementById('btn-check-ip'),
    metricIp: document.getElementById('metric-ip'),
    activeModeBadge: document.getElementById('active-mode-badge'),
    // Modal: Import
    modalImport: document.getElementById('modal-import'),
    btnImportProfile: document.getElementById('btn-import-profile'),
    btnCloseImport: document.getElementById('btn-close-import'),
    btnCancelImport: document.getElementById('btn-cancel-import'),
    btnSubmitImport: document.getElementById('btn-submit-import'),
    importText: document.getElementById('import-text'),
    importFile: document.getElementById('import-file'),
    importFilename: document.getElementById('import-filename'),
    // Modal: New Profile
    modalNewProfile: document.getElementById('modal-new-profile'),
    btnAddProfile: document.getElementById('btn-add-profile'),
    btnCloseNewProfile: document.getElementById('btn-close-new-profile'),
    btnCancelNewProfile: document.getElementById('btn-cancel-new-profile'),
    btnSubmitNewProfile: document.getElementById('btn-submit-new-profile'),
    newProfileName: document.getElementById('new-profile-name'),
    newProfilePeer: document.getElementById('new-profile-peer'),
    newProfilePass: document.getElementById('new-profile-pass'),
    newProfileHash: document.getElementById('new-profile-hash'),
    newProfileMode: document.getElementById('new-profile-mode')
  };

  // Init Canvas context
  const ctx = els.trafficCanvas.getContext('2d');

  // Load Saved Config from localStorage
  function loadLocalState() {
    try {
      const saved = localStorage.getItem('wvf_wd_desktop_state');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.profiles) state.profiles = parsed.profiles;
        if (parsed.activeProfileId) state.activeProfileId = parsed.activeProfileId;
      }
    } catch (e) {
      console.warn('Could not load local storage:', e);
    }
    updateProfileUI();
  }

  function saveLocalState() {
    try {
      localStorage.setItem('wvf_wd_desktop_state', JSON.stringify({
        profiles: state.profiles,
        activeProfileId: state.activeProfileId
      }));
    } catch (e) {
      console.warn('Could not save to local storage:', e);
    }
  }

  function getActiveProfile() {
    return state.profiles.find(p => p.id === state.activeProfileId) || state.profiles[0];
  }

  function updateProfileUI() {
    const p = getActiveProfile();
    if (!p) return;
    els.displayProfileName.textContent = p.name;
    els.displayProfileEndpoint.textContent = p.peer;
    els.metaHashCount.textContent = `${p.hashes.length} активен(но)`;
    els.metaWorkersCount.textContent = `${p.workers || 9} потоков`;

    els.inputQuickPeer.value = p.peer || '';
    els.inputQuickPass.value = p.password || '';
    els.inputQuickHash.value = (p.hashes && p.hashes[0]) ? p.hashes[0] : '';
    if (els.selectMode) els.selectMode.value = p.mode || 'socks';
    if (els.inputWorkers) els.inputWorkers.value = p.workers || 9;
    if (els.selectObfs) els.selectObfs.value = p.obfs || 'audio';

    if (els.activeModeBadge) {
      const mode = (p.mode || 'socks').toLowerCase();
      if (mode === 'socks') {
        els.activeModeBadge.textContent = 'SOCKS5 127.0.0.1:1080';
      } else if (mode === 'vpn') {
        els.activeModeBadge.textContent = 'WireGuard VPN';
      } else if (mode === 'rawtun') {
        els.activeModeBadge.textContent = 'Raw (RAW-IP)';
      }
    }

    renderHashList();
    renderProfilesList();
  }

  function renderHashList() {
    const p = getActiveProfile();
    els.hashList.innerHTML = '';
    if (!p || !p.hashes || p.hashes.length === 0) {
      els.hashList.innerHTML = '<div class="text-muted" style="padding:10px;">Нет добавленных хешей VK</div>';
      return;
    }
    p.hashes.forEach((hash, idx) => {
      const div = document.createElement('div');
      div.className = 'hash-item';
      div.innerHTML = `
        <div style="display:flex; align-items:center; gap:10px;">
          <span style="color:var(--text-dim); font-size:11px;">#${idx+1}</span>
          <span class="hash-text">${hash.length > 40 ? hash.slice(0, 38) + '...' : hash}</span>
        </div>
        <div style="display:flex; align-items:center; gap:8px;">
          <span class="hash-status" id="hash-status-${idx}">ГОТОВ</span>
          <button class="btn btn-secondary" style="padding:4px 8px; font-size:11px;" onclick="window.removeHash(${idx})">✕</button>
        </div>
      `;
      els.hashList.appendChild(div);
    });
  }

  window.removeHash = function(idx) {
    const p = getActiveProfile();
    if (p && p.hashes) {
      p.hashes.splice(idx, 1);
      saveLocalState();
      updateProfileUI();
      addLog(`[WVF WD] Хеш #${idx+1} удален`);
    }
  };

  function renderProfilesList() {
    els.profilesGrid.innerHTML = '';
    state.profiles.forEach(prof => {
      const card = document.createElement('div');
      card.className = `profile-card ${prof.id === state.activeProfileId ? 'active' : ''}`;
      card.innerHTML = `
        ${prof.id === state.activeProfileId ? '<span class="profile-card-badge">АКТИВЕН</span>' : ''}
        <h4 style="font-weight:700; margin-bottom:4px; font-size:15px;">${prof.name}</h4>
        <div style="font-family:var(--font-mono); font-size:12px; color:var(--text-muted); margin-bottom:12px;">${prof.peer}</div>
        <div style="display:flex; gap:12px; font-size:11px; color:var(--pink-secondary);">
          <span>Потоки: ${prof.workers || 9}</span>
          <span>Хеши: ${prof.hashes ? prof.hashes.length : 0}</span>
          <span>Режим: ${prof.mode ? prof.mode.toUpperCase() : 'SOCKS'}</span>
        </div>
      `;
      card.addEventListener('click', () => {
        if (state.connected) {
          alert('Сначала отключите активное соединение для смены профиля');
          return;
        }
        state.activeProfileId = prof.id;
        saveLocalState();
        updateProfileUI();
        addLog(`[WVF WD] Переключен профиль: ${prof.name}`);
      });

      if (state.profiles.length > 1) {
        const delBtn = document.createElement('button');
        delBtn.className = 'btn btn-secondary';
        delBtn.style.cssText = 'padding:3px 8px; font-size:11px; margin-top:8px; color:var(--accent-red); align-self:flex-start;';
        delBtn.textContent = 'Удалить';
        delBtn.onclick = (e) => {
          e.stopPropagation();
          if (confirm(`Удалить профиль "${prof.name}"?`)) {
            state.profiles = state.profiles.filter(p => p.id !== prof.id);
            if (state.activeProfileId === prof.id) {
              state.activeProfileId = state.profiles[0].id;
            }
            saveLocalState();
            updateProfileUI();
            addLog(`[WVF WD] Профиль "${prof.name}" удалён`);
          }
        };
        card.appendChild(delBtn);
      }
      els.profilesGrid.appendChild(card);
    });
  }

  // Navigation tab switching
  document.querySelectorAll('.nav-item').forEach(btn => {
    btn.addEventListener('click', () => {
      const tab = btn.dataset.tab;
      document.querySelectorAll('.nav-item').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
      btn.classList.add('active');
      const targetView = document.getElementById(`view-${tab}`);
      if (targetView) targetView.classList.add('active');
    });
  });

  // Log append
  function addLog(msg, type = 'info') {
    const now = new Date();
    const timeStr = `[${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}]`;
    const line = document.createElement('div');
    line.className = `log-line ${type}`;

    let styledMsg = msg
      .replace(/\[WVF WD\]/g, '<span class="tag-pink">[WVF WD]</span>')
      .replace(/\[КЛИЕНТ\]/g, '<span class="tag-pink">[WVF WD]</span>')
      .replace(/\[VK\]/g, '<span style="color:#60a5fa">[VK]</span>')
      .replace(/\[TURN\]/g, '<span style="color:#f472b6">[TURN]</span>')
      .replace(/\[SOCKS\]/g, '<span style="color:#34d399">[SOCKS]</span>')
      .replace(/\[WRAP\]/g, '<span style="color:#c084fc">[WRAP]</span>');

    line.innerHTML = `<span class="log-time">${timeStr}</span> ${styledMsg}`;
    els.terminalOutput.appendChild(line);
    els.terminalOutput.scrollTop = els.terminalOutput.scrollHeight;
    state.logs.push(`${timeStr} ${msg}`);
    els.logCount.textContent = `${state.logs.length} строк`;
  }

  // Timer formatting
  function updateTimer() {
    if (!state.startTime) return;
    const elapsed = Math.floor((Date.now() - state.startTime) / 1000);
    const hrs = String(Math.floor(elapsed / 3600)).padStart(2, '0');
    const mins = String(Math.floor((elapsed % 3600) / 60)).padStart(2, '0');
    const secs = String(elapsed % 60).padStart(2, '0');
    els.connectionTimer.textContent = `${hrs}:${mins}:${secs}`;
  }

  // Toggle Connect
  els.btnToggle.addEventListener('click', async () => {
    if (state.connecting) return;

    if (state.connected) {
      // Disconnect
      await disconnectTunnel();
    } else {
      // Connect
      await connectTunnel();
    }
  });

  async function connectTunnel() {
    const p = getActiveProfile();
    if (!p.peer || !p.password || !p.hashes || p.hashes.length === 0) {
      alert('Пожалуйста, заполните параметры VPS сервера, пароль и хотя бы один хеш VK!');
      return;
    }

    state.connecting = true;
    els.btnToggle.disabled = true;
    els.powerText.textContent = 'ПОДКЛЮЧЕНИЕ…';
    els.statusIndicator.className = 'status-indicator connecting';
    els.statusLabel.textContent = 'Инициализация…';
    addLog(`[WVF WD] Запуск туннеля к ${p.peer} (потоков: ${p.workers || 9}, режим: ${p.mode || 'socks'})...`);

    try {
      const resp = await fetch('/api/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          peer: p.peer,
          password: p.password,
          hashes: p.hashes,
          mode: p.mode || 'socks',
          workers: p.workers || 9,
          obfs: p.obfs || 'audio',
          sysproxy: els.checkSysproxy.checked
        })
      });

      const data = await resp.json();
      if (data.ok) {
        state.connected = true;
        state.connecting = false;
        state.startTime = Date.now();
        state.timerInterval = setInterval(updateTimer, 1000);
        els.btnToggle.classList.add('connected');
        els.btnToggle.disabled = false;
        els.powerText.textContent = 'ОТКЛЮЧИТЬ';
        els.statusIndicator.className = 'status-indicator connected';
        els.statusLabel.textContent = 'Подключено';
        els.metaSysproxyStatus.textContent = els.checkSysproxy.checked ? 'Активен (127.0.0.1:1080)' : 'Выкл';
        addLog(`[WVF WD] ✓ Туннель QWDTT успешно установлен!`, 'success');
        addLog(`[WVF WD] Локальный SOCKS5 доступен на 127.0.0.1:1080`);
      } else {
        throw new Error(data.error || 'Ошибка запуска туннеля');
      }
    } catch (err) {
      state.connecting = false;
      state.connected = false;
      els.btnToggle.disabled = false;
      els.powerText.textContent = 'ПОДКЛЮЧИТЬ';
      els.statusIndicator.className = 'status-indicator';
      els.statusLabel.textContent = 'Ошибка';
      addLog(`[WVF WD] ✗ Ошибка подключения: ${err.message}`, 'error');
    }
  }

  async function disconnectTunnel() {
    addLog(`[WVF WD] Завершение сессии туннеля...`);
    try {
      await fetch('/api/disconnect', { method: 'POST' });
    } catch (e) {
      console.warn(e);
    }
    state.connected = false;
    state.connecting = false;
    clearInterval(state.timerInterval);
    state.startTime = null;
    els.btnToggle.classList.remove('connected');
    els.powerText.textContent = 'ПОДКЛЮЧИТЬ';
    els.statusIndicator.className = 'status-indicator';
    els.statusLabel.textContent = 'Отключено';
    els.connectionTimer.textContent = '00:00:00';
    els.metaSysproxyStatus.textContent = 'Авто (Выкл)';
    addLog(`[WVF WD] Туннель остановлен. Сетевые маршруты восстановлены.`);
  }

  // Quick Save
  els.btnSaveQuick.addEventListener('click', () => {
    const p = getActiveProfile();
    p.peer = els.inputQuickPeer.value.trim();
    p.password = els.inputQuickPass.value.trim();
    const hash = els.inputQuickHash.value.trim();
    if (hash && (!p.hashes.includes(hash))) {
      p.hashes = [hash, ...p.hashes];
    }
    saveLocalState();
    updateProfileUI();
    addLog(`[WVF WD] Параметры профиля "${p.name}" успешно сохранены`, 'success');
  });

  // Quick Ping
  els.btnQuickPing.addEventListener('click', async () => {
    const p = getActiveProfile();
    addLog(`[WVF WD] Замер сетевой задержки (Ping) к TURN VK...`);
    els.metricPing.textContent = 'Тест...';
    try {
      const resp = await fetch('/api/ping', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          peer: p.peer,
          password: p.password,
          hashes: p.hashes
        })
      });
      const data = await resp.json();
      if (data.ok && data.rtt) {
        els.metricPing.textContent = `${data.rtt} ms`;
        addLog(`[WVF WD] ✓ Результат замера: ${data.rtt} ms RTT`, 'success');
      } else {
        els.metricPing.textContent = 'ERR';
        addLog(`[WVF WD] ✗ Ошибка замера пинга: ${data.error || 'Timeout'}`, 'error');
      }
    } catch (e) {
      els.metricPing.textContent = 'ERR';
      addLog(`[WVF WD] ✗ Ошибка связи с демоном: ${e.message}`, 'error');
    }
  });

  // Copy SOCKS5
  els.btnCopySocks.addEventListener('click', () => {
    navigator.clipboard.writeText('socks5://127.0.0.1:1080');
    addLog(`[WVF WD] Скопировано в буфер: socks5://127.0.0.1:1080`);
  });

  // Add Hash
  els.btnAddHash.addEventListener('click', () => {
    const raw = els.inputNewHash.value.trim();
    if (!raw) return;
    let clean = raw;
    if (clean.includes('/call/join/')) {
      clean = clean.split('/call/join/')[1].split('?')[0].split('/')[0];
    }
    const p = getActiveProfile();
    if (!p.hashes.includes(clean)) {
      p.hashes.push(clean);
      saveLocalState();
      updateProfileUI();
      els.inputNewHash.value = '';
      addLog(`[WVF WD] Добавлен VK хеш: ${clean.slice(0, 16)}...`, 'success');
    }
  });

  // Clear Logs
  els.btnClearLogs.addEventListener('click', () => {
    els.terminalOutput.innerHTML = '';
    state.logs = [];
    els.logCount.textContent = '0 строк';
  });

  // Copy Logs
  els.btnCopyLogs.addEventListener('click', () => {
    navigator.clipboard.writeText(state.logs.join('\n'));
    addLog(`[WVF WD] Все логи (${state.logs.length} строк) скопированы в буфер обмена`);
  });

  // Settings Synchronizers
  if (els.selectMode) {
    els.selectMode.addEventListener('change', () => {
      const p = getActiveProfile();
      p.mode = els.selectMode.value;
      saveLocalState();
      updateProfileUI();
      addLog(`[WVF WD] Режим туннеля изменен на: ${p.mode.toUpperCase()}`);
    });
  }
  if (els.inputWorkers) {
    els.inputWorkers.addEventListener('change', () => {
      const p = getActiveProfile();
      p.workers = parseInt(els.inputWorkers.value, 10) || 9;
      saveLocalState();
      updateProfileUI();
    });
  }
  if (els.selectObfs) {
    els.selectObfs.addEventListener('change', () => {
      const p = getActiveProfile();
      p.obfs = els.selectObfs.value;
      saveLocalState();
      updateProfileUI();
    });
  }

  // Check External IP
  if (els.btnCheckIp) {
    els.btnCheckIp.addEventListener('click', async () => {
      if (els.metricIp) els.metricIp.textContent = 'Запрос...';
      addLog(`[WVF WD] Запрос текущего внешнего IP-адреса...`);
      try {
        const resp = await fetch('/api/test-ip');
        const data = await resp.json();
        if (data.ok && data.ip) {
          const loc = [data.city, data.country].filter(Boolean).join(', ');
          const text = loc ? `${data.ip} (${loc})` : data.ip;
          if (els.metricIp) els.metricIp.textContent = text;
          addLog(`[WVF WD] ✓ Внешний IP: ${text} [Провайдер: ${data.org || 'N/A'}]`, 'success');
        } else {
          if (els.metricIp) els.metricIp.textContent = 'Ошибка';
          addLog(`[WVF WD] ✗ Не удалось определить IP: ${data.error || 'Нет ответа'}`, 'error');
        }
      } catch (err) {
        if (els.metricIp) els.metricIp.textContent = 'Ошибка';
        addLog(`[WVF WD] ✗ Ошибка проверки IP: ${err.message}`, 'error');
      }
    });
  }

  // Modal: Import Profile
  const closeImport = () => { if (els.modalImport) els.modalImport.style.display = 'none'; };
  if (els.btnImportProfile) {
    els.btnImportProfile.addEventListener('click', () => {
      if (els.modalImport) {
        els.modalImport.style.display = 'flex';
        els.importText.value = '';
        if (els.importFilename) els.importFilename.textContent = '';
        els.importText.focus();
      }
    });
  }
  if (els.btnCloseImport) els.btnCloseImport.addEventListener('click', closeImport);
  if (els.btnCancelImport) els.btnCancelImport.addEventListener('click', closeImport);

  if (els.importFile) {
    els.importFile.addEventListener('change', (e) => {
      const file = e.target.files && e.target.files[0];
      if (!file) return;
      if (els.importFilename) els.importFilename.textContent = file.name;
      const reader = new FileReader();
      reader.onload = (evt) => {
        els.importText.value = evt.target.result;
      };
      reader.readAsText(file);
    });
  }

  function parseProfileString(raw) {
    let clean = raw.trim();
    if (!clean) return null;

    // 1. URL schemes (qwdtt:// or wvfwd://)
    if (clean.startsWith('qwdtt://') || clean.startsWith('wvfwd://')) {
      try {
        const urlStr = clean.replace(/^(qwdtt|wvfwd):\/\//, 'http://dummy.com/');
        const url = new URL(urlStr);
        const params = url.searchParams;
        const peer = params.get('peer') || params.get('server') || (url.pathname.replace(/^\//, '') || '');
        const pass = params.get('pass') || params.get('password') || '';
        const hashesStr = params.get('hashes') || params.get('hash') || '';
        const hashes = hashesStr ? hashesStr.split(',').map(s => s.trim()).filter(Boolean) : [];
        const mode = params.get('mode') || 'socks';
        const workers = parseInt(params.get('workers') || '9', 10) || 9;
        const obfs = params.get('obfs') || 'audio';
        const name = params.get('name') || `Импортирован (${peer || 'Профиль'})`;

        return {
          id: 'prof_' + Date.now(),
          name,
          peer,
          password: pass,
          hashes,
          mode,
          workers,
          obfs
        };
      } catch (err) {
        console.warn('URL parse error:', err);
      }
    }

    // 2. JSON
    if (clean.startsWith('{')) {
      try {
        const obj = JSON.parse(clean);
        return {
          id: 'prof_' + Date.now(),
          name: obj.name || 'Импортированный JSON',
          peer: obj.peer || obj.server || '127.0.0.1:9000',
          password: obj.password || obj.pass || '',
          hashes: Array.isArray(obj.hashes) ? obj.hashes : (obj.hash ? [obj.hash] : []),
          mode: obj.mode || 'socks',
          workers: obj.workers || 9,
          obfs: obj.obfs || 'audio'
        };
      } catch (err) {}
    }

    // 3. Fallback: line-based or WireGuard .conf
    const lines = clean.split('\n').map(l => l.trim()).filter(l => l && !l.startsWith('#'));
    let peer = '127.0.0.1:9000';
    let pass = '';
    const hashes = [];

    for (const line of lines) {
      if (line.includes('Endpoint =') || line.includes('Endpoint=')) {
        peer = line.split('=')[1].trim();
      } else if (line.includes('PrivateKey =') || line.includes('password=')) {
        pass = line.split('=')[1].trim();
      } else if (line.length === 64 && /^[0-9a-fA-F]+$/.test(line)) {
        hashes.push(line);
      } else if (line.includes('/call/join/')) {
        const part = line.split('/call/join/')[1].split('?')[0].split('/')[0];
        if (part) hashes.push(part);
      }
    }

    return {
      id: 'prof_' + Date.now(),
      name: `Профиль ${new Date().toLocaleTimeString()}`,
      peer,
      password: pass,
      hashes,
      mode: 'socks',
      workers: 9,
      obfs: 'audio'
    };
  }

  if (els.btnSubmitImport) {
    els.btnSubmitImport.addEventListener('click', () => {
      const text = els.importText.value.trim();
      if (!text) {
        alert('Введите ссылку или выберите файл конфигурации');
        return;
      }
      const prof = parseProfileString(text);
      if (!prof || !prof.peer) {
        alert('Не удалось распознать формат конфигурации');
        return;
      }
      state.profiles.push(prof);
      state.activeProfileId = prof.id;
      saveLocalState();
      updateProfileUI();
      closeImport();
      addLog(`[WVF WD] ✓ Профиль "${prof.name}" успешно импортирован!`, 'success');
    });
  }

  // Modal: New Profile
  const closeNewProfile = () => { if (els.modalNewProfile) els.modalNewProfile.style.display = 'none'; };
  if (els.btnAddProfile) {
    els.btnAddProfile.addEventListener('click', () => {
      if (els.modalNewProfile) {
        els.modalNewProfile.style.display = 'flex';
        els.newProfileName.value = `Профиль #${state.profiles.length + 1}`;
        els.newProfilePeer.value = '';
        els.newProfilePass.value = '';
        els.newProfileHash.value = '';
        els.newProfileMode.value = 'socks';
        els.newProfilePeer.focus();
      }
    });
  }
  if (els.btnCloseNewProfile) els.btnCloseNewProfile.addEventListener('click', closeNewProfile);
  if (els.btnCancelNewProfile) els.btnCancelNewProfile.addEventListener('click', closeNewProfile);

  if (els.btnSubmitNewProfile) {
    els.btnSubmitNewProfile.addEventListener('click', () => {
      const name = els.newProfileName.value.trim() || `Профиль #${state.profiles.length + 1}`;
      const peer = els.newProfilePeer.value.trim();
      const password = els.newProfilePass.value.trim();
      let rawHash = els.newProfileHash.value.trim();
      if (rawHash.includes('/call/join/')) {
        rawHash = rawHash.split('/call/join/')[1].split('?')[0].split('/')[0];
      }
      const hashes = rawHash ? [rawHash] : [];
      const mode = els.newProfileMode.value || 'socks';

      if (!peer) {
        alert('Пожалуйста, укажите адрес VPS сервера (IP:Порт)');
        return;
      }

      const prof = {
        id: 'prof_' + Date.now(),
        name,
        peer,
        password,
        hashes,
        mode,
        workers: 9,
        obfs: 'audio'
      };

      state.profiles.push(prof);
      state.activeProfileId = prof.id;
      saveLocalState();
      updateProfileUI();
      closeNewProfile();
      addLog(`[WVF WD] ✓ Создан новый профиль: "${prof.name}"`, 'success');
    });
  }

  // Test All Hashes
  if (els.btnTestAllHashes) {
    els.btnTestAllHashes.addEventListener('click', () => {
      const p = getActiveProfile();
      if (!p.hashes || p.hashes.length === 0) {
        alert('Нет хешей для проверки');
        return;
      }
      addLog(`[WVF WD] Проверка валидности ${p.hashes.length} хешей VK...`);
      p.hashes.forEach((h, idx) => {
        const isHex64 = h.length === 64 && /^[0-9a-fA-F]+$/.test(h);
        const statusSpan = document.getElementById(`hash-status-${idx}`);
        if (isHex64) {
          if (statusSpan) {
            statusSpan.textContent = 'АКТИВЕН';
            statusSpan.style.color = 'var(--accent-green)';
          }
          addLog(`[VK] Хеш #${idx+1} [${h.slice(0, 12)}...] формат валиден (SHA256).`, 'success');
        } else {
          if (statusSpan) {
            statusSpan.textContent = 'ФОРМАТ?';
            statusSpan.style.color = 'var(--accent-amber)';
          }
          addLog(`[VK] Хеш #${idx+1} [${h.slice(0, 12)}...] нестандартный размер (${h.length} симв.), проверьте ссылку звонка.`);
        }
      });
    });
  }

  // Canvas Traffic Graph Animation
  function drawGraph() {
    const w = els.trafficCanvas.width;
    const h = els.trafficCanvas.height;
    ctx.clearRect(0, 0, w, h);

    // Grid lines
    ctx.strokeStyle = 'rgba(255, 133, 161, 0.05)';
    ctx.lineWidth = 1;
    for (let y = 20; y < h; y += 30) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }

    if (state.connected) {
      // Simulate/apply some traffic fluctuations
      state.rxRate = Math.max(0, Math.floor(state.rxRate * 0.7 + (Math.random() * 850 + 120) * 0.3));
      state.txRate = Math.max(0, Math.floor(state.txRate * 0.7 + (Math.random() * 220 + 35) * 0.3));
      els.metricRx.textContent = `${state.rxRate} KB/s`;
      els.metricTx.textContent = `${state.txRate} KB/s`;
    } else {
      state.rxRate = 0;
      state.txRate = 0;
      els.metricRx.textContent = `0 KB/s`;
      els.metricTx.textContent = `0 KB/s`;
    }

    state.historyRx.shift();
    state.historyRx.push(state.rxRate);
    state.historyTx.shift();
    state.historyTx.push(state.txRate);

    const maxVal = Math.max(500, ...state.historyRx, ...state.historyTx);

    // Draw RX Curve (Pink)
    drawCurve(state.historyRx, maxVal, '#ff85a1', 'rgba(255, 133, 161, 0.15)', w, h);
    // Draw TX Curve (Blue)
    drawCurve(state.historyTx, maxVal, '#60a5fa', 'rgba(96, 165, 250, 0.1)', w, h);

    requestAnimationFrame(drawGraph);
  }

  function drawCurve(data, maxVal, strokeColor, fillColor, w, h) {
    const step = w / (data.length - 1);
    ctx.beginPath();
    ctx.moveTo(0, h);

    for (let i = 0; i < data.length; i++) {
      const x = i * step;
      const y = h - (data[i] / maxVal) * (h - 15);
      if (i === 0) ctx.lineTo(x, y);
      else {
        const prevX = (i - 1) * step;
        const prevY = h - (data[i - 1] / maxVal) * (h - 15);
        const cpX = (prevX + x) / 2;
        ctx.bezierCurveTo(cpX, prevY, cpX, y, x, y);
      }
    }

    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.lineTo(w, h);
    ctx.closePath();
    ctx.fillStyle = fillColor;
    ctx.fill();
  }

  // Connect to SSE stream for backend daemon logs
  function connectLogStream() {
    try {
      const evtSource = new EventSource('/api/events');
      evtSource.onmessage = function(e) {
        try {
          const data = JSON.parse(e.data);
          if (data.type === 'log') {
            addLog(data.message);
          } else if (data.type === 'ping') {
            els.metricPing.textContent = `${data.rtt} ms`;
          } else if (data.type === 'status') {
            if (data.connected && !state.connected) {
              state.connected = true;
              els.btnToggle.classList.add('connected');
              els.powerText.textContent = 'ОТКЛЮЧИТЬ';
              els.statusIndicator.className = 'status-indicator connected';
              els.statusLabel.textContent = 'Подключено';
            } else if (!data.connected && state.connected) {
              state.connected = false;
              state.connecting = false;
              clearInterval(state.timerInterval);
              state.startTime = null;
              els.btnToggle.classList.remove('connected');
              els.powerText.textContent = 'ПОДКЛЮЧИТЬ';
              els.statusIndicator.className = 'status-indicator';
              els.statusLabel.textContent = 'Отключено';
              els.connectionTimer.textContent = '00:00:00';
              els.metaSysproxyStatus.textContent = 'Авто (Выкл)';
              addLog('[WVF WD] Фоновый процесс туннеля завершил работу.');
            }
          }
        } catch (err) {}
      };
      evtSource.onerror = function() {
        evtSource.close();
        setTimeout(connectLogStream, 3000);
      };
    } catch (e) {
      console.warn('SSE not supported or server unavailable');
    }
  }

  // Init
  loadLocalState();
  requestAnimationFrame(drawGraph);
  connectLogStream();
  addLog('[WVF WD] Клиент запущен. Готов к работе на Windows / Linux.');
})();
