// Test Chrome AI API availability
async function testChromeAI() {
  console.log('Testing Chrome AI API...');
  
  try {
    // Check if AI is available
    if (typeof window.ai === 'undefined') {
      console.error('❌ window.ai is not defined');
      console.log('Make sure you have:');
      console.log('1. Chrome Canary or Chrome Dev');
      console.log('2. chrome://flags/#optimization-guide-on-device-model = Enabled BypassPerfRequirement');
      console.log('3. chrome://flags/#prompt-api-for-gemini-nano = Enabled');
      console.log('4. Restarted Chrome');
      return false;
    }
    
    if (!window.ai.languageModel) {
      console.error('❌ window.ai.languageModel is not available');
      return false;
    }
    
    // Check capabilities
    const capabilities = await window.ai.languageModel.capabilities();
    console.log('AI Capabilities:', capabilities);
    
    if (capabilities.available === 'no') {
      console.error('❌ AI model is not available on this device');
      return false;
    }
    
    if (capabilities.available === 'after-download') {
      console.log('📥 AI model needs to be downloaded first...');
      // Try to create session to trigger download
      const session = await window.ai.languageModel.create();
      console.log('✅ AI model downloaded and session created');
      await session.destroy();
      return true;
    }
    
    if (capabilities.available === 'readily') {
      console.log('✅ AI model is readily available');
      const session = await window.ai.languageModel.create();
      console.log('✅ AI session created successfully');
      
      // Test a simple prompt
      const response = await session.prompt('Say "Hello from Gemini Nano!"');
      console.log('AI Response:', response);
      
      await session.destroy();
      return true;
    }
    
  } catch (error) {
    console.error('❌ Error testing AI:', error);
    return false;
  }
}

// Run the test
testChromeAI().then(success => {
  if (success) {
    console.log('🎉 Chrome AI is working correctly!');
  } else {
    console.log('⚠️ Chrome AI is not working. Using fallback mode.');
  }
});