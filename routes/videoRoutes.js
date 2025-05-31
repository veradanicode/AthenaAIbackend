import express from 'express';
const router = express.Router();
import multer from 'multer';
import path from 'path';
import { analyzeVideo, analyzeVideoUrl} from '../controllers/videoControllers.js';
import fs from 'fs';

// Ensure uploads directory exists
const uploadsDir = './uploads';
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Storage setup
const storage = multer.diskStorage({
  destination: './uploads/',
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});

const upload = multer({ storage });

// Route: POST /api/video/analyze
router.post('/analyze', upload.single('video'), analyzeVideo); 
router.post('/analyze-url', analyzeVideoUrl) 
export default router;
