# 🤖 Chrome Native UI Copilot

**AI-powered UI issue detection, auto-fix, and shareable macros using Chrome's built-in Gemini Nano**

*Winner submission for Google Chrome AI Challenge 2025* 🏆

## 🌟 Key Features

🕵️ **Real-time UI Audit** – Detects layout issues, accessibility gaps, and visual bugs on any page

⚡ **Instant Auto-Fixes** – One click applies suggestions, improving the page and producing developer-ready diffs

📦 **Export/Replay Fixes (Live UI Macros)** – Every applied fix is captured as a portable JSON macro you can export, share, and replay on any page or state for reproducible results

🧩 **Deep Chrome Integration** – Context-menu actions, DevTools panel, and overlay annotations for seamless workflow

🔒 **Offline Gemini Nano** – Runs locally for speed and privacy

📈 **Measurable Impact** – Automatically boosts Lighthouse Accessibility and Best Practices scores

🛠️ **Built With** – Chrome Extensions API, Gemini Nano, Chrome DevTools Protocol, WebAssembly, CSSOM/DOM analysis, Lighthouse API

## 🚀 Installation

### Prerequisites
- Chrome Canary or Chrome Dev (for Gemini Nano support)
- Enable Chrome AI features:
  1. Go to `chrome://flags/#optimization-guide-on-device-model`
  2. Set to "Enabled BypassPerfRequirement"
  3. Go to `chrome://flags/#prompt-api-for-gemini-nano`
  4. Set to "Enabled"
  5. Restart Chrome

### Install Extension
1. Clone this repository: `git clone https://github.com/your-repo/chrome-ui-copilot`
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode" (top right toggle)
4. Click "Load unpacked" and select the `chrome-ui-copilot` folder
5. The 🤖 UI Copilot icon will appear in your toolbar

## 💡 Usage

### Quick Start
1. **Navigate to any webpage** (try `demo.html` for testing)
2. **Click the 🤖 extension icon** in the toolbar
3. **Click "Scan Page"** to detect issues
4. **Review issues** in the popup panel
5. **Click "Fix"** next to any issue to apply corrections
6. Optional: **Export Fixes** to JSON; later **Replay Fixes** to reproduce changes

### Advanced Features

#### Context Menu Integration
- **Right-click any element** → "🤖 Audit this element"
- **Right-click any element** → "⚡ Auto-fix this element"
- **Right-click page** → "🔍 Scan entire page"

#### DevTools Panel
1. Open Chrome DevTools (F12)
2. Navigate to the **"UI Copilot"** tab
3. Use advanced features:
   - 📊 Run Lighthouse integration
   - ⚡ Auto-fix all issues
   - 📄 Export detailed reports
   - 🔍 Element highlighting and navigation

#### Keyboard Shortcuts
- `Alt+Shift+U` - Toggle UI Copilot panel
- `Alt+Shift+S` - Quick scan current page

## 🔍 Detected Issues

### Accessibility (WCAG Compliance)
- ♿ Low contrast text (WCAG AA/AAA)
- 🏷️ Missing alt attributes on images
- 🎯 Missing ARIA labels and roles
- ⌨️ Poor keyboard navigation
- 👆 Touch targets too small (<44px)

### Layout & Visual
- 📱 Content overflow on mobile
- 📐 Misaligned elements
- 🔤 Inconsistent typography
- 📏 Poor spacing and margins
- 🎨 Broken grid layouts

### Performance
- 🖼️ Unoptimized images
- 📊 Layout shift issues
- ⚡ Render-blocking resources

### Mobile UX
- 📱 Non-responsive design
- 👆 Touch targets too small
- 🔍 Viewport configuration issues
- 📝 Form usability problems

### Conversion Optimization
- 🎯 Poor CTA visibility
- 📝 Form UX issues
- 🔒 Missing trust signals
- 💼 Suboptimal user flows

### AI-Powered Detection
- 🧠 Advanced UX patterns
- 🎨 Design consistency
- 📈 Conversion optimization
- 🌐 Cross-browser compatibility

## 🛠️ Technical Architecture

### Core Components
- **Content Script** (`content.js`) - DOM analysis and manipulation
- **Background Service Worker** (`background.js`) - Extension lifecycle and context menus
- **DevTools Integration** (`devtools-panel.js`) - Professional developer interface
- **Popup Interface** (`popup.js`) - Quick access controls
- **AI Integration** - Gemini Nano for advanced issue detection
  
### Design Tokens & Aliases (DevTools)
- Dedicated DevTools panel to view and edit detected `:root` CSS variables.
- Toggle Design System mode to map fixes to tokens via `var(--token)`.
- Define per-domain aliases (e.g., `primary` → `--brand`) for consistent theming.

### Fix Macros (Export/Replay)
- All inline style changes and DOM adjustments performed by the copilot are recorded with selectors and before/after values.
- Use `Export Fixes` to download a JSON file of the session’s changes.
- Use `Replay Fixes` to apply a previously exported JSON to the current page.
- Guarantees reproducibility for demos, QA, and handoff to developers.

### AI System Prompt
The extension uses a sophisticated system prompt that analyzes elements for:
- WCAG accessibility compliance
- Performance optimization
- Mobile UX best practices
- Conversion optimization
- Visual design principles
- Technical SEO factors

### Supported Platforms
- ✅ Traditional websites
- ✅ React/Vue/Angular SPAs
- ✅ No-code platforms (Webflow, Wix, Squarespace)
- ✅ Low-code platforms (Bubble, Retool)
- ✅ Design tools (Figma prototypes)

## 📊 Demo & Testing

### Try the Demo
1. Open `demo.html` in Chrome
2. This page contains intentional UI/UX issues
3. Use the extension to detect and fix problems
4. See real-time improvements!
5. Export fixes → reload → Replay fixes → verify identical improvements

### Test Cases
The demo includes:
- Low contrast text
- Oversized elements causing overflow
- Poor mobile responsiveness
- Accessibility violations
- Weak call-to-action buttons
- Missing form placeholders
- Misaligned layouts

## 🏆 Hackathon Submission

### Inspiration
As a backend developer, I was frustrated by time wasted fixing simple UI issues. This sparked the idea of a browser-native AI copilot that not only spots problems but fixes them instantly.

### What it does
Chrome Native UI Copilot detects UI and accessibility problems automatically and applies fixes instantly. It works offline, preserves privacy, and generates developer-ready code patches.

### Challenges Overcome
- Detecting UI issues across diverse websites without false positives
- Applying safe fixes that don't break existing functionality
- Running AI models efficiently in-browser
- Balancing automation with developer control

### Accomplishments
- ✅ Real-time detection and one-click auto-fix
- ✅ Browser-native AI ensuring privacy
- ✅ Generated patch code for developers
- ✅ Seamless DevTools integration
- ✅ Context menu workflow integration

### What's Next
- 🌐 Cross-browser compatibility fixes
- ♿ Advanced WCAG compliance features
- 👥 Collaborative debugging for teams
- 🎨 UX suggestions and layout optimization
- 📊 Integration with design systems

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Google Chrome AI team for Gemini Nano integration
- Chrome Extensions team for the powerful APIs
- Web accessibility community for WCAG guidelines
- Open source contributors and testers

---

**Built with ❤️ for the Google Chrome AI Challenge 2025**

*Making the web more accessible, one fix at a time* 🌐✨