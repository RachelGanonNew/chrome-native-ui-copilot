chrome.runtime.onInstalled.addListener(() => {
  console.log('UI Copilot installed');
  
  // Initialize storage
  chrome.storage.local.set({
    issuesFound: 0,
    issuesFixed: 0,
    autoFix: false,
    sensitivity: 'medium',
    cursorAgentEnabled: false,
    cursorAgentAutofix: false
  });

  // Create context menu
  chrome.contextMenus.create({
    id: 'audit-element',
    title: '🤖 Audit this element',
    contexts: ['all']
  });

  chrome.contextMenus.create({
    id: 'fix-element',
    title: '⚡ Auto-fix this element',
    contexts: ['all']
  });

  chrome.contextMenus.create({
    id: 'scan-page',
    title: '🔍 Scan entire page',
    contexts: ['page']
  });
});

chrome.action.onClicked.addListener(async (tab) => {
  try {
    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: () => {
        const panel = document.getElementById('ui-copilot-panel');
        if (panel) {
          panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
        }
      }
    });
  } catch (e) {
    console.error('Failed to toggle panel:', e);
  }
});

// Handle context menu clicks
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  try {
    switch (info.menuItemId) {
      case 'audit-element':
        await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          func: (x, y) => {
            const element = document.elementFromPoint(x, y);
            if (element && window.uiCopilot) {
              window.uiCopilot.auditElement(element);
            }
          },
          args: [info.x || 0, info.y || 0]
        });
        break;
      case 'fix-element':
        await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          func: (x, y) => {
            const element = document.elementFromPoint(x, y);
            if (element && window.uiCopilot) {
              window.uiCopilot.fixElement(element);
            }
          },
          args: [info.x || 0, info.y || 0]
        });
        break;
      case 'scan-page':
        await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          func: () => window.uiCopilot?.scanPage()
        });
        break;
    }
  } catch (e) {
    console.error('Context menu action failed:', e);
  }
});

// Listen for messages from content script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'updateStats') {
    chrome.storage.local.get(['issuesFound', 'issuesFixed'], (data) => {
      chrome.storage.local.set({
        issuesFound: (data.issuesFound || 0) + (message.issuesFound || 0),
        issuesFixed: (data.issuesFixed || 0) + (message.issuesFixed || 0)
      });
    });
  }
  // Manage cursor agent global state
  if (message.type === 'setCursorAgentEnabled') {
    const enabled = !!message.enabled;
    chrome.storage.local.set({ cursorAgentEnabled: enabled }, () => {
      // Broadcast to all tabs
      chrome.tabs.query({}, (tabs) => {
        tabs.forEach(t => {
          try {
            chrome.scripting.executeScript({
              target: { tabId: t.id },
              func: (en) => {
                try {
                  if (window.cursorAgent && en) window.cursorAgent.enable();
                  if (window.cursorAgent && !en) window.cursorAgent.disable();
                } catch (e) {}
              },
              args: [enabled]
            }).catch(() => {});
          } catch (e) {}
        });
      });
    });
    sendResponse({ ok: true });
    return true;
  }

  if (message.type === 'toggleCursorAgent') {
    chrome.storage.local.get(['cursorAgentEnabled'], (data) => {
      const cur = !!data.cursorAgentEnabled;
      const next = !cur;
      chrome.storage.local.set({ cursorAgentEnabled: next }, () => {
        chrome.tabs.query({}, (tabs) => {
          tabs.forEach(t => {
            try {
              chrome.scripting.executeScript({
                target: { tabId: t.id },
                func: (en) => {
                  try {
                    if (window.cursorAgent && en) window.cursorAgent.enable();
                    if (window.cursorAgent && !en) window.cursorAgent.disable();
                  } catch (e) {}
                },
                args: [next]
              }).catch(() => {});
            } catch (e) {}
          });
        });
      });
      sendResponse({ enabled: next });
    });
    return true;
  }

  if (message.type === 'getCursorAgentState') {
    chrome.storage.local.get(['cursorAgentEnabled','cursorAgentAutofix'], data => {
      sendResponse({ enabled: !!data.cursorAgentEnabled, autofix: !!data.cursorAgentAutofix });
    });
    return true;
  }
});

// Ensure stored cursorAgentEnabled value is applied to tabs when they finish loading
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete') {
    chrome.storage.local.get(['cursorAgentEnabled'], data => {
      if (data && data.cursorAgentEnabled) {
        try {
          chrome.scripting.executeScript({
            target: { tabId },
            func: () => { try { window.cursorAgent && window.cursorAgent.enable(); } catch(e){} }
          }).catch(() => {});
        } catch (e) {}
      }
    });
  }
});