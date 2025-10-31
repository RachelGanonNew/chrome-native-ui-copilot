// Gemini Nano Hardware Requirements Checker
console.log('💻 Gemini Nano Hardware Requirements Check');
console.log('='.repeat(50));

// CPU Check
const cores = navigator.hardwareConcurrency;
console.log('CPU Cores:', cores);
console.log('CPU Requirement:', cores >= 4 ? '✅ Pass (4+ cores)' : '❌ Fail (need 4+ cores)');

// Memory Check  
const memory = navigator.deviceMemory;
console.log('RAM:', memory ? `${memory}GB` : 'Unknown');
console.log('RAM Requirement:', memory >= 4 ? '✅ Pass (4GB+)' : memory ? '❌ Fail (need 4GB+)' : '⚠️ Unknown');

// Platform Check
const platform = navigator.platform;
console.log('Platform:', platform);
console.log('Platform Support:', platform.includes('Win') ? '✅ Windows supported' : '⚠️ Check compatibility');

// Chrome Version
const chromeVersion = navigator.userAgent.match(/Chrome\/(\d+)/)?.[1];
console.log('Chrome Version:', chromeVersion);
console.log('Version Requirement:', chromeVersion >= 131 ? '✅ Pass (131+)' : '❌ Need Chrome 131+');

// Overall Assessment
const cpuOk = cores >= 4;
const ramOk = !memory || memory >= 4;
const chromeOk = chromeVersion >= 131;

console.log('\n📊 Overall Assessment:');
if (cpuOk && ramOk && chromeOk) {
  console.log('✅ Your hardware SHOULD support Gemini Nano');
  console.log('If AI still not working, it may be:');
  console.log('- Regional availability issue');
  console.log('- Model still downloading');
  console.log('- Chrome flags not properly set');
} else {
  console.log('❌ Hardware may not meet requirements');
  console.log('Missing requirements:');
  if (!cpuOk) console.log('- Need 4+ CPU cores');
  if (!ramOk) console.log('- Need 4GB+ RAM');
  if (!chromeOk) console.log('- Need Chrome 131+');
}

// Additional checks
console.log('\n🔍 Additional Info:');
console.log('GPU:', navigator.gpu ? 'WebGPU available' : 'No WebGPU');
console.log('Language:', navigator.language);
console.log('Timezone:', Intl.DateTimeFormat().resolvedOptions().timeZone);