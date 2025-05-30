import fs from 'fs';
import path from 'path';
import https from 'https';
import http from 'http';
import ffmpeg from 'fluent-ffmpeg';
import { OpenAI } from 'openai';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import youtubedl from 'yt-dlp-exec';
import dotenv from "dotenv";
dotenv.config();

const openai = new OpenAI({ 
  apiKey: process.env.MISTRAL_API_KEY ,
  timeout: 30000,
});

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const ytDlpPath = path.resolve('./node_modules/youtube-dl-exec/bin/yt-dlp.exe');

async function downloadYoutubeVideo(url, dest) {
  await youtubedl(url, {
    output: dest,
    noCheckCertificates: true,
    noWarnings: true,
    preferFreeFormats: true,
  });
}


async function downloadVideo(url, dest) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    const protocol = url.startsWith('https') ? https : http;

    protocol.get(url, (response) => {
      if (response.statusCode !== 200) {
        return reject(new Error(`Failed to get '${url}' (${response.statusCode})`));
      }
      response.pipe(file);
      file.on('finish', () => {
        file.close(resolve);
      });
    }).on('error', (err) => {
      fs.unlink(dest, () => reject(err));
    });
    
  });
}

// Retry wrapper
async function retry(fn, retries = 3, delay = 2000) {
  try {
    return await fn();
  } catch (err) {
    if (retries > 0) {
      console.warn(`Retrying... (${retries} attempts left)`);
      await new Promise(resolve => setTimeout(resolve, delay));
      return retry(fn, retries - 1, delay);
    } else {
      throw err;
    }
  }
}

export const analyzeVideoUrl = async (req, res) => {
  const { videoUrl } = req.body;
  if (!videoUrl) {
    return res.status(400).json({ message: "No video URL provided" });
  }
  
  // Define these paths at the start of the function scope
  const videoPath = path.join(__dirname, 'temp_video.mp4');
  const audioPath = path.join(__dirname, 'temp_audio.mp3');

  try {
     // 1. Download video file from URL
    console.log("Downloading video from:", videoUrl);
      const isYoutubeUrl = (url) => /^(https?\:\/\/)?(www\.youtube\.com|youtu\.?be)\/.+$/.test(url);

      if (isYoutubeUrl(videoUrl)) {
        try {
          console.log('Detected YouTube URL. Downloading with youtube-dl-exec.');
          await downloadYoutubeVideo(videoUrl, videoPath);
        } catch (error) {
          console.error('Failed to download YouTube video:', error.message);
          return res.status(500).json({ message: 'YouTube download failed', error: error.message });
        }
      } else {
        console.log('Downloading direct video file URL.');
        await downloadVideo(videoUrl, videoPath);
      }




    // 2. Extract audio as mp3 using ffmpeg
    await new Promise((resolve, reject) => {
      ffmpeg(videoPath)
        .noVideo()
        .audioCodec('libmp3lame')
        .save(audioPath)
        .on('end', resolve)
        .on('error', reject);
    });

    // 3. Transcribe audio with OpenAI Whisper
    const transcriptRes = await openai.audio.transcriptions.create({
      file: fs.createReadStream(audioPath),
      model: 'whisper-1',
    });

    const transcript = transcriptRes.text;
    console.log('Transcript:', transcript);

    // 4. Generate quiz questions + summary from transcript using GPT-4
    const prompt = `
You are an expert tutor. Based on the transcript below, generate:

1. Five beginner-level multiple-choice quiz questions with options A, B, C, D, and mark the correct answer.
2. A brief summary highlighting all important points but keeping it concise.

Transcript:
${transcript}
`;

    const analysisRes = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
    });

    const result = analysisRes.choices[0].message.content;

    // 5. Send back the result (quiz + summary)
    res.json({ result });

    
 
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error analyzing video URL", error: error.message });
  }finally {
    // Cleanup temp files if exist
    [videoPath, audioPath].forEach((file) => {
      if (fs.existsSync(file)) fs.unlinkSync(file);
    });
  }
};



export const analyzeVideo = async (req, res) => {
  const videoPath = req.file.path;
  const audioPath = videoPath.replace(path.extname(videoPath), '.mp3');

  ffmpeg(videoPath)
    .output(audioPath)
    .on('end', async () => {
      try {
        // Step 2: Transcribe with retry
    const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
let transcriptRes;
let attempts = 3;

while (attempts > 0) {
  try {
    transcriptRes = await openai.audio.transcriptions.create({
      file: fs.createReadStream(audioPath),
      model: 'whisper-1',
    });
    break; // success, exit the loop
  } catch (error) {
    console.error(`Attempt failed: ${error.message}`);
    attempts--;
    if (attempts === 0) throw error;
    await delay(3000); // wait before retry
  }
}


        const transcript = transcriptRes.text;
        // Step 3: GPT Analysis with retry
const prompt = `
You are an intelligent AI tutor. Based on the transcript below, generate **5 multiple-choice quiz questions** to test a student's understanding of the content. Each question should have 4 options (A, B, C, D), and the correct answer should be clearly marked.

Transcript:
${transcript}
`;
        const analysisRes = await openai.chat.completions.create({
        model: "gpt-4", // or "gpt-3.5-turbo"
        messages: [
          {
            role: "user",
            content: `Generate 5 beginner-level quiz questions based on the following transcript. Include one correct answer for each.\n\nTranscript:\n${transcriptRes.text}`,
          },
        ],
        temperature: 0.7,
      });

      const questions = analysisRes.choices[0].message.content;
      console.log('Generated questions:', questions);


const summaryPrompt = `
You are an expert summarizer. Based on the transcript below, generate a **brief summary** that captures all the important points clearly and concisely.

Transcript:
${transcript}
`;

const summaryRes = await openai.chat.completions.create({
  model: "gpt-4", // or "gpt-3.5-turbo"
  messages: [
    {
      role: "user",
      content: summaryPrompt,
    },
  ],
  temperature: 0.5,
});

const summary = summaryRes.choices[0].message.content;

 res.json({
          questions,
          summary
        });
        fs.unlinkSync(videoPath);
        fs.unlinkSync(audioPath);

      } catch (err) {
        console.error('Analysis error:', err);
        res.status(500).json({
          message: 'Error analyzing video',
          error: err.message || err,
        });
      }
    })
    .on('error', (err) => {
      console.error('FFmpeg error:', err);
      res.status(500).json({ message: 'Error processing video file' });
    })
    .run();
};
