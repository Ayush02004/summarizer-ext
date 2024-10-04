// import { GoogleGenerativeAI } from "@google/generative-ai";

document.addEventListener('DOMContentLoaded', () => {
  const summarizeButton = document.getElementById('summarize');
  
  summarizeButton.addEventListener('click', () => {
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
          // console.log('Response:', response);
          if (response.error) {
            transcriptDiv.textContent = `Error: ${response.error}`;
          } else {
            if (typeof response.transcript === 'string') {
              transcriptDiv.textContent = response.transcript;
            } else if (Array.isArray(response.transcript)) {
              const transcript = response.transcript.map(item => item.text).join('\n');
              transcriptDiv.innerHTML = transcript;
            } else {
              transcriptDiv.textContent = 'Unexpected response format';
            }
          }
        });
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



function initializeModel() {
  const genAI = new GoogleGenerativeAI(process.env.API_KEY);
  const model = genAI.getGenerativeModel({ 
    model: "gemini-1.5-flash",
    systemInstruction: {text: "user will provide you with the transcript of a video and you task is to give the summary of the video. the summary should contain the main topics covered in the video. If a user asks about any questions about the video use the transcript to give an appropriate answer. If segment details for a video are provided you may use them to provide a better summary if you feel the video/transcript is too big. If there are any sponsor you should ignore them unless the user asks about the sponsor."} 
  });
  const chat = model.startChat({
    history: [],
  });
  return chat;
}

async function chatStreaming(chat, query) {

  let result = await chat.sendMessageStream(query);
  for await (const chunk of result.stream) {
    const chunkText = chunk.text();
    console.log(chunkText);
  }
}
