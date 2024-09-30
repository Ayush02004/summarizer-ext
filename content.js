chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "getCurrentVideoUrl") {
    const url = window.location.href;
    sendResponse({ url });
  }
});