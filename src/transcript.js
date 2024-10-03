// transcript.js
import { YoutubeTranscript } from 'youtube-transcript';
import he from 'he';
import { convert } from 'html-to-text';
// import youtubedl from 'youtube-dl-exec';
import ytdl from 'ytdl-core';

class YouTubeTranscriptEnhancer {
  constructor(video_url) {
    this.video_url = video_url;
    this.transcript = this.get_transcript(this.video_url);
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
    const params = new URLSearchParams({
      videoID: new URL(video_url).searchParams.get('v'),
      category: categories
    });
  
    const response = await fetch(`${url}?${params.toString()}`);
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
            chapter_index++;
          }
          enhanced_transcript.push(text);
        }
      } else {
        enhanced_transcript.push(...this.transcript);
      }
    } else {
      enhanced_transcript.push(...this.transcript);
    }
    this.transcript = enhanced_transcript;
  }

  async enhance_transcript(remove_sponsor = true, remove_selfpromo = true, remove_interaction = true, add_title = true, add_chapters = true) {
    if (!this.video_url) {
      return "";
    }

    if (add_title || add_chapters) {
      await this.add_metadata_to_transcript(add_title, add_chapters);
    }

    const categories = [];
    if (remove_sponsor) categories.push('sponsor');
    if (remove_selfpromo) categories.push('selfpromo');
    if (remove_interaction) categories.push('interaction');

    const segments_to_remove = await this.get_segments(this.video_url, categories);

    this.transcript = this.transcript.filter(text => 
      !segments_to_remove.some(segment => segment.segment[0] <= text.start && text.start <= segment.segment[1])
    ).map(text => text.text).join(" ");

    return this.transcript;
  }
}

function convertHtmlToPlainText(html) {
  return convert(html, {
    wordwrap: 130
  });
}

export { YouTubeTranscriptEnhancer };