// Advanced AI troubleshooting for Chrome Canary 143+
console.log('🔧 Advanced AI Troubleshooting');

// Check all possible AI APIs
const aiAPIs = [
  'window.ai',
  'window.chrome?.ai', 
  'navigator.ml',
  'window.ml'
];

aiAPIs.forEach(api => {
  try {
    const value = eval(api);
    console.log(`${api}:`, typeof value !== 'undefined' ? '✅ Available' : '❌ Missing');
  } catch (e) {
    console.log(`${api}: ❌ Error -`, e.message);
  }
});

// Check Chrome internal flags
console.log('\n🏁 Chrome Internal Status:');
console.log('chrome.runtime:', typeof chrome?.runtime !== 'undefined' ? '✅' : '❌');

// Regional/Device compatibility check
console.log('\n🌍 Compatibility Check:');
console.log('Language:', navigator.language);
console.log('Platform:', navigator.platform);
console.log('Hardware:', navigator.hardwareConcurrency, 'cores');
console.log('Memory:', navigator.deviceMemory || 'unknown', 'GB');

// Suggest workarounds
console.log('\n💡 Workarounds to try:');
console.log('1. Wait 5-10 minutes after enabling flags (model download)');
console.log('2. Try chrome://flags/#enable-experimental-web-platform-features → Enabled');
console.log('3. Launch with: --enable-experimental-web-platform-features');
console.log('4. Clear Chrome data: chrome://settings/clearBrowserData');
console.log('5. Try different website (some sites block AI API)');

// Test if extension works without AI
console.log('\n🛠️ Extension Status:');
console.log('Extension will work in FALLBACK MODE without AI');
console.log('Basic UI detection still available for:');
console.log('- Contrast issues');
console.log('- Layout problems'); 
console.log('- Mobile responsiveness');
console.log('- Accessibility violations');