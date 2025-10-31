(function() {
  const tokensEl = document.getElementById('tokens');
  const aliasesEl = document.getElementById('aliases');
  const refreshBtn = document.getElementById('refresh');
  const toggleBtn = document.getElementById('toggle');
  const statusEl = document.getElementById('status');
  const addBtn = document.getElementById('add');
  const nameInput = document.getElementById('new-name');
  const valueInput = document.getElementById('new-value');

  async function getDesignMode() {
    const res = await chrome.devtools.inspectedWindow.eval('window.uiCopilot && window.uiCopilot.designSystemMode');
    return !!(res && res[0]);
  }

  async function setToggleLabel() {
    const on = await getDesignMode();
    toggleBtn.textContent = on ? 'Design System: On' : 'Design System: Off';
  }

  async function refreshTokens() {
    try {
      const result = await chrome.devtools.inspectedWindow.eval('window.uiCopilot && window.uiCopilot.refreshDesignTokens()');
      const tokens = (result && result[0]) || {};
      renderTokens(tokens);
      statusEl.textContent = `Found ${Object.keys(tokens).length} tokens`;
      await setToggleLabel();
      await refreshAliases();
    } catch (e) {
      statusEl.textContent = 'Failed to read tokens';
      tokensEl.innerHTML = '';
    }
  }

  function renderTokens(tokens) {
    const entries = Object.entries(tokens);
    if (!entries.length) {
      tokensEl.innerHTML = '<div class="muted">No CSS variables detected on :root</div>';
      return;
    }
    tokensEl.innerHTML = entries.map(([name, value], i) => `
      <div class="row">
        <input id="name-${i}" value="${name}" disabled />
        <input id="value-${i}" value="${value}" />
        <button class="primary" onclick="window.__applyToken(${i})">Apply</button>
      </div>
    `).join('');
    window.__applyToken = async (i) => {
      const n = document.getElementById(`name-${i}`).value;
      const v = document.getElementById(`value-${i}`).value;
      await applyToken(n, v);
    };
  }

  async function applyToken(name, value) {
    try {
      await chrome.devtools.inspectedWindow.eval(`window.uiCopilot && window.uiCopilot.setDesignToken(${JSON.stringify(name)}, ${JSON.stringify(value)})`);
      statusEl.textContent = `Set ${name} = ${value}`;
    } catch (e) {
      statusEl.textContent = `Failed to set ${name}`;
    }
  }

  refreshBtn.onclick = refreshTokens;
  toggleBtn.onclick = async () => {
    try {
      await chrome.devtools.inspectedWindow.eval('window.uiCopilot && window.uiCopilot.toggleDesignSystemMode()');
      await setToggleLabel();
    } catch (e) {}
  };
  addBtn.onclick = async () => {
    const n = nameInput.value.trim();
    const v = valueInput.value.trim();
    if (!n || !v) return;
    await applyToken(n, v);
    await refreshTokens();
    nameInput.value = '';
    valueInput.value = '';
  };

  // init
  refreshTokens();

  // === Aliases ===
  async function refreshAliases() {
    try {
      const res = await chrome.devtools.inspectedWindow.eval('window.uiCopilot && window.uiCopilot.listTokenAliases()');
      const aliases = (res && res[0]) || {};
      renderAliases(aliases);
    } catch (e) {
      aliasesEl.innerHTML = '<div class="muted">No aliases</div>';
    }
  }

  function renderAliases(aliases) {
    const entries = Object.entries(aliases);
    if (!entries.length) {
      aliasesEl.innerHTML = '<div class="muted">No aliases set</div>';
      return;
    }
    aliasesEl.innerHTML = entries.map(([k, v], i) => `
      <div class="row">
        <input id="alias-k-${i}" value="${k}" disabled />
        <input id="alias-v-${i}" value="${v}" />
        <button class="primary" onclick="window.__applyAlias(${i})">Apply</button>
      </div>
    `).join('');
    window.__applyAlias = async (i) => {
      const k = document.getElementById(`alias-k-${i}`).value;
      const v = document.getElementById(`alias-v-${i}`).value;
      await setAlias(k, v);
    };
  }

  const aliasNameInput = document.getElementById('alias-name');
  const aliasVarInput = document.getElementById('alias-var');
  const aliasSetBtn = document.getElementById('alias-set');

  async function setAlias(name, varName) {
    try {
      await chrome.devtools.inspectedWindow.eval(`window.uiCopilot && window.uiCopilot.setTokenAlias(${JSON.stringify(name)}, ${JSON.stringify(varName)})`);
      await refreshAliases();
      statusEl.textContent = `Alias set: ${name} -> ${varName}`;
    } catch (e) {}
  }

  aliasSetBtn.onclick = async () => {
    const n = aliasNameInput.value.trim();
    const v = aliasVarInput.value.trim();
    if (!n || !v) return;
    await setAlias(n, v);
    aliasNameInput.value = '';
    aliasVarInput.value = '';
  };
})();


