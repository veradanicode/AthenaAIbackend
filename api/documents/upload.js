import express from 'express';
import multer from 'multer';
import { uploadDocumentAndGenerateQuiz } from '../controllers/quizController.js';

const router = express.Router();
const upload = multer({ dest: 'uploads/' }); // folder where files are saved temporarily

router.post('/upload', upload.single('file'), uploadDocumentAndGenerateQuiz);

export default router;
