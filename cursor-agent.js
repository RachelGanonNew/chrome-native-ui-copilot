// Cursor AI Agent (Autopilot): observes elements under the cursor and suggests or applies fixes
(function() {
  if (window.__ui_copilot_cursor_agent_installed) return;
  window.__ui_copilot_cursor_agent_installed = true;

  const HOVER_DELAY = 700; // ms to pause before inspecting
  let enabled = false;
  let autofix = false;
  let hoverTimer = null;
  let lastEl = null;

  // UI bubble that shows suggestions
  const bubble = document.createElement('div');
  bubble.id = 'copilot-cursor-bubble';
  bubble.style.position = 'fixed';
  bubble.style.zIndex = '2147483647';
  bubble.style.display = 'none';
  document.body.appendChild(bubble);

  function setAutofixStorage(val){
    autofix = !!val;
    try { chrome.storage.local.set({ cursorAgentAutofix: autofix }); } catch(e) {/* ignore */}
  }

  function readAutofixStorage(){
    try {
      chrome.storage.local.get(['cursorAgentAutofix'], data => {
        if (typeof data.cursorAgentAutofix !== 'undefined') autofix = !!data.cursorAgentAutofix;
      });
    } catch(e) { /* ignore */ }
  }
 
  function setEnabledStorage(val){
    try { chrome.storage.local.set({ cursorAgentEnabled: !!val }); } catch(e) { /* ignore */ }
  }
 
  function readEnabledStorage(){
    try {
      chrome.storage.local.get(['cursorAgentEnabled'], data => {
        if (typeof data.cursorAgentEnabled !== 'undefined' && data.cursorAgentEnabled) {
          enable();
        }
      });
    } catch(e) { /* ignore */ }
  }

  function showBubbleAt(x, y, html){
    bubble.innerHTML = html;
    bubble.style.left = (x + 12) + 'px';
    bubble.style.top = (y + 12) + 'px';
    bubble.style.display = 'block';
  }

  function hideBubble(){
    bubble.style.display = 'none';
    bubble.innerHTML = '';
  }

  async function inspectElement(el, clientX, clientY){
    if (!el || el === document.body || el === document.documentElement) return;
    if (!window.uiCopilot || !window.uiCopilot.detectIssues) return;

    try {
      const issues = await window.uiCopilot.detectIssues(el);
      if (!issues || issues.length === 0) {
        hideBubble();
        return;
      }

      // Build simple summary using the highest-severity issue
      const severityOrder = { 'critical':4, 'high':3, 'medium':2, 'low':1 };
      issues.sort((a,b)=>(severityOrder[b.severity||'medium'] - severityOrder[a.severity||'medium']));
      const top = issues[0];
      const msg = (top.message || top.type || 'Visual issue detected');

      const html = `
        <div class="copilot-cursor-msg">
          <div class="copilot-cursor-title">${escapeHtml(msg)}</div>
          <div class="copilot-cursor-actions">
            <button id="copilot-cursor-apply">Apply Fix</button>
            <button id="copilot-cursor-ignore">Ignore</button>
            <label><input type="checkbox" id="copilot-cursor-autofix" ${autofix? 'checked':''}/> Auto-apply</label>
          </div>
        </div>
      `;

      showBubbleAt(clientX, clientY, html);

      // wire actions
      const applyBtn = document.getElementById('copilot-cursor-apply');
      const ignoreBtn = document.getElementById('copilot-cursor-ignore');
      const autoChk = document.getElementById('copilot-cursor-autofix');

      if (applyBtn) applyBtn.onclick = () => {
        try { issues.forEach(i => i.fix()); flashTarget(el); } catch(e) { console.warn('apply failed', e); }
        hideBubble();
      };

      if (ignoreBtn) ignoreBtn.onclick = () => { hideBubble(); };

      if (autoChk) autoChk.onchange = (e) => { setAutofixStorage(e.target.checked); };

      if (autofix) {
        try { issues.forEach(i => i.fix()); flashTarget(el); hideBubble(); } catch(e){ console.warn('autofix failed', e); }
      }
    } catch (e) {
      console.warn('inspectElement failed', e);
    }
  }

  function flashTarget(el){
    el.classList.add('copilot-autofixed');
    setTimeout(()=>el.classList.remove('copilot-autofixed'), 2000);
  }

  function onMove(e){
    const px = e.clientX, py = e.clientY;
    // find element under cursor (ignore our bubble)
    bubble.classList.add('temp-ignore');
    const el = document.elementFromPoint(px, py);
    bubble.classList.remove('temp-ignore');

    if (el === lastEl) return;
    lastEl = el;
    hideBubble();
    if (hoverTimer) clearTimeout(hoverTimer);
    hoverTimer = setTimeout(()=>inspectElement(el, px, py), HOVER_DELAY);
  }

  function enable(){
    if (enabled) return;
    enabled = true;
    readAutofixStorage();
    window.addEventListener('mousemove', onMove, { passive: true });
    document.addEventListener('scroll', () => { hideBubble(); lastEl = null; }, true);
    // persist enabled state
    setEnabledStorage(true);
    updateFloatingButton();
  }

  function disable(){
    if (!enabled) return;
    enabled = false;
    window.removeEventListener('mousemove', onMove);
    hideBubble();
    lastEl = null;
    if (hoverTimer) clearTimeout(hoverTimer);
    // persist enabled state
    setEnabledStorage(false);
    updateFloatingButton();
  }

  function escapeHtml(str){ return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

  // Expose API
  window.cursorAgent = {
    enable,
    disable,
    toggle: () => (enabled ? disable() : enable()),
    isEnabled: () => enabled,
    setAutofix: (v) => setAutofixStorage(v),
    isAutofix: () => autofix
  };

  // CSS helper class for visual feedback
  const style = document.createElement('style');
  style.textContent = `
    #copilot-cursor-bubble{background:rgba(255,255,255,0.98);border:1px solid rgba(0,0,0,0.08);padding:8px;border-radius:8px;box-shadow:0 8px 24px rgba(0,0,0,0.12);font-family:Arial,Helvetica,sans-serif;font-size:13px;color:#111}
    #copilot-cursor-bubble .copilot-cursor-title{font-weight:700;margin-bottom:6px}
    #copilot-cursor-bubble .copilot-cursor-actions{display:flex;gap:8px;align-items:center}
    #copilot-cursor-bubble button{padding:6px 8px;border-radius:6px;border:none;cursor:pointer}
    #copilot-cursor-bubble #copilot-cursor-apply{background:#007bff;color:white}
    #copilot-cursor-bubble #copilot-cursor-ignore{background:#6c757d;color:white}
    .copilot-autofixed{outline:3px solid rgba(0,123,255,0.6);transition:outline .18s}
    .temp-ignore{pointer-events:none!important}
  `;
  document.head.appendChild(style);

  // Floating quick-toggle button
  const floatBtn = document.createElement('button');
  floatBtn.id = 'copilot-autopilot-toggle';
  floatBtn.setAttribute('aria-pressed', 'false');
  floatBtn.title = 'Toggle Autopilot (AI cursor)';
  floatBtn.style.position = 'fixed';
  floatBtn.style.right = '14px';
  floatBtn.style.bottom = '14px';
  floatBtn.style.zIndex = '2147483647';
  floatBtn.style.padding = '8px 10px';
  floatBtn.style.background = '#007bff';
  floatBtn.style.color = '#fff';
  floatBtn.style.border = 'none';
  floatBtn.style.borderRadius = '8px';
  floatBtn.style.boxShadow = '0 8px 24px rgba(0,0,0,0.18)';
  floatBtn.style.cursor = 'pointer';
  floatBtn.style.fontFamily = 'Arial, Helvetica, sans-serif';
  floatBtn.style.fontSize = '13px';
  floatBtn.style.opacity = '0.95';
  floatBtn.innerText = 'Autopilot: Off';
  floatBtn.onclick = (e) => { e.stopPropagation(); window.cursorAgent.toggle(); };
  document.body.appendChild(floatBtn);

  function updateFloatingButton(){
    try {
      if (!floatBtn) return;
      floatBtn.setAttribute('aria-pressed', enabled ? 'true' : 'false');
      floatBtn.innerText = enabled ? (autofix ? 'Autopilot: On (Auto)' : 'Autopilot: On') : 'Autopilot: Off';
      floatBtn.style.background = enabled ? '#007bff' : 'rgba(0,0,0,0.6)';
    } catch(e){}
  }

  // initialize state from storage then update UI
  try { readEnabledStorage(); } catch(e) { /* ignore */ }
  updateFloatingButton();
})();
