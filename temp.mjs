import { YoutubeTranscript } from './lib/youtube-transcript.mjs';

async function getTranscript(url) {
    try {
        const transcript = await YoutubeTranscript.fetchTranscript(url);
        console.log(transcript);
        return transcript;
    } catch (error) {
        console.error('Error fetching transcript:', error);
        return null;
    }
}

const url = 'https://www.youtube.com/watch?v=NcXR_2w6Tn0'; // Replace with a valid YouTube URL
getTranscript(url);

console.log("hello world");