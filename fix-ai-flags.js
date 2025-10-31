// Check current AI status and provide exact fix
console.log('🔧 AI Flags Diagnostic');
console.log('Current status:', typeof window.ai !== 'undefined' ? '✅ AI Available' : '❌ AI Missing');

if (typeof window.ai === 'undefined') {
  console.log('🚨 SOLUTION: You need to enable the missing flags:');
  console.log('');
  console.log('1. Go to: chrome://flags/#optimization-guide-on-device-model');
  console.log('   Set to: "Enabled BypassPerfRequirement"');
  console.log('');
  console.log('2. Go to: chrome://flags/#prompt-api-for-gemini-nano');
  console.log('   Set to: "Enabled"');
  console.log('');
  console.log('3. Restart Chrome Canary completely');
  console.log('');
  console.log('OR launch with this command:');
  console.log('"C:\\Users\\USER\\AppData\\Local\\Google\\Chrome SxS\\Application\\chrome.exe" --enable-features=OptimizationGuideOnDeviceModel:bypass_perf_requirement/true,PromptAPIForGeminiNano');
}