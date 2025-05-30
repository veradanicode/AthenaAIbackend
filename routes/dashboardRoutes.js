import express from 'express';
const router = express.Router();
import Activity from '../models/Activity.js';   // add .js extension if needed
import Schedule from '../models/Schedule.js';
import User from '../models/User.js';           // assuming activities are inside user
import authMiddleware from '../middleware/auth.js';  // this ensures only logged-in users can access

router.get('/', authMiddleware, async (req, res) => {
  const { userId } = req.params;

  try {
    const activities = await Activity.find({ userId }).sort({ timestamp: -1 }).limit(5);
    const schedule = await Schedule.find({ userId });

    res.json({ activities, schedule });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
