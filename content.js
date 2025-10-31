class UICopilot {
  constructor() {
    this.issues = [];
    this.aiSession = null;
    this.appliedActions = [];
    this.designSystemMode = false;
    this.designTokens = {};
    this.fixedCount = 0;
    this.tokenAliases = {}; // per-domain alias mapping
    this.init();
  }

  async init() {
    await this.initAI();
    this.createUI();
    this.designTokens = this.scanDesignTokens();
    this.createScoreBadge();
    await this.loadTokenAliases();
    try {
      if (typeof URLSearchParams !== 'undefined') {
        const params = new URLSearchParams(location.search || '');
        if (params.get('autodemo') === '1') {
          setTimeout(() => this.startGuidedDemo(), 600);
        }
      }
    } catch (e) { /* ignore */ }
  }

  async initAI() {
    try {
      // Check if Chrome AI is available
      if (typeof window.ai !== 'undefined' && window.ai.languageModel) {
        const capabilities = await window.ai.languageModel.capabilities();
        if (capabilities.available === 'readily') {
          this.aiSession = await window.ai.languageModel.create({
            systemPrompt: `You are an expert UI/UX auditor. Analyze HTML elements for accessibility, performance, mobile UX, conversion optimization, and visual design issues. Respond with JSON: {"issue": "Brief description", "severity": "critical|high|medium|low", "category": "accessibility|performance|mobile|conversion|visual", "fix": "Specific solution", "code": "CSS/HTML fix"}`
          });
          console.log('✅ Gemini Nano AI initialized');
          return;
        }
      }
      
      // Fallback: Check if we need to download the model
      if (typeof window.ai !== 'undefined' && window.ai.languageModel) {
        const capabilities = await window.ai.languageModel.capabilities();
        if (capabilities.available === 'after-download') {
          console.log('📥 Downloading AI model...');
          this.aiSession = await window.ai.languageModel.create();
          console.log('✅ AI model downloaded and initialized');
          return;
        }
      }
      
      throw new Error('AI not available');
    } catch (e) {
      console.log('⚠️ AI not available:', e.message);
      this.showAIStatus('❌ AI unavailable - using basic detection');
    }
  }

  createUI() {
    const panel = document.createElement('div');
    panel.id = 'ui-copilot-panel';
    panel.innerHTML = `
      <div class="copilot-header">
        <span>🤖 UI Copilot</span>
        <div id="ai-status">🔄 Checking AI...</div>
        <button id="copilot-toggle">Scan</button>
        <button id="copilot-close">×</button>
      </div>
      <div class="copilot-content">
        <div id="issues-list">Click Scan to detect issues</div>
      </div>
    `;
    document.body.appendChild(panel);

    document.getElementById('copilot-toggle').onclick = () => this.scanPage();
    document.getElementById('copilot-close').onclick = () => panel.style.display = 'none';
    
    // Update AI status
    setTimeout(() => {
      this.showAIStatus(this.aiSession ? '✅ AI Ready' : '⚠️ Basic Mode');
    }, 1000);
  }

  async scanPage() {
    this.issues = [];
    const elements = document.querySelectorAll('*');
    
    for (let el of elements) {
      const issues = await this.detectIssues(el);
      this.issues.push(...issues);
    }
    
    this.displayIssues();
  }

  async detectIssues(element) {
    const issues = [];
    const style = getComputedStyle(element);
    const platform = this.detectPlatform();

    // Universal issues
    if (this.hasLowContrast(element)) {
      issues.push({
        element, type: 'contrast', severity: 'high',
        message: 'Low contrast - hurts accessibility & conversions',
        fix: () => this.fixContrast(element)
      });
    }

    if (this.hasOverflow(element, style)) {
      issues.push({
        element, type: 'overflow', severity: 'medium', 
        message: 'Content overflow - breaks mobile experience',
        fix: () => this.fixOverflow(element)
      });
    }

    if (this.hasMisalignment(element)) {
      issues.push({
        element, type: 'alignment', severity: 'low',
        message: 'Misaligned element - looks unprofessional', 
        fix: () => this.fixAlignment(element)
      });
    }

    // Mobile responsiveness
    if (this.isMobileUnfriendly(element)) {
      issues.push({
        element, type: 'mobile', severity: 'high',
        message: 'Not mobile-friendly - losing mobile users',
        fix: () => this.fixMobile(element)
      });
    }

    // Conversion optimization
    if (this.isConversionKiller(element)) {
      issues.push({
        element, type: 'conversion', severity: 'medium',
        message: 'Poor UX - may reduce conversions',
        fix: () => this.fixConversion(element)
      });
    }

    // Platform-specific AI analysis
    if (this.aiSession) {
      const aiIssues = await this.detectWithAI(element, platform);
      issues.push(...aiIssues);
    }

    return issues;
  }

  hasLowContrast(element) {
    const style = getComputedStyle(element);
    const color = this.parseColor(style.color);
    const bgColor = this.parseColor(style.backgroundColor);
    
    if (!color || !bgColor) return false;
    
    const contrast = this.calculateContrast(color, bgColor);
    return contrast < 4.5;
  }

  hasOverflow(element, style) {
    return style.overflow === 'visible' && 
           (element.scrollWidth > element.clientWidth || 
            element.scrollHeight > element.clientHeight);
  }

  hasMisalignment(element) {
    const rect = element.getBoundingClientRect();
    return rect.left < 0 || rect.top < 0;
  }

  detectPlatform() {
    const url = window.location.hostname;
    if (url.includes('webflow')) return 'webflow';
    if (url.includes('bubble')) return 'bubble';
    if (url.includes('framer')) return 'framer';
    if (url.includes('wix')) return 'wix';
    if (url.includes('squarespace')) return 'squarespace';
    if (url.includes('retool')) return 'retool';
    if (url.includes('figma')) return 'figma';
    return 'web';
  }

  async detectWithAI(element, platform) {
    if (!this.aiSession) return [];
    
    try {
      const prompt = `Platform: ${platform}. Analyze for UX/conversion issues: ${element.outerHTML.substring(0, 400)}. Focus on: mobile responsiveness, accessibility, conversion optimization, ${platform}-specific best practices.`;
      const response = await this.aiSession.prompt(prompt);
      const analysis = JSON.parse(response);
      
      return [{
        element, type: 'ai-detected', severity: analysis.severity || 'medium',
        message: `${platform.toUpperCase()}: ${analysis.issue || 'AI detected UX issue'}`,
        fix: () => this.applyAIFix(element, analysis.fix)
      }];
    } catch (e) {
      return [];
    }
  }

  isMobileUnfriendly(element) {
    const style = getComputedStyle(element);
    const rect = element.getBoundingClientRect();
    return rect.width > window.innerWidth || 
           parseInt(style.fontSize) < 14 ||
           (element.tagName === 'BUTTON' && rect.height < 44);
  }

  isConversionKiller(element) {
    const text = element.textContent?.toLowerCase() || '';
    const isButton = element.tagName === 'BUTTON' || element.role === 'button';
    const isForm = element.tagName === 'FORM' || element.closest('form');
    
    return (isButton && text.includes('submit')) ||
           (isForm && !element.querySelector('[required]')) ||
           (element.tagName === 'INPUT' && !element.placeholder);
  }

  fixMobile(element) {
    const selector = this.getUniqueSelector(element);
    const prev = {
      maxWidth: element.style.maxWidth,
      fontSize: element.style.fontSize,
      minHeight: element.style.minHeight
    };
    element.style.maxWidth = '100%';
    element.style.fontSize = Math.max(16, parseInt(getComputedStyle(element).fontSize)) + 'px';
    if (element.tagName === 'BUTTON') element.style.minHeight = '44px';
    this.recordStyleChanges(selector, {
      maxWidth: { before: prev.maxWidth, after: element.style.maxWidth },
      fontSize: { before: prev.fontSize, after: element.style.fontSize },
      minHeight: { before: prev.minHeight, after: element.style.minHeight }
    }, element);
    this.highlightFixed(element);
    this.fixedCount += 1;
  }

  fixConversion(element) {
    const selector = this.getUniqueSelector(element);
    const record = { type: 'style', selector, changes: {} };
    if (element.tagName === 'BUTTON') {
      record.changes.backgroundColor = { before: element.style.backgroundColor, after: '#007bff' };
      record.changes.color = { before: element.style.color, after: 'white' };
      record.changes.padding = { before: element.style.padding, after: '12px 24px' };
      element.style.backgroundColor = this.resolveToken('backgroundColor', '#007bff');
      element.style.color = this.resolveToken('color', 'white');
      element.style.padding = '12px 24px';
    }
    if (element.tagName === 'INPUT' && !element.placeholder) {
      const before = element.placeholder;
      const after = 'Enter ' + (element.name || 'value');
      record.type = 'attribute';
      record.attr = 'placeholder';
      record.before = before;
      record.after = after;
      element.placeholder = after;
    }
    this.pushRecordedAction(record, element);
    this.highlightFixed(element);
    this.fixedCount += 1;
  }

  fixContrast(element) {
    const selector = this.getUniqueSelector(element);
    const prev = { color: element.style.color, backgroundColor: element.style.backgroundColor };
    element.style.color = this.resolveToken('color', '#000000');
    element.style.backgroundColor = this.resolveToken('backgroundColor', '#ffffff');
    this.recordStyleChanges(selector, {
      color: { before: prev.color, after: element.style.color },
      backgroundColor: { before: prev.backgroundColor, after: element.style.backgroundColor }
    }, element);
    this.highlightFixed(element);
    this.fixedCount += 1;
  }

  fixOverflow(element) {
    const selector = this.getUniqueSelector(element);
    const prev = { overflow: element.style.overflow, textOverflow: element.style.textOverflow };
    element.style.overflow = 'hidden';
    element.style.textOverflow = 'ellipsis';
    this.recordStyleChanges(selector, {
      overflow: { before: prev.overflow, after: element.style.overflow },
      textOverflow: { before: prev.textOverflow, after: element.style.textOverflow }
    }, element);
    this.highlightFixed(element);
    this.fixedCount += 1;
  }

  fixAlignment(element) {
    const selector = this.getUniqueSelector(element);
    const prev = { margin: element.style.margin, textAlign: element.style.textAlign };
    element.style.margin = '0 auto';
    element.style.textAlign = 'center';
    this.recordStyleChanges(selector, {
      margin: { before: prev.margin, after: element.style.margin },
      textAlign: { before: prev.textAlign, after: element.style.textAlign }
    }, element);
    this.highlightFixed(element);
    this.fixedCount += 1;
  }

  applyAIFix(element, fixCode) {
    try {
      eval(fixCode);
      // Best effort: record last inline style changes as a macro snapshot
      const selector = this.getUniqueSelector(element);
      const style = element.getAttribute('style') || '';
      this.appliedActions.push({ type: 'styleText', selector, style });
      this.highlightFixed(element);
      this.fixedCount += 1;
    } catch (e) {
      console.error('AI fix failed:', e);
    }
  }

  highlightFixed(element) {
    element.classList.add('copilot-fixed');
    setTimeout(() => element.classList.remove('copilot-fixed'), 2000);
  }

  displayIssues() {
    const list = document.getElementById('issues-list');
    if (this.issues.length === 0) {
      list.innerHTML = '✅ No issues detected - Great job!';
      return;
    }

    // Group issues by severity
    const grouped = this.issues.reduce((acc, issue) => {
      acc[issue.severity] = acc[issue.severity] || [];
      acc[issue.severity].push(issue);
      return acc;
    }, {});

    let html = `<div class="issues-summary">📊 Found ${this.issues.length} issues</div>`;
    
    ['critical', 'high', 'medium', 'low'].forEach(severity => {
      if (grouped[severity]) {
        html += `<div class="severity-group">
          <h4>${severity.toUpperCase()} (${grouped[severity].length})</h4>`;
        
        grouped[severity].forEach((issue, i) => {
          const globalIndex = this.issues.indexOf(issue);
          html += `
            <div class="issue-item ${issue.severity}">
              <div class="issue-content">
                <strong>${issue.type?.toUpperCase() || 'ISSUE'}</strong>
                <p>${issue.message}</p>
                ${issue.impact ? `<small>🎯 Impact: ${issue.impact}</small>` : ''}
              </div>
              <div class="issue-actions">
                <button onclick="uiCopilot.issues[${globalIndex}].fix()" class="fix-btn">Fix</button>
                <button onclick="uiCopilot.highlightElement(${globalIndex})" class="highlight-btn">🔍</button>
              </div>
            </div>`;
        });
        html += '</div>';
      }
    });

    list.innerHTML = html;
    
    // Update stats
    chrome.runtime.sendMessage({
      type: 'updateStats',
      issuesFound: this.issues.length
    });
    this.updateScoreBadge(this.issues.length, this.fixedCount);
  }

  parseColor(color) {
    const div = document.createElement('div');
    div.style.color = color;
    document.body.appendChild(div);
    const computed = getComputedStyle(div).color;
    document.body.removeChild(div);
    
    const match = computed.match(/rgb\((\d+), (\d+), (\d+)\)/);
    return match ? [parseInt(match[1]), parseInt(match[2]), parseInt(match[3])] : null;
  }

  calculateContrast([r1, g1, b1], [r2, g2, b2]) {
    const l1 = this.getLuminance(r1, g1, b1);
    const l2 = this.getLuminance(r2, g2, b2);
    return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
  }

  getLuminance(r, g, b) {
    const [rs, gs, bs] = [r, g, b].map(c => {
      c = c / 255;
      return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
  }

  // Context menu methods
  async auditElement(element) {
    const issues = await this.detectIssues(element);
    if (issues.length > 0) {
      this.issues = issues;
      this.displayIssues();
      this.showPanel();
      this.highlightElement(0);
    } else {
      this.showNotification('✅ No issues found with this element!');
    }
  }

  async fixElement(element) {
    const issues = await this.detectIssues(element);
    if (issues.length > 0) {
      issues.forEach(issue => issue.fix());
      this.showNotification(`⚡ Fixed ${issues.length} issue(s)!`);
    } else {
      this.showNotification('✅ Element looks good!');
    }
  }

  highlightElement(issueIndex) {
    // Remove previous highlights
    document.querySelectorAll('.copilot-highlighted').forEach(el => {
      el.classList.remove('copilot-highlighted');
    });

    if (this.issues[issueIndex] && this.issues[issueIndex].element) {
      const element = this.issues[issueIndex].element;
      element.classList.add('copilot-highlighted');
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      
      setTimeout(() => {
        element.classList.remove('copilot-highlighted');
      }, 3000);
    }
  }

  showPanel() {
    const panel = document.getElementById('ui-copilot-panel');
    if (panel) {
      panel.style.display = 'block';
    }
  }

  showNotification(message) {
    const notification = document.createElement('div');
    notification.className = 'copilot-notification';
    notification.textContent = message;
    document.body.appendChild(notification);
    
    setTimeout(() => {
      notification.classList.add('show');
    }, 100);
    
    setTimeout(() => {
      notification.classList.remove('show');
      setTimeout(() => notification.remove(), 300);
    }, 2000);
  }

  showAIStatus(status) {
    const statusEl = document.getElementById('ai-status');
    if (statusEl) {
      statusEl.textContent = status;
    }
  }

  // Enhanced AI detection with better prompting
  async detectWithAI(element, platform) {
    if (!this.aiSession) return [];
    
    try {
      const elementInfo = {
        tag: element.tagName,
        classes: Array.from(element.classList),
        text: element.textContent?.substring(0, 100),
        attributes: Array.from(element.attributes).map(attr => `${attr.name}="${attr.value}"`),
        styles: {
          color: getComputedStyle(element).color,
          backgroundColor: getComputedStyle(element).backgroundColor,
          fontSize: getComputedStyle(element).fontSize,
          display: getComputedStyle(element).display,
          position: getComputedStyle(element).position
        },
        dimensions: {
          width: element.offsetWidth,
          height: element.offsetHeight
        },
        accessibility: {
          hasAltText: element.hasAttribute('alt'),
          hasAriaLabel: element.hasAttribute('aria-label'),
          hasRole: element.hasAttribute('role'),
          isInteractive: ['BUTTON', 'A', 'INPUT', 'SELECT', 'TEXTAREA'].includes(element.tagName)
        }
      };

      const prompt = `Analyze this ${platform} element for UI/UX issues:

${JSON.stringify(elementInfo, null, 2)}

Context: This element is on a ${platform} website. Check for accessibility, performance, mobile UX, conversion optimization, and visual design issues. Consider WCAG guidelines and modern web standards.`;
      
      const response = await this.aiSession.prompt(prompt);
      const analysis = JSON.parse(response);
      
      if (analysis.issue && analysis.issue !== 'No issues found') {
        return [{
          element, 
          type: analysis.category || 'ai-detected', 
          severity: analysis.severity || 'medium',
          message: analysis.issue,
          impact: analysis.impact,
          wcag: analysis.wcag,
          fix: () => this.applyAIFix(element, analysis.code || analysis.fix)
        }];
      }
    } catch (e) {
      console.warn('AI analysis failed:', e);
    }
    
    return [];
  }

  // === Macro Recording: Export / Replay ===
  exportFixes() {
    try {
      const payload = { version: 1, url: location.href, timestamp: Date.now(), actions: this.appliedActions };
      return JSON.stringify(payload, null, 2);
    } catch (e) {
      return '[]';
    }
  }

  applyFixes(payload) {
    try {
      const data = typeof payload === 'string' ? JSON.parse(payload) : payload;
      const actions = data.actions || [];
      actions.forEach(a => {
        const el = document.querySelector(a.selector);
        if (!el) return;
        if (a.type === 'style' && a.changes) {
          Object.keys(a.changes).forEach(prop => {
            el.style[prop] = a.changes[prop].after;
          });
        } else if (a.type === 'styleText' && a.style) {
          el.setAttribute('style', a.style);
        } else if (a.type === 'attribute' && a.attr) {
          el.setAttribute(a.attr, a.after || '');
        }
      });
      return true;
    } catch (e) {
      console.warn('applyFixes failed', e);
      return false;
    }
  }

  getUniqueSelector(element) {
    if (element.id) return `#${CSS.escape(element.id)}`;
    const parts = [];
    let el = element;
    while (el && el.nodeType === 1 && parts.length < 5) {
      let selector = el.nodeName.toLowerCase();
      if (el.className) {
        const cls = Array.from(el.classList).slice(0, 2).map(c => `.${CSS.escape(c)}`).join('');
        selector += cls;
      }
      const siblingIndex = Array.from(el.parentNode ? el.parentNode.children : []).indexOf(el) + 1;
      selector += `:nth-child(${siblingIndex})`;
      parts.unshift(selector);
      el = el.parentElement;
    }
    return parts.join(' > ');
  }

  // === Design System Alignment ===
  toggleDesignSystemMode() {
    this.designSystemMode = !this.designSystemMode;
    this.showNotification(this.designSystemMode ? '🎨 Design System Mode: On' : '🎨 Design System Mode: Off');
    return this.designSystemMode;
  }

  scanDesignTokens() {
    const root = document.documentElement;
    const style = getComputedStyle(root);
    const candidates = [
      '--color-primary','--primary','--brand','--brand-primary','--text-color','--foreground','--bg','--background'
    ];
    const tokens = {};
    candidates.forEach(name => {
      const v = style.getPropertyValue(name).trim();
      if (v) tokens[name] = v;
    });
    return tokens;
  }

  resolveToken(prop, fallback) {
    if (!this.designSystemMode) return fallback;
    // 1) Alias mapping per domain (e.g., primary -> --brand)
    const aliasPref = {
      color: ['text','primary'],
      backgroundColor: ['background','primary']
    };
    const aliasNames = aliasPref[prop] || [];
    for (const alias of aliasNames) {
      const varName = this.tokenAliases[alias];
      if (varName) return `var(${varName})`;
    }
    // 2) Fallback to heuristic token discovery
    const map = {
      color: ['--text-color','--foreground','--color-primary','--primary'],
      backgroundColor: ['--background','--bg','--brand','--color-primary','--primary']
    };
    const prefs = map[prop] || [];
    const found = prefs.find(t => this.designTokens[t]);
    return found ? `var(${found})` : fallback;
  }

  refreshDesignTokens() {
    this.designTokens = this.scanDesignTokens();
    return this.designTokens;
  }

  setDesignToken(name, value) {
    try {
      document.documentElement.style.setProperty(name, value);
      this.designTokens[name] = value;
      return true;
    } catch (e) {
      return false;
    }
  }

  recordStyleChanges(selector, changes, element) {
    if (this.designSystemMode) {
      // rewrite color/background values to var tokens if applicable
      ['color','backgroundColor'].forEach(k => {
        if (changes[k] && typeof changes[k].after === 'string') {
          const resolved = this.resolveToken(k, changes[k].after);
          changes[k].after = resolved;
          element.style[k] = resolved;
        }
      });
    }
    this.appliedActions.push({ type: 'style', selector, changes });
  }

  pushRecordedAction(record, element) {
    if (record.type === 'style' && record.changes) {
      this.recordStyleChanges(record.selector, record.changes, element);
    } else {
      this.appliedActions.push(record);
    }
  }

  // === Team Fix Packs ===
  async saveFixPack(title, description) {
    try {
      const payload = { title: title || 'Fix Pack', description: description || '', data: JSON.parse(this.exportFixes()) };
      const store = await chrome.storage.local.get(['fixPacks']);
      const list = Array.isArray(store.fixPacks) ? store.fixPacks : [];
      list.push(payload);
      await chrome.storage.local.set({ fixPacks: list });
      this.showNotification('📦 Fix Pack saved');
      return true;
    } catch (e) {
      console.warn('saveFixPack failed', e);
      return false;
    }
  }

  async listFixPacks() {
    const store = await chrome.storage.local.get(['fixPacks']);
    return Array.isArray(store.fixPacks) ? store.fixPacks : [];
  }

  async applyFixPackByIndex(index) {
    const packs = await this.listFixPacks();
    const pack = packs[index];
    if (!pack) return false;
    return this.applyFixes(pack.data);
  }

  // === Score Badge ===
  createScoreBadge() {
    if (document.getElementById('ui-copilot-score')) return;
    const badge = document.createElement('div');
    badge.id = 'ui-copilot-score';
    badge.style.position = 'fixed';
    badge.style.right = '12px';
    badge.style.bottom = '12px';
    badge.style.zIndex = '2147483647';
    badge.style.background = 'rgba(0,0,0,0.75)';
    badge.style.color = '#fff';
    badge.style.padding = '8px 12px';
    badge.style.borderRadius = '12px';
    badge.style.fontSize = '12px';
    badge.style.fontFamily = 'system-ui, sans-serif';
    badge.textContent = 'UI Copilot: 0 found · 0 fixed';
    document.body.appendChild(badge);
  }

  updateScoreBadge(found, fixed) {
    const badge = document.getElementById('ui-copilot-score');
    if (!badge) return;
    badge.textContent = `UI Copilot: ${found} found · ${fixed} fixed`;
  }

  // === Guided Demo ===
  async startGuidedDemo() {
    // lightweight on-page helper overlay
    const overlay = document.createElement('div');
    overlay.id = 'ui-copilot-demo';
    overlay.style.position = 'fixed';
    overlay.style.left = '12px';
    overlay.style.bottom = '12px';
    overlay.style.zIndex = '2147483647';
    overlay.style.background = 'rgba(0,0,0,0.8)';
    overlay.style.color = '#fff';
    overlay.style.padding = '10px 12px';
    overlay.style.borderRadius = '10px';
    overlay.style.fontFamily = 'system-ui, sans-serif';
    overlay.style.fontSize = '12px';
    overlay.textContent = 'Starting demo…';
    document.body.appendChild(overlay);

    const step = async (text, fn, waitMs = 1200) => {
      overlay.textContent = text;
      try { await fn?.(); } catch (e) {}
      await new Promise(r => setTimeout(r, waitMs));
    };

    await step('Step 1/5: Scanning page for issues…', async () => {
      await this.scanPage();
    }, 1600);

    await step('Step 2/5: Visualizing targets…', async () => {
      try { window.visualInspector?.toggle?.(); } catch (e) {}
    });

    await step('Step 3/5: Applying a few instant fixes…', async () => {
      const fixes = (this.issues || []).slice(0, 5);
      for (const issue of fixes) {
        try { typeof issue.fix === 'function' && issue.fix(); } catch (e) {}
      }
    }, 1400);

    await step('Step 4/5: Exporting fixes to a shareable macro…', async () => {
      try {
        const json = this.exportFixes();
        // store in window for quick replay in the same session
        window.__uiCopilotLastExport = json;
      } catch (e) {}
    }, 1000);

    await step('Step 5/5: Replay macro after reload (optional)…', () => {}, 1000);

    overlay.textContent = 'Demo complete! Open DevTools → UI Copilot/Design Tokens for more.';
    setTimeout(() => overlay.remove(), 3500);
  }

  // === Token Aliases (per-domain) ===
  async getDomainKey() {
    try {
      return location.origin || location.hostname || 'global';
    } catch (e) {
      return 'global';
    }
  }

  async loadTokenAliases() {
    try {
      const key = await this.getDomainKey();
      const store = await chrome.storage.local.get([`tokenAliases:${key}`]);
      this.tokenAliases = store[`tokenAliases:${key}`] || {};
    } catch (e) {
      this.tokenAliases = {};
    }
  }

  async saveTokenAliases() {
    try {
      const key = await this.getDomainKey();
      const payload = {};
      payload[`tokenAliases:${key}`] = this.tokenAliases;
      await chrome.storage.local.set(payload);
      return true;
    } catch (e) {
      return false;
    }
  }

  async setTokenAlias(aliasName, cssVarName) {
    if (!aliasName || !cssVarName) return false;
    const normalized = String(aliasName).toLowerCase();
    const varName = cssVarName.startsWith('--') ? cssVarName : `--${cssVarName}`;
    this.tokenAliases[normalized] = varName;
    return this.saveTokenAliases();
  }

  async removeTokenAlias(aliasName) {
    if (!aliasName) return false;
    const normalized = String(aliasName).toLowerCase();
    delete this.tokenAliases[normalized];
    return this.saveTokenAliases();
  }

  async listTokenAliases() {
    await this.loadTokenAliases();
    return this.tokenAliases;
  }
}

const uiCopilot = new UICopilot();
window.uiCopilot = uiCopilot; // Make globally accessible