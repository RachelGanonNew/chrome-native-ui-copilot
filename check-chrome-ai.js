// Chrome AI Diagnostic Script
console.log('🔍 Chrome AI Diagnostic Starting...');

// Check Chrome version
console.log('Chrome Version:', navigator.userAgent);

// Check if we're in the right Chrome
const isCanary = navigator.userAgent.includes('Chrome') && window.location.protocol !== 'chrome-extension:';
console.log('Using Chrome Canary/Dev:', isCanary ? '✅' : '❌ Use Chrome Canary or Dev');

// Check window.ai step by step
console.log('1. Checking window.ai...');
if (typeof window.ai === 'undefined') {
  console.error('❌ window.ai is undefined');
  console.log('Solutions:');
  console.log('- Make sure you are using Chrome Canary or Chrome Dev (not regular Chrome)');
  console.log('- Go to chrome://flags/#optimization-guide-on-device-model');
  console.log('- Set to "Enabled BypassPerfRequirement"');
  console.log('- Go to chrome://flags/#prompt-api-for-gemini-nano');
  console.log('- Set to "Enabled"');
  console.log('- Restart Chrome COMPLETELY (close all windows)');
} else {
  console.log('✅ window.ai exists');
  
  console.log('2. Checking window.ai.languageModel...');
  if (typeof window.ai.languageModel === 'undefined') {
    console.error('❌ window.ai.languageModel is undefined');
    console.log('The Prompt API flag may not be enabled correctly');
  } else {
    console.log('✅ window.ai.languageModel exists');
    
    console.log('3. Testing capabilities...');
    window.ai.languageModel.capabilities().then(caps => {
      console.log('✅ Capabilities:', caps);
      if (caps.available === 'readily') {
        console.log('🎉 AI is ready to use!');
      } else if (caps.available === 'after-download') {
        console.log('📥 AI model will download when first used');
      } else {
        console.log('❌ AI not available on this device');
      }
    }).catch(err => {
      console.error('❌ Error getting capabilities:', err);
    });
  }
}