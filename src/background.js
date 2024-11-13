import { YouTubeTranscriptEnhancer } from './transcript.js';
import { GoogleGenerativeAI, HarmBlockThreshold, HarmCategory } from "@google/generative-ai";
import { marked } from "marked";

chrome.action.onClicked.addListener((tab) => {
      chrome.sidePanel.open({ windowId: tab.windowId }).catch((error) => console.error(error));
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "getTranscript") {
    const { url, start_time, end_time } = request;
    // console.log("start time background: ", start_time);
    // console.log("end time background: ", end_time);
    const enhancer = new YouTubeTranscriptEnhancer(url);
    enhancer.enhance_transcript(true, true, true, false, false, start_time, end_time).then(transcript => {
      sendResponse({ transcript });
    }).catch(error => {
      console.error('Error enhancing transcript:', error);
      sendResponse({ error: error.message });
    });
    return true; // Keep the message channel open for sendResponse
  } else if (request.action === 'getVideoTimestamp') {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs.length === 0) {
        console.error('No active tab found');
        sendResponse({ error: 'No active tab found' });
        return;
      }
      const activeTab = tabs[0];
      // console.log('Active Tab:', activeTab);
      if (!activeTab || !activeTab.id) {
        console.error('Active tab is undefined or has no id');
        sendResponse({ error: 'Active tab is undefined or has no id' });
        return;
      }
      chrome.scripting.executeScript({
        target: { tabId: activeTab.id },
        function: () => {
          const video = document.querySelector('video');
          if (video) {
            // console.log('Video found:', video.currentTime);
            return { currentTime: video.currentTime };
          } else {
            return { error: 'No video found' };
          }
        }
      }, (results) => {
        if (chrome.runtime.lastError) {
          console.error('Script execution failed:', chrome.runtime.lastError);
          sendResponse({ error: chrome.runtime.lastError.message });
        } else if (results && results[0] && results[0].result) {
          sendResponse(results[0].result);
        } else {
          console.error('No results returned from script execution');
          sendResponse({ error: 'No results returned from script execution' });
        }
      });
    });
    return true; // Keep the message channel open for sendResponse
  }
});

let state = {};

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === 'getState') {
    sendResponse(state);
  } else if (request.type === 'setState') {
    state = request.state;
    sendResponse({ status: 'success' });
  }
});
export { GoogleGenerativeAI, HarmBlockThreshold, HarmCategory };
export { marked };