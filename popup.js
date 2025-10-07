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
});