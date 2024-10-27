document.getElementById('saveButton').addEventListener('click', () => {
  const apiKey = document.getElementById('apiKeyInput').value;

  if (apiKey) {
    // Save API key in chrome.storage.local
    chrome.storage.local.set({ apiKey }, () => {
      document.getElementById('status').textContent = 'API Key saved!';
    });
  } else {
    document.getElementById('status').textContent = 'Please enter a valid API Key';
  }
});

// Retrieve and display the API key if it exists
chrome.storage.local.get(['apiKey'], (result) => {
  if (result.apiKey) {
    document.getElementById('apiKeyInput').value = result.apiKey;
  }
});
