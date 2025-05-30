// routes/quizProgressRoutes.js
import express from 'express';
import QuizProgress from '../models/quizProgress.js';

const router = express.Router();

// Save a new result
router.post('/', async (req, res) => {
  try {
    const { score, total, date } = req.body;
    const entry = await QuizProgress.create({ score, total, date });
    res.status(201).json(entry);
  } catch (err) {
    res.status(500).json({ message: 'Could not save progress', error: err.message });
  }
});

// Get all results
router.get('/', async (req, res) => {
  try {
    const entries = await QuizProgress.find().sort({ date: -1 });
    res.json({ progress: entries });
  } catch (err) {
    res.status(500).json({ message: 'Could not retrieve progress', error: err.message });
  }
});

export default router;
