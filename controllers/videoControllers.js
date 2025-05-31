import fs from 'fs';
import path from 'path';
import https from 'https';
import http from 'http';
import ffmpeg from 'fluent-ffmpeg';
import { MistralClient } from '@mistralai/mistralai'; 
import { AssemblyAI } from 'assemblyai';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import youtubedl from 'yt-dlp-exec';
import dotenv from "dotenv";
dotenv.config();

const mistralClient = new MistralClient(process.env.MISTRAL_API_KEY); 

const assemblyaiClient = new AssemblyAI({
  apiKey: process.env.ASSEMBLYAI_API_KEY, 
});

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);


const ytDlpPath = path.resolve('./node_modules/youtube-dl-exec/bin/yt-dlp'); // Changed .exe to assume Linux binary if present

async function downloadYoutubeVideo(url, dest) {
  console.log(`Attempting to download YouTube video from ${url} to ${dest}`);
  try {
    await youtubedl(url, {
      output: dest,
      noCheckCertificates: true,
      noWarnings: true,
      preferFreeFormats: true,
      
    });
    console.log(`Successfully downloaded YouTube video to ${dest}`);
  } catch (error) {
    console.error(`Error in downloadYoutubeVideo for ${url}:`, error.message);
    throw new Error(`YouTube download failed: ${error.message}. Ensure yt-dlp is installed and accessible.`);
  }
}

async function downloadVideo(url, dest) {
  console.log(`Attempting to download video from ${url} to ${dest}`);
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    const protocol = url.startsWith('https') ? https : http;

    protocol.get(url, (response) => {
      if (response.statusCode !== 200) {
        fs.unlink(dest, () => reject(new Error(`Failed to get '${url}' (${response.statusCode})`)));
        return;
      }
      response.pipe(file);
      file.on('finish', () => {
        file.close(() => {
          console.log(`Successfully downloaded video to ${dest}`);
          resolve();
        });
      });
    }).on('error', (err) => {
      fs.unlink(dest, () => reject(new Error(`Download failed for '${url}': ${err.message}`)));
    });
  });
}

// Retry wrapper
async function retry(fn, retries = 3, delay = 2000) {
  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (err) {
      console.warn(`Attempt ${i + 1}/${retries} failed: ${err.message}`);
      if (i === retries - 1) throw err; 
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
}



async function processAudioAndTranscribe(videoFilePath, audioOutputFilePath) {
  console.log(`Extracting audio from ${videoFilePath} to ${audioOutputFilePath}`);
  await new Promise((resolve, reject) => {
    ffmpeg(videoFilePath)
      .noVideo()
      .audioCodec('libmp3lame')
      .save(audioOutputFilePath)
      .on('end', () => {
        console.log('Audio extraction complete.');
        resolve();
      })
      .on('error', (err) => {
        console.error('FFmpeg error during audio extraction:', err);
        reject(new Error(`FFmpeg audio extraction failed: ${err.message}. Ensure ffmpeg is installed and accessible.`));
      });
  });

  console.log("Starting audio transcription with AssemblyAI...");
  let transcriptResponse;
  try {
    transcriptResponse = await retry(async () => {
      return awaitassemblyaiClient.transcribe({
        audio_url: fs.createReadStream(audioOutputFilePath), 
      });
    }, 3, 3000);
    console.log("AssemblyAI transcription successful.");
  } catch (error) {
    console.error(`AssemblyAI transcription failed after retries: ${error.message}`);
    throw new Error(`Transcription failed: ${error.message}`);
  }

  return transcriptResponse.text;
}


export const analyzeVideoUrl = async (req, res) => {
  const { videoUrl } = req.body;
  if (!videoUrl) {
    return res.status(400).json({ message: "No video URL provided" });
  }

  
  const videoPath = path.join(__dirname, 'temp_video.mp4');
  const audioPath = path.join(__dirname, 'temp_audio.mp3');

  try {
    const isYoutubeUrl = (url) => /^(https?\:\/\/)?(www\.youtube\.com|youtu\.?be)\/.+$/.test(url);

    if (isYoutubeUrl(videoUrl)) {
      await downloadYoutubeVideo(videoUrl, videoPath);
    } else {
      await downloadVideo(videoUrl, videoPath);
    }

    const transcript = await processAudioAndTranscribe(videoPath, audioPath);
    console.log('Transcript:', transcript);

    const prompt = `
You are an expert tutor. Based on the transcript below, generate:

1. Five beginner-level multiple-choice quiz questions with options A, B, C, D, and mark the correct answer.
2. A brief summary highlighting all important points but keeping it concise.

Transcript:
${transcript}
`;

    const analysisRes = await mistralClient.chat({ 
      model: 'mistral-medium',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
    });

    const result = analysisRes.choices[0].message.content;
    console.log('Mistral AI analysis successful.');

    res.json({ result });

  } catch (error) {
    console.error('Error in analyzeVideoUrl:', error); 
    res.status(500).json({ message: 'Failed to process video from URL', error: error.message });
  } finally {
    
    [videoPath, audioPath].forEach((file) => {
      if (fs.existsSync(file)) {
        try {
          fs.unlinkSync(file);
          console.log(`Cleaned up ${file}`);
        } catch (unlinkError) {
          console.error(`Failed to unlink ${file}:`, unlinkError.message);
        }
      }
    });
  }
};


export const analyzeVideo = async (req, res) => {
  const videoPath = req.file.path;
  const audioPath = videoPath.replace(path.extname(videoPath), '.mp3');

  try {
    const transcript = await processAudioAndTranscribe(videoPath, audioPath);
    console.log('Transcript:', transcript);

    //  Mistral Chat Analysis for Quiz Questions
    const prompt = `
You are an intelligent AI tutor. Based on the transcript below, generate **5 multiple-choice quiz questions** to test a student's understanding of the content. Each question should have 4 options (A, B, C, D), and the correct answer should be clearly marked.

Transcript:
${transcript}
`;
    const analysisRes = await mistralClient.chat({ 
      model: "mistral-medium", 
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.7,
    });

    const questions = analysisRes.choices[0].message.content;
    console.log('Generated questions:', questions);

    //  Mistral Chat Analysis for Summary
    const summaryPrompt = `
You are an expert summarizer. Based on the transcript below, generate a **brief summary** that captures all the important points clearly and concisely.

Transcript:
${transcript}
`;

    const summaryRes = await mistralClient.chat({
      model: "mistral-medium",
      messages: [{ role: "user", content: summaryPrompt }],
      temperature: 0.5,
    });

    const summary = summaryRes.choices[0].message.content;
    console.log('Generated summary:', summary);

    res.json({
      questions,
      summary
    });

  } catch (err) {
    console.error('Error in analyzeVideo (file upload):', err);
    res.status(500).json({
      message: 'Error analyzing video file',
      error: err.message || err,
    });
  } finally {
    [videoPath, audioPath].forEach((file) => {
      if (fs.existsSync(file)) {
        try {
          fs.unlinkSync(file);
          console.log(`Cleaned up ${file}`);
        } catch (unlinkError) {
          console.error(`Failed to unlink ${file}:`, unlinkError.message);
        }
      }
    });
  }
};
