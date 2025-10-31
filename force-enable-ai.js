// Force enable AI with all possible methods
console.log('🚀 Forcing AI Enable - All Methods');

// Method 1: Check current flags status
console.log('1. Checking current flags...');
fetch('chrome://flags/').then(() => {
  console.log('Go to chrome://flags/ and verify:');
  console.log('- optimization-guide-on-device-model: Enabled BypassPerfRequirement');
  console.log('- prompt-api-for-gemini-nano: Enabled');
}).catch(() => {
  console.log('Manual check: Go to chrome://flags/');
});

// Method 2: Try to trigger model download
console.log('2. Attempting to trigger model download...');
if (typeof window.ai !== 'undefined' && window.ai.languageModel) {
  window.ai.languageModel.capabilities().then(caps => {
    console.log('Capabilities:', caps);
    if (caps.available === 'after-download') {
      console.log('📥 Model needs download - creating session to trigger...');
      return window.ai.languageModel.create();
    }
  }).then(session => {
    if (session) {
      console.log('✅ Session created! AI should be working now.');
      session.destroy();
    }
  }).catch(e => console.log('Download failed:', e));
} else {
  console.log('❌ AI API not available');
}

// Method 3: Alternative launch command
console.log('3. Try launching Chrome with this command:');
console.log('"C:\\Users\\USER\\AppData\\Local\\Google\\Chrome SxS\\Application\\chrome.exe" --enable-features=OptimizationGuideOnDeviceModel:bypass_perf_requirement/true,PromptAPIForGeminiNano,AIPromptAPI --disable-features=OptimizationGuideModelDownloading');

// Method 4: Check if it's a timing issue
console.log('4. Waiting 30 seconds for potential model download...');
setTimeout(() => {
  console.log('Rechecking AI after wait...');
  console.log('AI available:', typeof window.ai !== 'undefined' ? '✅' : '❌');
}, 30000);