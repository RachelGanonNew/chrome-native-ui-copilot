chrome.runtime.onInstalled.addListener(() => {
  console.log('UI Copilot installed');
  
  // Initialize storage
  chrome.storage.local.set({
    issuesFound: 0,
    issuesFixed: 0,
    autoFix: false,
    sensitivity: 'medium'
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
});