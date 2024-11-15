import { GoogleGenerativeAI, HarmBlockThreshold, HarmCategory, marked } from "../dist/compiled.js";

function getApiKey() {
  return new Promise((resolve, reject) => {
    chrome.storage.local.get(['apiKey'], (result) => {
      if (chrome.runtime.lastError) {
        reject(chrome.runtime.lastError); // Handle any errors
      } else if (result.apiKey) {
        resolve(result.apiKey); // Return the API key if it exists
      } else {
        reject('API key not found'); // Handle missing key
      }
    });
  });
}

function fetchTranscript(start_time, end_time, transcriptDiv) {
  return new Promise((resolve, reject) => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const activeTab = tabs[0];
      chrome.scripting.executeScript({
        target: { tabId: activeTab.id },
        function: getCurrentVideoUrl
      }, (results) => {
        if (chrome.runtime.lastError) {
          console.error('Script execution failed:', chrome.runtime.lastError);
          displayError(`Script execution failed: ${chrome.runtime.lastError.message}`);
          reject(chrome.runtime.lastError);
          return;
        }
        if (!results || results.length === 0 || !results[0].result) {
          console.error('No results returned from script execution');
          displayError('No results returned from script execution');
          reject(new Error('No results returned from script execution'));
          return;
        }
        const url = results[0].result.url;
        chrome.runtime.sendMessage({ action: "getTranscript", url, start_time, end_time }, (response) => {
          if (response.error) {
            transcriptDiv.textContent = `Error: ${response.error}`;
            reject(new Error(response.error));
          } else {
            let transcript;
            if (typeof response.transcript === 'string') {
              transcript = response.transcript;
            } else if (Array.isArray(response.transcript)) {
              transcript = response.transcript.map(item => item.text).join('\n');
            } else {
              transcriptDiv.textContent = 'Unexpected response format';
              reject(new Error('Unexpected response format'));
              return;
            }
            resolve(transcript);
          }
        });
      });
    });
  });
}

async function initializeModel(start_time, end_time, transcriptDiv) {
  let transcript;
  try {
    transcript = await fetchTranscript(start_time, end_time, transcriptDiv);
  } catch (error) {
    console.error('Error fetching transcript:', error);
    return null;
  }
  // console.log("transcript in initializemodel: ", transcript);
  const apiKey = await getApiKey();
  const genAI = new GoogleGenerativeAI(apiKey);
  try {
    const safetySettings = [ 
      { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE }, 
      { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE }, 
      { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE }, 
      { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE }
    ];
    const model = genAI.getGenerativeModel({ 
      model: "gemini-1.5-flash",
      systemInstruction: {
        text: `provided the transcript of a video or the transcript for a segment of a video, your task is to answer the questions based on it. If the user asks about any questions about the video use the transcript to give an appropriate answer. If segment details for a video are provided you may use them to provide a better summary if you feel the video/transcript is too big. If there are any sponsor you should ignore them unless the user asks about the sponsor. transcript: ${transcript}`
      },
      safetySettings
    });
    let chat = model.startChat({
      history: [],
    });
    return chat;
  } catch (error) {
    console.error('Error initializing model:', error);
    displayError(`Error initializing model: ${error}`);
    return null;
  }
}

document.addEventListener('DOMContentLoaded', async () => {
  const summarizeButton = document.getElementById('summarize');
  const queryButton = document.getElementById('queryButton');
  const queryInput = document.getElementById('query');
  const transcriptDiv = document.getElementById('transcript');
  const startTimeDiv = document.getElementById('startTime');
  const endTimeDiv = document.getElementById('endTime');
  const resetTimeButton = document.getElementById('resettime');
  let start_time = null;
  let end_time = null;
  
  optionsButton.addEventListener('click', () => {
    chrome.runtime.openOptionsPage();
  });

  // Initialize the model
  let chat = await initializeModel(start_time, end_time);
  // console.log("chat initialized ", chat);
  if (!chat) {
    console.error('Error initializing model');
    return;
  }

  // Request the current state from the background script
  chrome.runtime.sendMessage({ type: 'getState' }, (response) => {
    if (response) {
      queryInput.value = response.query || '';
      transcriptDiv.innerHTML = response.transcriptHTML || '';
      if (response.summarizeButtonHidden) {
        summarizeButton.style.display = 'none';
      }
    }
  });

  // Add event listener for the reload button
  reloadButton.addEventListener('click', async () => {
    await resetState();
  });

  // Function to reset the state
  async function resetState() {
    queryInput.value = '';
    transcriptDiv.innerHTML = '';
    summarizeButton.style.display = 'block';
    start_time = null;
    end_time = null;
    startTimeDiv.textContent = '';
    endTimeDiv.textContent = '';
    // chat = await initializeModel();
  }


  
  function formatTime(seconds) {
    if (seconds == 0){
      return '0 sec';
    }
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    return `${hrs > 0 ? hrs + ' hr ' : ''}${mins > 0 ? mins + ' min ' : ''}${secs > 0 ? secs + ' sec' : ''}`;
  }

  startTimeButton.addEventListener('click', async () => {
    chrome.runtime.sendMessage({ action: 'getVideoTimestamp' }, async (response) => {
      if (response.error) {
        startTimeDiv.textContent = response.error;
      } else {
        start_time = response.currentTime;
        // console.log("start time popup sdioafoi: ", start_time);
        startTimeDiv.textContent = `Start Time: ${formatTime(start_time)}`;
      }
      if (end_time && start_time){
        chat = await initializeModel(start_time, end_time);
      }
    });
  });

  endTimeButton.addEventListener('click', async () => {
    chrome.runtime.sendMessage({ action: 'getVideoTimestamp' }, async (response) => {
      if (response.error) {
        endTimeDiv.textContent = response.error;
      } else {
        end_time = response.currentTime;
        endTimeDiv.textContent = `End Time: ${formatTime(end_time)}`;
      }
      // console.log("start time: ", start_time, "end time: ", end_time);
  
      if (end_time && start_time) {
        chat = await initializeModel(start_time, end_time, transcriptDiv);
        // console.log("chat in end time button: ", chat);
      }
    });
  });

  resetTimeButton.addEventListener('click', () => {
    start_time = null;
    startTimeDiv.textContent = '';
    end_time = null;
    endTimeDiv.textContent = '';
  });

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
        // console.log("start time popup: ", start_time);
        // console.log("end time popup: ", end_time);
        chrome.runtime.sendMessage({ action: "getTranscript", url, start_time, end_time }, async (response) => {
          if (response.error) {
            transcriptDiv.textContent = `Error: ${response.error}`;
          } else {
            let transcript;
            if (typeof response.transcript === 'string') {
              transcript = response.transcript;
            } else if (Array.isArray(response.transcript)) {
              transcript = response.transcript.map(item => item.text).join('\n');
            } else {
              transcriptDiv.textContent = 'Unexpected response format';
              return;
            }
            chat = await initializeModelold();
            try {
              summarizeButton.style.display = 'none';
              transcriptDiv.innerHTML += '<h2>Summary</h2>'; // Print "Summary" before showing the summary
              await chatStreaming(chat, transcript, transcriptDiv);
            } catch (error) {
              console.error('Error getting summary:', error);
              transcriptDiv.textContent = `Error: ${error.message}`;
            }

            // Update the state in the background script
            const newState = {
              query: queryInput.value,
              transcriptHTML: transcriptDiv.innerHTML,
              summarizeButtonHidden: true,
            };
            chrome.runtime.sendMessage({ type: 'setState', state: newState }, (response) => {
              if (response.status === 'success') {
                // console.log('State updated successfully');
              }
            });
          }
        });
      });
    });
  });

  queryButton.addEventListener('click', async () => {
    const query = queryInput.value.trim();
    if (query) {
      // Clear the query input
      queryInput.value = '';
      queryButton.disabled = true;
      transcriptDiv.innerHTML += `<p><strong>Query:</strong> ${query}</p>`; // Append the query to the transcriptDiv
      try {
        await chatStreaming(chat, query, transcriptDiv); // Get the answer to the query and append it
      } catch (error) {
        console.error('Error getting query response:', error);
        transcriptDiv.innerHTML += `<p>Error: ${error.message}</p>`;
      }


      // Update the state in the background script
      const newState = {
        query: queryInput.value,
        transcriptHTML: transcriptDiv.innerHTML,
        summarizeButtonHidden: summarizeButton.style.display === 'none',
        // chat: chat
      };
      chrome.runtime.sendMessage({ type: 'setState', state: newState }, (response) => {
        if (response.status === 'success') {
          // console.log('State updated successfully');
        }
      });
    }
  });

  queryInput.addEventListener('input', () => {
    queryButton.disabled = queryInput.value.trim() === '';
  });

  queryInput.addEventListener('keypress', (event) => {
    if (event.key === 'Enter' && queryInput.value.trim() !== '') {
      queryButton.click();
    }
  });

  queryButton.disabled = queryInput.value.trim() === '';

});

function getCurrentVideoUrl() {
  return { url: window.location.href };
}

function displayError(message) {
  const transcriptDiv = document.getElementById('transcript');
  transcriptDiv.textContent = message;
}


async function chatStreaming(chat, query, transcriptDiv) {
  let result = await chat.sendMessageStream(query);

  // Create a container for the response
  const responseContainer = document.createElement('span');
  transcriptDiv.appendChild(responseContainer);
  let response = '';
  for await (const chunk of result.stream) {
    const chunkText = await chunk.text();
    response += chunkText;
    // Convert markdown to HTML
    let htmlContent = marked(response);
    responseContainer.innerHTML = htmlContent;
  }
}

async function initializeModelold() {
  try {
    const apiKey = await getApiKey();
    // console.log(apiKey);
    const genAI = new GoogleGenerativeAI(apiKey);
    const safetySettings = [ 
      { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE, }, 
      { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE, }, 
      { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE, }, 
      { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE, }, 
      // { category: HarmCategory.HARM_CATEGORY_UNSPECIFIED, threshold: HarmBlockThreshold.BLOCK_LOW_AND_ABOVE, },
    ];
    const model = genAI.getGenerativeModel({ 
      model: "gemini-1.5-flash-002",
      systemInstruction: {text: "user will provide you with the transcript of a video or the transcript for a segment of a video and your task is to give the summary of the video. the summary should contain the main topics covered in the video. If a user asks about any questions about the video use the transcript to give an appropriate answer. If segment details for a video are provided you may use them to provide a better summary if you feel the video/transcript is too big. If there are any sponsor you should ignore them unless the user asks about the sponsor."},
      safetySettings
    });
    const chat = model.startChat({
      history: [],
    });
    return chat;
  } catch (error) {
    console.error('Error initializing model:', error);
    displayError(`Error initializing model: ${error}`);
    return null;
  }
}