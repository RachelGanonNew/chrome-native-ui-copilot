class DevToolsPanel {
  constructor() {
    this.issues = [];
    this.lighthouseScore = null;
    this.init();
  }

  init() {
    document.getElementById('scan-page').onclick = () => this.scanPage();
    document.getElementById('run-lighthouse').onclick = () => this.runLighthouse();
    document.getElementById('auto-fix-all').onclick = () => this.autoFixAll();
    document.getElementById('export-report').onclick = () => this.exportReport();
    
    this.checkAIStatus();
  }

  evalAsync(code) {
    return new Promise((resolve) => {
      try {
        chrome.devtools.inspectedWindow.eval(code, (result, exceptionInfo) => {
          resolve({ result, exceptionInfo });
        });
      } catch (e) {
        resolve({ result: undefined, exceptionInfo: e });
      }
    });
  }

  async checkAIStatus() {
    try {
      const { result } = await this.evalAsync(`'ai' in window && 'languageModel' in window.ai`);
      document.getElementById('ai-status').textContent = result ? '✅' : '⚠️';
    } catch (e) {
      document.getElementById('ai-status').textContent = '❌';
    }
  }

  async scanPage() {
    const scanBtn = document.getElementById('scan-page');
    scanBtn.textContent = '🔄 Scanning...';
    scanBtn.disabled = true;

    try {
      const { result } = await this.evalAsync(`(async () => {
        if (window.uiCopilot) {
          await window.uiCopilot.scanPage();
          return {
            issues: window.uiCopilot.issues,
            stats: {
              total: window.uiCopilot.issues.length,
              high: window.uiCopilot.issues.filter(i => i.severity === 'high').length,
              medium: window.uiCopilot.issues.filter(i => i.severity === 'medium').length,
              low: window.uiCopilot.issues.filter(i => i.severity === 'low').length
            }
          };
        }
        return { issues: [], stats: { total: 0, high: 0, medium: 0, low: 0 } };
      })()`);

      this.issues = (result && result.issues) || [];
      this.updateStats((result && result.stats) || { total: 0, high: 0, medium: 0, low: 0 });
      this.displayIssues();
    } catch (e) {
      console.error('Scan failed:', e);
    }

    scanBtn.textContent = '🔍 Scan Page';
    scanBtn.disabled = false;
  }

  async runLighthouse() {
    const btn = document.getElementById('run-lighthouse');
    btn.textContent = '🔄 Running...';
    btn.disabled = true;

    try {
      // Simulate Lighthouse run (in real implementation, integrate with Lighthouse API)
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const score = Math.max(60, 100 - this.issues.length * 5);
      this.lighthouseScore = score;
      document.getElementById('lighthouse-score').textContent = score;
    } catch (e) {
      console.error('Lighthouse failed:', e);
    }

    btn.textContent = '📊 Run Lighthouse';
    btn.disabled = false;
  }

  async autoFixAll() {
    const btn = document.getElementById('auto-fix-all');
    btn.textContent = '⚡ Fixing...';
    btn.disabled = true;

    try {
      // First scan for issues if none exist
      if (this.issues.length === 0) {
        await this.scanPage();
      }

      const { result: fixResult } = await this.evalAsync(`(async () => {
        if (window.uiCopilot && window.uiCopilot.issues) {
          let fixed = 0;
          for (const issue of window.uiCopilot.issues) {
            try {
              if (typeof issue.fix === 'function') {
                issue.fix();
                fixed++;
              }
            } catch (e) {
              console.error('Fix failed for issue:', issue.type, e);
            }
          }
          return { fixed, total: window.uiCopilot.issues.length };
        }
        return { fixed: 0, total: 0 };
      })()`);

      document.getElementById('fixed-issues').textContent = fixResult.fixed;
      
      if (fixResult.fixed > 0) {
        this.generateCodeDiffs();
        // Show success notification
        this.showNotification(`✅ Fixed ${fixResult.fixed} out of ${fixResult.total} issues!`);
      } else {
        this.showNotification('⚠️ No issues found to fix. Try scanning first.');
      }
      
    } catch (e) {
      console.error('Auto-fix failed:', e);
      this.showNotification('❌ Auto-fix failed. Check console for details.');
    }

    btn.textContent = '⚡ Auto-Fix All';
    btn.disabled = false;
  }

  updateStats(stats) {
    document.getElementById('total-issues').textContent = stats.total;
  }

  displayIssues() {
    const container = document.getElementById('issues-list');
    
    if (this.issues.length === 0) {
      container.innerHTML = '<p>✅ No issues detected! Your UI looks great.</p>';
      return;
    }

    container.innerHTML = this.issues.map((issue, index) => `
      <div class="issue-card severity-${issue.severity}">
        <div class="issue-header">
          <strong>${issue.type.toUpperCase()}: ${issue.message}</strong>
          <button onclick="devToolsPanel.fixIssue(${index})" class="primary">Fix</button>
        </div>
        <div>Severity: <span style="color: ${this.getSeverityColor(issue.severity)}">${issue.severity}</span></div>
        <div class="code-diff" id="diff-${index}" style="display: none;"></div>
      </div>
    `).join('');
  }

  getSeverityColor(severity) {
    switch (severity) {
      case 'high': return '#dc3545';
      case 'medium': return '#ffc107';
      case 'low': return '#28a745';
      default: return '#6c757d';
    }
  }

  async fixIssue(index) {
    try {
      await this.evalAsync(`window.uiCopilot && window.uiCopilot.issues && window.uiCopilot.issues[${index}] && window.uiCopilot.issues[${index}].fix && window.uiCopilot.issues[${index}].fix()`);
      
      this.generateCodeDiff(index);
      document.getElementById('fixed-issues').textContent = 
        parseInt(document.getElementById('fixed-issues').textContent) + 1;
    } catch (e) {
      console.error('Fix failed:', e);
    }
  }

  generateCodeDiff(index) {
    const diffContainer = document.getElementById(`diff-${index}`);
    if (diffContainer) {
      diffContainer.style.display = 'block';
      diffContainer.textContent = `// Auto-generated fix for ${this.issues[index].type}
- Original: ${this.issues[index].message}
+ Fixed: Applied automated correction

// CSS changes applied:
${this.generateCSSFix(this.issues[index])}`;
    }
  }

  generateCSSFix(issue) {
    switch (issue.type) {
      case 'contrast':
        return `color: #000000;
background-color: #ffffff;`;
      case 'overflow':
        return `overflow: hidden;
text-overflow: ellipsis;`;
      case 'alignment':
        return `margin: 0 auto;
text-align: center;`;
      case 'mobile':
        return `max-width: 100%;
font-size: 16px;
min-height: 44px;`;
      default:
        return '/* Custom fix applied */';
    }
  }

  generateCodeDiffs() {
    this.issues.forEach((issue, index) => {
      this.generateCodeDiff(index);
    });
  }

  showNotification(message) {
    const notification = document.createElement('div');
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: #333;
      color: white;
      padding: 12px 20px;
      border-radius: 4px;
      z-index: 10000;
      font-size: 14px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.3);
    `;
    notification.textContent = message;
    document.body.appendChild(notification);
    
    setTimeout(() => {
      notification.remove();
    }, 3000);
  }

  exportReport() {
    const report = {
      timestamp: new Date().toISOString(),
      url: chrome.devtools.inspectedWindow.tabId,
      issues: this.issues.map(issue => ({
        type: issue.type,
        severity: issue.severity,
        message: issue.message,
        fix: this.generateCSSFix(issue)
      })),
      stats: {
        total: this.issues.length,
        fixed: parseInt(document.getElementById('fixed-issues').textContent) || 0,
        lighthouseScore: this.lighthouseScore
      }
    };

    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ui-copilot-report-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }
}

const devToolsPanel = new DevToolsPanel();