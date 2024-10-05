import { YouTubeTranscriptEnhancer } from './transcript.js';
import { GoogleGenerativeAI } from "@google/generative-ai";
import {marked} from "marked";

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "getTranscript") {
    const { url } = request;
    const enhancer = new YouTubeTranscriptEnhancer(url);
    enhancer.enhance_transcript().then(transcript => {
      // console.log('Enhanced Transcript:', transcript);
      // console.log('typeof transcript:', typeof transcript);
      sendResponse({ transcript });
    }).catch(error => {
      console.error('Error enhancing transcript:', error);
      sendResponse({ error: error.message });
    });
    return true; // Keep the message channel open for sendResponse
  }
});

export {GoogleGenerativeAI};
export {marked};