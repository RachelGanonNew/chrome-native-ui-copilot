class UICopilot {
  constructor() {
    this.issues = [];
    this.aiSession = null;
    this.init();
  }

  async init() {
    await this.initAI();
    this.createUI();
    this.startScanning();
  }

  async initAI() {
    try {
      if ('ai' in window && 'languageModel' in window.ai) {
        this.aiSession = await window.ai.languageModel.create({
          systemPrompt: `You are an expert UI/UX auditor and Chrome DevTools specialist. Analyze HTML elements for:

1. ACCESSIBILITY: WCAG compliance, contrast ratios, ARIA labels, keyboard navigation
2. PERFORMANCE: Layout shifts, render-blocking, image optimization
3. MOBILE UX: Touch targets, responsive design, viewport issues
4. CONVERSION: CTA placement, form UX, trust signals
5. VISUAL DESIGN: Typography, spacing, alignment, hierarchy
6. TECHNICAL: Semantic HTML, SEO, structured data

Respond with JSON: {
  "issue": "Brief description",
  "severity": "critical|high|medium|low",
  "category": "accessibility|performance|mobile|conversion|visual|technical",
  "fix": "Specific solution",
  "code": "CSS/HTML fix",
  "impact": "User/business impact",
  "wcag": "WCAG guideline if applicable"
}

Focus on actionable, measurable improvements that boost Lighthouse scores.`
        });
        console.log('✅ Gemini Nano AI initialized');
      }
    } catch (e) {
      console.log('⚠️ AI not available, using fallback detection');
    }
  }

  createUI() {
    const panel = document.createElement('div');
    panel.id = 'ui-copilot-panel';
    panel.innerHTML = `
      <div class="copilot-header">
        <span>🤖 UI Copilot</span>
        <button id="copilot-toggle">Scan</button>
        <button id="copilot-close">×</button>
      </div>
      <div class="copilot-content">
        <div id="issues-list">No issues detected</div>
      </div>
    `;
    document.body.appendChild(panel);

    document.getElementById('copilot-toggle').onclick = () => this.scanPage();
    document.getElementById('copilot-close').onclick = () => panel.style.display = 'none';
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
    element.style.maxWidth = '100%';
    element.style.fontSize = Math.max(16, parseInt(getComputedStyle(element).fontSize)) + 'px';
    if (element.tagName === 'BUTTON') element.style.minHeight = '44px';
    this.highlightFixed(element);
  }

  fixConversion(element) {
    if (element.tagName === 'BUTTON') {
      element.style.backgroundColor = '#007bff';
      element.style.color = 'white';
      element.style.padding = '12px 24px';
    }
    if (element.tagName === 'INPUT' && !element.placeholder) {
      element.placeholder = 'Enter ' + (element.name || 'value');
    }
    this.highlightFixed(element);
  }

  fixContrast(element) {
    element.style.color = '#000000';
    element.style.backgroundColor = '#ffffff';
    this.highlightFixed(element);
  }

  fixOverflow(element) {
    element.style.overflow = 'hidden';
    element.style.textOverflow = 'ellipsis';
    this.highlightFixed(element);
  }

  fixAlignment(element) {
    element.style.margin = '0 auto';
    element.style.textAlign = 'center';
    this.highlightFixed(element);
  }

  applyAIFix(element, fixCode) {
    try {
      eval(fixCode);
      this.highlightFixed(element);
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
}

const uiCopilot = new UICopilot();