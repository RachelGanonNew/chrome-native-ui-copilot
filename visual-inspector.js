// Visual Inspector: overlays markers for issues detected by uiCopilot
(function() {
  if (window.__ui_copilot_visual_installed) return;
  window.__ui_copilot_visual_installed = true;

  const container = document.createElement('div');
  container.id = 'copilot-visual-container';
  document.documentElement.appendChild(container);

  let enabled = false;
  let markers = [];

  function clearMarkers() {
    markers.forEach(m => m.el.remove());
    markers = [];
  }

  function createMarker(issue, i) {
    if (!issue || !issue.element) return null;
    const el = issue.element;
    const rect = el.getBoundingClientRect();
    const marker = document.createElement('div');
    marker.className = 'copilot-marker ' + (issue.severity || 'medium');
    marker.setAttribute('data-index', i);
    marker.style.position = 'absolute';
    marker.style.left = (rect.left + window.scrollX) + 'px';
    marker.style.top = (rect.top + window.scrollY) + 'px';
    marker.style.width = Math.max(6, rect.width) + 'px';
    marker.style.height = Math.max(6, rect.height) + 'px';

    // Badge
    const badge = document.createElement('div');
    badge.className = 'copilot-badge';
    badge.textContent = issue.severity ? issue.severity[0].toUpperCase() : 'i';
    marker.appendChild(badge);

    // Tooltip
    const tip = document.createElement('div');
    tip.className = 'copilot-tip';
    tip.innerHTML = `
      <div class="copilot-tip-msg">${(issue.message||'Issue detected').replace(/</g,'&lt;')}</div>
      <div class="copilot-tip-actions">
        <button class="copilot-fix-btn">Fix</button>
        <button class="copilot-audit-btn">Audit</button>
      </div>
    `;
    marker.appendChild(tip);

    // Events
    marker.addEventListener('mouseenter', () => marker.classList.add('hover'));
    marker.addEventListener('mouseleave', () => marker.classList.remove('hover'));

    tip.querySelector('.copilot-fix-btn').addEventListener('click', (ev) => {
      ev.stopPropagation();
      try {
        issue.fix();
        marker.classList.add('fixed');
        // increment storage counter
        try {
          chrome.storage.local.get(['issuesFixed'], data => {
            const prev = data.issuesFixed || 0;
            chrome.storage.local.set({ issuesFixed: prev + 1 });
          });
        } catch (e) { /* ignore when chrome not available */ }
      } catch (e) {
        console.warn('fix failed', e);
      }
    });

    tip.querySelector('.copilot-audit-btn').addEventListener('click', (ev) => {
      ev.stopPropagation();
      // open the panel if available
      const panel = document.getElementById('ui-copilot-panel');
      if (panel) panel.style.display = 'block';
      // show this issue in the panel if uiCopilot supports it
      if (window.uiCopilot) {
        const idx = window.uiCopilot.issues.indexOf(issue);
        if (idx !== -1) window.uiCopilot.highlightElement(idx);
      }
    });

    container.appendChild(marker);
    return { el: marker, issue };
  }

  function positionMarkers() {
    markers.forEach(m => {
      const issue = m.issue;
      if (!issue || !issue.element) {
        m.el.remove();
        return;
      }
      const rect = issue.element.getBoundingClientRect();
      m.el.style.left = (rect.left + window.scrollX) + 'px';
      m.el.style.top = (rect.top + window.scrollY) + 'px';
      m.el.style.width = Math.max(6, rect.width) + 'px';
      m.el.style.height = Math.max(6, rect.height) + 'px';
    });
  }

  async function refresh() {
    clearMarkers();
    if (!window.uiCopilot) return;
    // If no issues detected yet, run a scan
    try {
      if (!window.uiCopilot.issues || window.uiCopilot.issues.length === 0) {
        await window.uiCopilot.scanPage();
      }
    } catch (e) {
      console.warn('scanPage failed', e);
    }

    const issues = window.uiCopilot.issues || [];
    issues.forEach((issue, idx) => {
      const m = createMarker(issue, idx);
      if (m) markers.push(m);
    });

    positionMarkers();
  }

  function enable() {
    if (enabled) return;
    enabled = true;
    container.classList.add('visible');
    refresh();
    window.addEventListener('scroll', positionMarkers, true);
    window.addEventListener('resize', positionMarkers);
  }

  function disable() {
    if (!enabled) return;
    enabled = false;
    container.classList.remove('visible');
    clearMarkers();
    window.removeEventListener('scroll', positionMarkers, true);
    window.removeEventListener('resize', positionMarkers);
  }

  window.visualInspector = {
    enable,
    disable,
    toggle: () => (enabled ? disable() : enable()),
    isEnabled: () => enabled,
    refresh
  };

  // start disabled
  disable();
})();
