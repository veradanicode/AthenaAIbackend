import express from 'express';
const router = express.Router();
import authMiddleware from '../middleware/auth.js';
import Course from '../models/Course.js';
import Video from '../models/Video.js';
import Note from '../models/Note.js';

router.get('/', authMiddleware, async (req, res) => {
  const query = req.query.q;
  if (!query) return res.status(400).json({ message: 'Query is required' });

  try {
    const courses = await Course.find({ title: { $regex: query, $options: 'i' } }).limit(5);
    const videos = await Video.find({ title: { $regex: query, $options: 'i' } }).limit(5);
    const notes = await Note.find({ content: { $regex: query, $options: 'i' } }).limit(5);

    res.json({ courses, videos, notes });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
