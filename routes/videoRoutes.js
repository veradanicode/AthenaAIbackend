import express from 'express';
const router = express.Router();
import multer from 'multer';
import path from 'path';
import { analyzeVideo, analyzeVideoUrl} from '../controllers/videoControllers.js';

// Storage setup
const storage = multer.diskStorage({
  destination: './uploads/',
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});

const upload = multer({ storage });

// Route: POST /api/video/analyze
router.post('/analyze', upload.single('video'), analyzeVideo); //for file upload
router.post('/analyze-url', analyzeVideoUrl) //for url upload
export default router;
