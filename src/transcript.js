// transcript.js
import { YoutubeTranscript } from 'youtube-transcript';
import he from 'he';
import { convert } from 'html-to-text';
// import youtubedl from 'youtube-dl-exec';
// import ytdl from 'ytdl-core';

class YouTubeTranscriptEnhancer {
  constructor(video_url) {
    this.video_url = video_url;
    this.transcript = null;
    // console.log("constructor")
    // console.log(Array.isArray(this.transcript));
    this.metadata = null; // Metadata will be loaded conditionally (only if it's needed)
  }

  async get_transcript(video_url) {
    try {
      const transcript = await YoutubeTranscript.fetchTranscript(video_url);
      const decodedTranscript = transcript.map(item => ({
        ...item,
        text: he.decode(item.text)
      }));
      const plainTextTranscript = decodedTranscript.map(item => ({
        ...item,
        text: convertHtmlToPlainText(item.text)
      }));
      console.log(Array.isArray(plainTextTranscript));
      return plainTextTranscript;
    } catch (error) {
      console.error('Error fetching transcript:', error);
      throw error;
    }
  }

  async get_metadata(video_url) {
    try {
      const info = await ytdl.getInfo(video_url);
      const { title, chapters } = info.videoDetails;

      // Return video title and chapters
      return {
        title,
        chapters: chapters || []
      };

    } catch (err) {
      console.error('Error:', err);
      throw err;
    }
  }

    async get_segments(video_url, categories) {
    const url = "https://sponsor.ajay.app/api/skipSegments";
    const videoID = new URL(video_url).searchParams.get('v');
    const params = new URLSearchParams({ videoID });
  
    // Append each category separately
    categories.forEach(category => params.append('category', category));
  
    const response = await fetch(`${url}?${params.toString()}`);
    console.log("sponsor Response: ", response);
    if (response.ok) {
      const data = await response.json();
      return data;
    }
    return [];
  }

  async add_metadata_to_transcript(add_title = true, add_chapters = true) {
    if (!this.metadata) {
      this.metadata = await this.get_metadata(this.video_url);
    }

    const enhanced_transcript = [];
    if (add_title) {
      const title = this.metadata.title || '';
      enhanced_transcript.push({ text: `Title of the video: ${title}`, start: 0 });
    }
    if (add_chapters) {
      const chapters = this.metadata.chapters || [];
      if (chapters.length) {
        let chapter_index = 0;
        for (const text of this.transcript) {
          const start_time = text.start;
          while (chapter_index < chapters.length && start_time >= chapters[chapter_index].start_time) {
            const chapter = chapters[chapter_index];
            const segment_header = `Chapter: ${chapter_index + 1} Title: ${chapter.title}`;
            enhanced_transcript.push({ text: segment_header, start: chapter.start_time });
          enhanced_transcript.push(text);
        }  chapter_index++;
          }
          
      } else {
        enhanced_transcript.push(...this.transcript);
      }
    } else {
      enhanced_transcript.push(...this.transcript);
    }
    this.transcript = enhanced_transcript;
  }

    async enhance_transcript(remove_sponsor = true, remove_selfpromo = true, remove_interaction = true, add_title = false, add_chapters = false) {
    if (!this.video_url) {
      return "";
    }
  
    // Fetch the transcript
    this.transcript = await this.get_transcript(this.video_url);
  
    console.log("Before: " + this.transcript.map(item => item.text).join(" "));
  
    // Ensure the transcript is an array
    if (!Array.isArray(this.transcript)) {
      throw new TypeError('this.transcript is not an array');
    }
  
    // Add metadata if required
    if (add_title || add_chapters) {
      await this.add_metadata_to_transcript(add_title, add_chapters);
    }
  
    // Determine which segments to retrieve based on the flags
    const categories = [];
    if (remove_sponsor) categories.push('sponsor');
    if (remove_selfpromo) categories.push('selfpromo');
    if (remove_interaction) categories.push('interaction');
  
    // Get the required segments in a single request
    const segments_to_remove = await this.get_segments(this.video_url, categories);
    // console.log('original transcript:', this.transcript);
    // console.log("Segments to remove: ", segments_to_remove);
  
    // Filter the transcript to remove segments
    const filtered_transcript = [];
    for (const text of this.transcript) {
      let should_remove = false;
      for (const segment of segments_to_remove) {
        const [start, end] = segment.segment;
        // console.log("start: ", start, "end: ", end, "text:", text.text, "text.offset: ", text.offset, "text.end: ", text.duration+text.offset);
        if (text.offset >= start  && text.offset <= end) {
          should_remove = true;
          break;
        }
      }
      if (!should_remove) {
        filtered_transcript.push(text.text);
      }
    }
  
    this.transcript = filtered_transcript.join(" ");
  
    console.log("After: " + this.transcript);
    return this.transcript;
  }
}
function convertHtmlToPlainText(html) {
  return convert(html, {
    wordwrap: 130
  });
}

export { YouTubeTranscriptEnhancer };