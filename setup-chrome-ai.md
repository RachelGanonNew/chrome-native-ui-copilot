# Chrome AI Setup Instructions

## Step 1: Install Chrome Canary or Chrome Dev
- Download Chrome Canary: https://www.google.com/chrome/canary/
- Or Chrome Dev: https://www.google.com/chrome/dev/

## Step 2: Enable Required Flags

### Method 1: Manual Setup
1. Open Chrome Canary/Dev
2. Go to `chrome://flags/#optimization-guide-on-device-model`
3. Set to **"Enabled BypassPerfRequirement"**
4. Go to `chrome://flags/#prompt-api-for-gemini-nano`  
5. Set to **"Enabled"**
6. **Restart Chrome completely**

### Method 2: Command Line (Windows)
```cmd
"C:\Users\%USERNAME%\AppData\Local\Google\Chrome SxS\Application\chrome.exe" --enable-features=OptimizationGuideOnDeviceModel:bypass_perf_requirement/true,PromptAPIForGeminiNano
```

## Step 3: Verify AI is Working
1. Open Chrome DevTools (F12)
2. Go to Console tab
3. Run this command:
```javascript
(await ai.languageModel.capabilities()).available
```

**Expected Results:**
- `"readily"` = AI is ready to use ✅
- `"after-download"` = AI will download when first used ⏳
- `"no"` = AI not available on this device ❌

## Step 4: Test the Extension
1. Load the extension in `chrome://extensions/`
2. Enable "Developer mode"
3. Click "Load unpacked" and select the `chrome-ui-copilot` folder
4. Navigate to any webpage
5. Click the 🤖 extension icon
6. Click "Scan" to test

## Troubleshooting

### If you get "ai is not defined":

**CRITICAL: You MUST use Chrome Canary or Chrome Dev - regular Chrome won't work!**

1. **Download the right Chrome:**
   - Chrome Canary: https://www.google.com/chrome/canary/
   - Chrome Dev: https://www.google.com/chrome/dev/

2. **Check you're using the right browser:**
   - Look at the icon - should say "Canary" or "Dev"
   - Check chrome://version/ - should show "canary" or "dev"

3. **Enable flags in the RIGHT browser:**
   - Open Chrome Canary/Dev (not regular Chrome)
   - chrome://flags/#optimization-guide-on-device-model → "Enabled BypassPerfRequirement"
   - chrome://flags/#prompt-api-for-gemini-nano → "Enabled"

4. **Restart completely:**
   - Close ALL Chrome windows (including regular Chrome)
   - Reopen only Chrome Canary/Dev

5. **Test with diagnostic:**
   ```javascript
   // Copy and paste this in DevTools Console:
   console.log('Chrome:', navigator.userAgent.includes('Chrome'));
   console.log('AI available:', typeof window.ai !== 'undefined');
   ```

### If AI status shows ❌:
1. Your device may not support Gemini Nano
2. Try the "BypassPerfRequirement" flag
3. The extension will work in fallback mode (basic detection only)

### If Auto-fix does nothing:
1. First click "Scan" to detect issues
2. Then try "Auto-fix all" 
3. Check the browser console for error messages

## Alternative: Test AI Manually
Open DevTools console and run:
```javascript
// Load the test script
const script = document.createElement('script');
script.src = chrome.runtime.getURL('test-ai.js');
document.head.appendChild(script);
```