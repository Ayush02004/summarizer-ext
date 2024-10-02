import { YoutubeTranscript } from 'youtube-transcript';
import he from 'he';
import { convert } from 'html-to-text';
import youtubedl from 'youtube-dl-exec';

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
    const plainTextTranscript = decodedTranscript.map(item => ({
      ...item,
      text: convertHtmlToPlainText(item.text)
    }));
    return plainTextTranscript;
  } catch (error) {
    console.error('Error fetching transcript:', error);
    throw error;
  }
}

function convertHtmlToPlainText(html) {
  return convert(html, {
    wordwrap: 130
  });
}

async function get_metadata(url) {
  try {
    const output = await youtubedl(url, {
      dumpSingleJson: true
    });

    // Return video title and chapters
    return {
      title: output.title,
      chapters: output.chapters || []
    };

  } catch (err) {
    console.error('Error:', err);
    throw err;
  }
}