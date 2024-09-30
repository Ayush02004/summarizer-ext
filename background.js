chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "getTranscript") {
    const { url } = request;
    getTranscript(url).then(transcript => {
      sendResponse({ transcript });
    }).catch(error => {
      sendResponse({ error: error.message });
    });
    return true; // Keep the message channel open for sendResponse
  }
});

import { YoutubeTranscript } from './lib/youtube-transcript.mjs';

async function getTranscript(url) {
  try {
    const transcript = await YoutubeTranscript.fetchTranscript(url);
    return transcript;
  } catch (error) {
    console.error('Error fetching transcript:', error);
    throw error;
  }
}