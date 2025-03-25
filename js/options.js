
document.getElementById('saveButton').addEventListener('click', () => {
  const apiKey = document.getElementById('apiKeyInput').value;
  const modelName = document.querySelector('input[name="models"]').value;

  if (apiKey) {
    // Save API key and model name in chrome.storage.local
    chrome.storage.local.set({ apiKey, modelName }, () => {
      document.getElementById('status').textContent = 'API Key and Model Name saved!';
    });
  } else {
    document.getElementById('status').textContent = 'Please enter a valid API Key';
  }
});

// Retrieve and display the API key and model name if they exist
chrome.storage.local.get(['apiKey', 'modelName'], (result) => {
  if (result.apiKey) {
    document.getElementById('apiKeyInput').value = result.apiKey;
  }
  if (result.modelName) {
    document.querySelector('input[name="models"]').value = result.modelName;
  }
});





// List of models that support generateContent:
// models/gemini-1.0-pro-latest
// models/gemini-1.0-pro
// models/gemini-pro
// models/gemini-1.0-pro-001
// models/gemini-1.0-pro-vision-latest
// models/gemini-pro-vision
// models/gemini-1.5-pro-latest
// models/gemini-1.5-pro-001
// models/gemini-1.5-pro-002
// models/gemini-1.5-pro
// models/gemini-1.5-pro-exp-0801
// models/gemini-1.5-pro-exp-0827
// models/gemini-1.5-flash-latest
// models/gemini-1.5-flash-001
// models/gemini-1.5-flash-001-tuning
// models/gemini-1.5-flash
// models/gemini-1.5-flash-exp-0827
// models/gemini-1.5-flash-002
// models/gemini-1.5-flash-8b
// models/gemini-1.5-flash-8b-001
// models/gemini-1.5-flash-8b-latest
// models/gemini-1.5-flash-8b-exp-0827
// models/gemini-1.5-flash-8b-exp-0924
// models/gemini-2.0-flash-exp
// models/gemini-exp-1206
// models/gemini-exp-1121
// models/gemini-exp-1114
// models/gemini-2.0-flash-thinking-exp
// models/gemini-2.0-flash-thinking-exp-1219
// models/learnlm-1.5-pro-experimental