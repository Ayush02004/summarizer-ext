document.addEventListener('DOMContentLoaded', () => {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const activeTab = tabs[0];
    chrome.scripting.executeScript({
      target: { tabId: activeTab.id },
      function: getCurrentVideoUrl
    }, (results) => {
      if (chrome.runtime.lastError) {
        console.error('Script execution failed:', chrome.runtime.lastError);
        displayError(`Script execution failed: ${chrome.runtime.lastError.message}`);
        return;
      }

      if (!results || results.length === 0 || !results[0].result) {
        console.error('No results returned from script execution');
        displayError('No results returned from script execution');
        return;
      }

      const url = results[0].result.url;
      chrome.runtime.sendMessage({ action: "getTranscript", url }, (response) => {
        const transcriptDiv = document.getElementById('transcript');
        if (response.error) {
          transcriptDiv.textContent = `Error: ${response.error}`;
        } else {
          const transcript = response.transcript.map(item => item.text).join('\n');
          transcriptDiv.textContent = transcript;
        }
      });
    });
  });
});

function getCurrentVideoUrl() {
  return { url: window.location.href };
}

function displayError(message) {
  const transcriptDiv = document.getElementById('transcript');
  transcriptDiv.textContent = message;
}