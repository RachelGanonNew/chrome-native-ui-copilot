// Complete Chrome verification
console.log('🔍 Complete Chrome Verification');
console.log('='.repeat(50));

// Check version page
console.log('1. Go to chrome://version/ and check:');
console.log('   - Should say "canary" or "dev" in the version string');
console.log('   - Executable path should contain "Chrome SxS" (Canary) or "Chrome Dev"');

// Check user agent
const ua = navigator.userAgent;
console.log('2. User Agent:', ua);
console.log('   Contains "Canary":', ua.includes('Canary') ? '✅' : '❌');
console.log('   Contains "Dev":', ua.includes('Dev') ? '✅' : '❌');

// Check Chrome version number
const chromeVersion = ua.match(/Chrome\/(\d+)/)?.[1];
console.log('3. Chrome Version:', chromeVersion);
console.log('   Expected: 131+ for Canary/Dev, yours:', chromeVersion);

// Check if this might be regular Chrome with custom icon
if (!ua.includes('Canary') && !ua.includes('Dev')) {
  console.log('⚠️ WARNING: This appears to be regular Chrome!');
  console.log('Solutions:');
  console.log('1. Download REAL Chrome Canary: https://www.google.com/chrome/canary/');
  console.log('2. Or try Chrome Dev: https://www.google.com/chrome/dev/');
  console.log('3. Make sure you launch the RIGHT executable');
}

// Regional availability check
console.log('4. Regional Check:');
console.log('   Location:', Intl.DateTimeFormat().resolvedOptions().timeZone);
console.log('   Language:', navigator.language);
console.log('   Note: Gemini Nano should work globally, but some regions may have delays');

// Final AI check
console.log('5. AI Availability:');
console.log('   window.ai exists:', typeof window.ai !== 'undefined' ? '✅' : '❌');
if (typeof window.ai !== 'undefined') {
  console.log('   window.ai.languageModel exists:', typeof window.ai.languageModel !== 'undefined' ? '✅' : '❌');
} else {
  console.log('   🚨 AI not available - likely not using Canary/Dev');
}