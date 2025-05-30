import express from 'express';
import multer from 'multer';
import { uploadDocumentAndGenerateQuiz } from '../controllers/quizController.js';

const router = express.Router();
const upload = multer({ dest: 'uploads/' });

router.post('/upload', upload.single('file'), uploadDocumentAndGenerateQuiz);

export default router;
