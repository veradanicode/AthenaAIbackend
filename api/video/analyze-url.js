import axios from 'axios';
import fs from 'fs';
import path from 'path';
import { analyzeVideoFile } from './yourExistingAnalyzeFunction'; // refactor your current logic to reusable fn

export const analyzeVideoFromUrl = async (req, res) => {
  const { videoUrl } = req.body;

  if (!videoUrl) {
    return res.status(400).json({ message: 'Video URL is required' });
  }

  try {
    // Download video to temp file
    const tempPath = path.join(__dirname, 'tempVideo.mp4');
    const writer = fs.createWriteStream(tempPath);

    const response = await axios({
      url: videoUrl,
      method: 'GET',
      responseType: 'stream',
    });

    response.data.pipe(writer);

    await new Promise((resolve, reject) => {
      writer.on('finish', resolve);
      writer.on('error', reject);
    });

    // Analyze video file using your existing logic (refactor your current analyzeVideo code to a function)
    const result = await analyzeVideoFile(tempPath);

    // Delete temp file
    fs.unlinkSync(tempPath);

    res.json(result);
  } catch (error) {
    console.error('Error processing video from URL:', error);
    res.status(500).json({ message: 'Failed to process video from URL', error: error.message });
  }
};
