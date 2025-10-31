document.addEventListener('DOMContentLoaded', async () => {
  const scanBtn = document.getElementById('scan-btn');
  const settingsBtn = document.getElementById('settings-btn');
  const issuesCount = document.getElementById('issues-count');
  const fixedCount = document.getElementById('fixed-count');
  const aiStatus = document.getElementById('ai-status');

  // Check AI availability
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    const result = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: () => 'ai' in window && 'languageModel' in window.ai
    });
    aiStatus.textContent = result[0].result ? 'Available' : 'Fallback Mode';
  } catch (e) {
    aiStatus.textContent = 'Unavailable';
  }

  // Load stats
  const stats = await chrome.storage.local.get(['issuesFound', 'issuesFixed']);
  issuesCount.textContent = stats.issuesFound || 0;
  fixedCount.textContent = stats.issuesFixed || 0;

  scanBtn.onclick = async () => {
    scanBtn.textContent = 'Scanning...';
    scanBtn.disabled = true;
    
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: () => window.uiCopilot?.scanPage()
      });
      
      setTimeout(() => {
        scanBtn.textContent = 'Scan Page';
        scanBtn.disabled = false;
      }, 2000);
    } catch (e) {
      scanBtn.textContent = 'Error';
      setTimeout(() => {
        scanBtn.textContent = 'Scan Page';
        scanBtn.disabled = false;
      }, 2000);
    }
  };
  settingsBtn.onclick = () => {
    chrome.tabs.create({ url: 'chrome://extensions/?id=' + chrome.runtime.id });
  };

  // New controls
  const visualBtn = document.getElementById('visual-btn');
  const fixAllBtn = document.getElementById('fixall-btn');
  const autopilotBtn = document.getElementById('autopilot-btn');
  const exportBtn = document.getElementById('export-btn');
  const replayBtn = document.getElementById('replay-btn');
  const designSystemBtn = document.getElementById('designsystem-btn');
  const savePackBtn = document.getElementById('savepack-btn');
  const applyPackBtn = document.getElementById('applypack-btn');

  visualBtn.onclick = async () => {
    visualBtn.textContent = 'Toggling...';
    visualBtn.disabled = true;
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: () => window.visualInspector?.toggle()
      });
    } catch (e) {
      console.error(e);
    }
    visualBtn.textContent = 'Visualize';
    visualBtn.disabled = false;
  };

  fixAllBtn.onclick = async () => {
    fixAllBtn.textContent = 'Fixing...';
    fixAllBtn.disabled = true;
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: () => {
          if (window.uiCopilot) {
            uiCopilot.scanPage().then(() => {
              uiCopilot.issues.forEach(issue => {
                try { issue.fix(); } catch (e) { console.warn('fix failed', e); }
              });
              try {
                chrome.storage.local.get(['issuesFixed'], data => {
                  const prev = data.issuesFixed || 0;
                  chrome.storage.local.set({ issuesFixed: prev + uiCopilot.issues.length });
                });
              } catch (e) { /* ignore */ }
            });
          }
        }
      });
    } catch (e) {
      console.error(e);
    }
    fixAllBtn.textContent = 'Fix All';
    fixAllBtn.disabled = false;
  };

  // Autopilot toggle: enables a cursor AI agent that inspects and optionally auto-fixes elements
  autopilotBtn.onclick = async () => {
    autopilotBtn.textContent = 'Toggling...';
    autopilotBtn.disabled = true;
    try {
      const resp = await new Promise((resolve) => {
        chrome.runtime.sendMessage({ type: 'toggleCursorAgent' }, (r) => resolve(r));
      });
      if (resp && resp.enabled) {
        autopilotBtn.textContent = 'Autopilot: On';
      } else {
        autopilotBtn.textContent = 'Autopilot: Off';
      }
    } catch (e) {
      console.error(e);
      autopilotBtn.textContent = 'Autopilot';
    }
    autopilotBtn.disabled = false;
  };

  // Export fixes as JSON (download from popup without extra permissions)
  exportBtn.onclick = async () => {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      const result = await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: () => (window.uiCopilot && typeof window.uiCopilot.exportFixes === 'function') ? window.uiCopilot.exportFixes() : '[]'
      });
      const json = (result && result[0] && result[0].result) || '[]';
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'ui-copilot-fixes.json';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error('export failed', e);
    }
  };

  // Replay fixes: prompt for JSON and apply into page
  replayBtn.onclick = async () => {
    try {
      const text = prompt('Paste fixes JSON to replay:');
      if (!text) return;
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: (payload) => {
          if (window.uiCopilot && typeof window.uiCopilot.applyFixes === 'function') {
            return window.uiCopilot.applyFixes(payload);
          }
          return false;
        },
        args: [text]
      });
    } catch (e) {
      console.error('replay failed', e);
    }
  };

  // Toggle Design System Alignment mode
  designSystemBtn.onclick = async () => {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      const result = await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: () => window.uiCopilot?.toggleDesignSystemMode()
      });
      const on = !!(result && result[0] && result[0].result);
      designSystemBtn.textContent = on ? 'Design System: On' : 'Design System: Off';
    } catch (e) {
      console.error('toggle design system failed', e);
    }
  };

  // Save current session as Fix Pack
  savePackBtn.onclick = async () => {
    try {
      const title = prompt('Fix Pack title:');
      if (title === null) return;
      const description = prompt('Fix Pack description:') || '';
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: (t, d) => window.uiCopilot?.saveFixPack(t, d),
        args: [title, description]
      });
    } catch (e) {
      console.error('save pack failed', e);
    }
  };

  // Apply a saved Fix Pack by index
  applyPackBtn.onclick = async () => {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      // fetch list first
      const listResult = await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: () => window.uiCopilot?.listFixPacks()
      });
      const packs = (listResult && listResult[0] && listResult[0].result) || [];
      if (!packs.length) {
        alert('No Fix Packs saved yet.');
        return;
      }
      const names = packs.map((p, i) => `${i}: ${p.title}`).join('\n');
      const idxStr = prompt(`Choose a Fix Pack by index:\n${names}`);
      if (idxStr === null) return;
      const idx = parseInt(idxStr, 10);
      if (Number.isNaN(idx) || idx < 0 || idx >= packs.length) return;
      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: (i) => window.uiCopilot?.applyFixPackByIndex(i),
        args: [idx]
      });
    } catch (e) {
      console.error('apply pack failed', e);
    }
  };

  // initialize autopilot button label when popup opens using stored global state
  (async () => {
    try {
      const data = await chrome.storage.local.get(['cursorAgentEnabled','cursorAgentAutofix']);
      const en = data.cursorAgentEnabled || false;
      const af = data.cursorAgentAutofix || false;
      autopilotBtn.textContent = en ? (af ? 'Autopilot: On (AutoFix)' : 'Autopilot: On') : 'Autopilot: Off';
    } catch (e) {
      // ignore
    }
  })();

  settingsBtn.onclick = () => {
    chrome.tabs.create({ url: 'chrome://extensions/?id=' + chrome.runtime.id });
  };
});