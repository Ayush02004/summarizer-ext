import { YoutubeTranscript } from 'youtube-transcript';
import he from 'he';

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "getTranscript") {
    const { url } = request;
    getTranscript(url).then(transcript => {
      console.log('Transcript:', transcript);
      sendResponse({ transcript });
    }).catch(error => {
      console.error('Error fetching transcript:', error);
      sendResponse({ error: error.message });
    });
    return true; // Keep the message channel open for sendResponse
  }
});


async function getTranscript(url) {
  try {
    const transcript = await YoutubeTranscript.fetchTranscript(url);
    const decodedTranscript = transcript.map(item => ({
      ...item,
      text: he.decode(item.text)
    }));
    return decodedTranscript;
  } catch (error) {
    console.error('Error fetching transcript:', error);
    throw error;
  }
}